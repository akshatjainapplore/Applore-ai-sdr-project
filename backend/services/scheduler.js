const cron = require("node-cron");
const supabase = require("../db/client");
const { searchCompanies } = require("./vibe");
const { researchAndGenerateScripts } = require("./claude");
const { addContact, getCampaignSenderEmail } = require("./instantly");

let isRunning = false;
let queue = [];
let processingQueue = false;

async function addToQueue(prospectId, senderEmail) {
  queue.push({ prospectId, senderEmail });
  if (!processingQueue) {
    runQueue();
  }
}

async function runQueue() {
  processingQueue = true;
  while (queue.length > 0) {
    const { prospectId, senderEmail } = queue.shift();
    try {
      await processProspect(prospectId, senderEmail);
    } catch (err) {
      console.error("Queue process error:", err.message);
    }
  }
  processingQueue = false;
}

async function runDailyJob() {
  if (isRunning) {
    console.log("⏳ Daily job already running, skipping...");
    return;
  }
  isRunning = true;
  console.log("🚀 Daily AI SDR job started at", new Date().toISOString());

  // Create log entry
  const { data: log } = await supabase
    .from("scheduler_log")
    .insert({ status: "running" })
    .select()
    .single();

  const logId = log?.id;
  const stats = { leads_discovered: 0, leads_researched: 0, leads_scripted: 0, leads_pushed_to_instantly: 0 };
  const errors = [];

  try {
    // 1. Load settings
    const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
    const cfg = settings || {};
    const sectors = cfg.sectors || ["HealthTech", "FinTech"];
    const countries = cfg.countries || ["UK", "Germany", "Netherlands", "Sweden", "France", "Spain"];
    const dailyTarget = cfg.daily_lead_target || 10;
    const campaignId = process.env.INSTANTLY_CAMPAIGN_ID;
    const senderEmail = await getCampaignSenderEmail(campaignId);
    console.log(`📧 Using sender email: ${senderEmail}`);

    // 2. Get existing company names to avoid duplicates
    const { data: existing } = await supabase.from("prospects").select("company_name");
    const existingNames = new Set((existing || []).map((p) => p.company_name.toLowerCase()));

    // 3. Discover new companies
    const discovered = await searchCompanies({
      sectors, countries,
      employeeMin: cfg.employee_min || 50,
      employeeMax: cfg.employee_max || 75,
      limit: dailyTarget + 5, // fetch extra in case some are duplicates
    });

    const newCompanies = discovered.filter(
      (c) => !existingNames.has(c.company_name.toLowerCase())
    ).slice(0, dailyTarget);

    stats.leads_discovered = newCompanies.length;
    console.log(`✅ Discovered ${newCompanies.length} new companies`);

    // 4. Process each company
    for (const company of newCompanies) {
      try {
        // Insert prospect
        const { data: prospect, error: insErr } = await supabase
          .from("prospects")
          .insert({
            company_name: company.company_name,
            website: company.website,
            sector: company.sector,
            country: company.country,
            employee_count: company.employee_count?.toString(),
            status: "researching",
          })
          .select()
          .single();

        if (insErr || !prospect) continue;

        await processProspect(prospect.id, senderEmail);
        stats.leads_researched++; // Approx increments
        stats.leads_scripted++;
        
      } catch (companyErr) {
        console.error(`Error processing ${company.company_name}:`, companyErr.message);
        errors.push(`${company.company_name}: ${companyErr.message}`);
      }
    }

    // Update log
    if (logId) {
      await supabase.from("scheduler_log").update({
        ...stats,
        errors: errors.length ? errors.join("\n") : null,
        status: "completed",
      }).eq("id", logId);
    }

    console.log("✅ Daily job complete:", stats);
  } catch (err) {
    console.error("❌ Daily job failed:", err);
    if (logId) {
      await supabase.from("scheduler_log").update({
        status: "failed",
        errors: err.message,
      }).eq("id", logId);
    }
  } finally {
    isRunning = false;
  }
}

