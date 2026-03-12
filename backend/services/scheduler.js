const cron = require("node-cron");
const supabase = require("../db/client");
const { searchCompanies } = require("./vibe");
const { researchCompany, generateScripts } = require("./claude");
const { addContact } = require("./instantly");

let isRunning = false;

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
        const { data: prospect } = await supabase
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

        if (!prospect) continue;

        // Research
        console.log(`🔍 Researching ${company.company_name}...`);
        const brief = await researchCompany(company);
        stats.leads_researched++;

        // Update with research
        await supabase.from("prospects").update({
          company_brief: brief.company_brief,
          trigger_signal: brief.trigger_signal,
          decision_maker_title: brief.decision_maker_title,
          decision_maker_name: brief.decision_maker_name,
          linkedin_search_query: brief.linkedin_search_query,
          funding_stage: brief.funding_stage,
          status: "scripting",
        }).eq("id", prospect.id);

        // Generate scripts
        console.log(`✍️ Writing scripts for ${company.company_name}...`);
        const scripts = await generateScripts(prospect, brief);
        stats.leads_scripted++;

        await supabase.from("scripts").insert({
          prospect_id: prospect.id,
          email_1: JSON.stringify(scripts.email_1),
          email_2: JSON.stringify(scripts.email_2),
          email_3: JSON.stringify(scripts.email_3),
          linkedin_connection_note: scripts.linkedin_connection_note,
          linkedin_dm_1: scripts.linkedin_dm_1,
          linkedin_dm_2: scripts.linkedin_dm_2,
          linkedin_dm_3: scripts.linkedin_dm_3,
        });

        await supabase.from("prospects").update({ status: "scripted" }).eq("id", prospect.id);

        // Push to Instantly if API key configured
        if (process.env.INSTANTLY_API_KEY && process.env.INSTANTLY_CAMPAIGN_ID) {
          try {
            const email1 = typeof scripts.email_1 === "string" ? JSON.parse(scripts.email_1) : scripts.email_1;
            const contactEmail = `${company.company_name.toLowerCase().replace(/\s+/g, ".")}@${company.website?.replace("https://", "").replace("http://", "") || "unknown.com"}`;

            await addContact({
              email: contactEmail,
              firstName: brief.decision_maker_name?.split(" ")[0] || "Hi",
              lastName: brief.decision_maker_name?.split(" ").slice(1).join(" ") || "",
              companyName: company.company_name,
              customFields: {
                company_brief: brief.company_brief?.slice(0, 200),
                trigger_signal: brief.trigger_signal?.slice(0, 200),
                email1_subject: email1?.subject,
                email1_opener: email1?.body?.slice(0, 300),
              },
            });

            await supabase.from("prospects").update({
              status: "pushed_to_instantly",
              linkedin_url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(brief.linkedin_search_query || "")}`,
            }).eq("id", prospect.id);

            stats.leads_pushed_to_instantly++;
            console.log(`⚡ Pushed ${company.company_name} to Instantly`);
          } catch (instErr) {
            console.error(`Instantly push failed for ${company.company_name}:`, instErr.message);
            await supabase.from("prospects").update({ status: "linkedin_pending" }).eq("id", prospect.id);
          }
        } else {
          await supabase.from("prospects").update({ status: "linkedin_pending" }).eq("id", prospect.id);
        }

        // Strict 65-second delay to accommodate Anthropic 30,000 TPM limit + Web Search tokens
        await new Promise((r) => setTimeout(r, 65000));

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

module.exports = { init, runDailyJob };