async function processProspect(prospectId, senderEmail) {
  let prospect;
  try {
    // 1. Fetch prospect full data
    const res = await supabase.from("prospects").select("*").eq("id", prospectId).single();
    prospect = res.data;
    if (res.error || !prospect) throw new Error("Prospect not found: " + prospectId);

    // 2. Check for cached research
    console.log(`🔍 Checking cache for ${prospect.company_name}...`);
    const { data: cached } = await supabase
      .from("prospects")
      .select("company_brief, trigger_signal, decision_maker_title, decision_maker_name, linkedin_search_query, funding_stage")
      .eq("company_name", prospect.company_name)
      .not("company_brief", "is", null)
      .neq("id", prospectId)
      .limit(1)
      .maybeSingle();

    let researchData;
    let scripts;

    if (cached) {
      console.log(`♻️ Reusing cached research for ${prospect.company_name}`);
      researchData = cached;
      // Since we are reusing research, we still need scripts. 
      // We pass the cached research to Claude to generate scripts via Haiku.
      const result = await researchAndGenerateScripts({ ...prospect, ...cached }, senderEmail);
      scripts = result.scripts;
    } else {
      console.log(`🧠 No cache found. Calling Claude for ${prospect.company_name}...`);
      const result = await researchAndGenerateScripts(prospect, senderEmail);
      researchData = result.research;
      scripts = result.scripts;
    }

    // Update with research
    await supabase.from("prospects").update({
      company_brief: researchData.company_brief,
      trigger_signal: researchData.trigger_signal,
      decision_maker_title: researchData.decision_maker_title,
      decision_maker_name: researchData.decision_maker_name,
      linkedin_search_query: researchData.linkedin_search_query,
      funding_stage: researchData.funding_stage,
      status: "scripted",
    }).eq("id", prospectId);

    // 3. Save scripts
    await supabase.from("scripts").insert({
      prospect_id: prospectId,
      email_1: JSON.stringify(scripts.email_1),
      email_2: JSON.stringify(scripts.email_2),
      email_3: JSON.stringify(scripts.email_3),
      linkedin_connection_note: scripts.linkedin_connection_note,
      linkedin_dm_1: scripts.linkedin_dm_1,
      linkedin_dm_2: scripts.linkedin_dm_2,
      linkedin_dm_3: scripts.linkedin_dm_3,
    });

    // 4. Handle Final Stage
    const campaignId = process.env.INSTANTLY_CAMPAIGN_ID;

    // Get verified email from column or notes fallback
    let verifiedEmail = prospect.verified_email || 
      (prospect.notes?.startsWith("verified_email:") ? prospect.notes.replace("verified_email:", "") : null);

    // FIX: If notes contained an error, it might look like "email@domain.com | error: ..."
    if (verifiedEmail && verifiedEmail.includes("|")) {
      verifiedEmail = verifiedEmail.split("|")[0].trim();
    }

    if (verifiedEmail) {
      // Auto-push back to Instantly if email is verified
      console.log(`⚡ Auto-pushing ${prospect.company_name} to Instantly (${verifiedEmail})...`);
      const email1 = typeof scripts.email_1 === "string" ? JSON.parse(scripts.email_1) : scripts.email_1;

      const instRes = await addContact({
        email: verifiedEmail,
        firstName: researchData.decision_maker_name?.split(" ")[0] || "Hi",
        lastName: researchData.decision_maker_name?.split(" ").slice(1).join(" ") || "",
        companyName: prospect.company_name,
        customFields: {
          company_brief: researchData.company_brief?.slice(0, 200),
          trigger_signal: researchData.trigger_signal?.slice(0, 200),
          email1_subject: email1?.subject,
          email1_opener: email1?.body?.slice(0, 300),
        },
        campaignId
      });

      const contactId = instRes.created_leads?.[0]?.id || instRes.id;
      
      if (!contactId) {
        throw new Error("Instantly push failed: No contact ID returned. Response: " + JSON.stringify(instRes));
      }

      await supabase.from("prospects").update({
        status: "pushed_to_instantly",
        instantly_contact_id: contactId,
        instantly_campaign_id: campaignId,
      }).eq("id", prospectId);
      
      console.log(`✅ Pushed ${prospect.company_name} back to Instantly`);
    } else {
      // No verified email, stop at linkedin_pending
      await supabase.from("prospects").update({ 
        status: "linkedin_pending",
        linkedin_url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(researchData.linkedin_search_query || "")}`,
      }).eq("id", prospectId);
      console.log(`✅ Lead ${prospect.company_name} ready for manual verification`);
    }

  } catch (err) {
    console.error(`❌ Error in processProspect (${prospectId}):`, err.message);
    const errorMsg = `error: ${err.message}`.slice(0, 500);
    await supabase.from("prospects").update({ 
      status: "failed",
      notes: (prospect?.notes ? prospect.notes + " | " : "") + errorMsg
    }).eq("id", prospectId);
  } finally {
    // Strict 65-second delay to accommodate Anthropic 30,000 TPM limit
    // Doing it in finally ensures we don't spam if a lead fails
    await new Promise((r) => setTimeout(r, 65000));
  }
}

function init() {
  // Convert 7:00 IST to UTC (IST = UTC+5:30, so 7:00 IST = 1:30 UTC)
  const cronHour = parseInt(process.env.CRON_HOUR_UTC || "1");
  const cronMinute = parseInt(process.env.CRON_MINUTE_UTC || "30");

  const cronExpr = `${cronMinute} ${cronHour} * * *`;
  console.log(`⏰ Scheduler set: ${cronExpr} UTC (7:00 IST)`);

  cron.schedule(cronExpr, () => {
    console.log("⏰ Cron triggered — starting daily job");
    runDailyJob();
  });
}

module.exports = { init, runDailyJob, processProspect, addToQueue };
