const router = require("express").Router();
const supabase = require("../db/client");

// GET all prospects with optional filters
router.get("/", async (req, res) => {
  try {
    const { status, sector, country, is_hot, search, limit = 50, offset = 0 } = req.query;
    let query = supabase.from("prospects").select("*, scripts(*)").order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    if (sector) query = query.eq("sector", sector);
    if (country) query = query.eq("country", country);
    if (is_hot) query = query.eq("is_hot", is_hot === "true");
    if (search) query = query.ilike("company_name", `%${search}%`);
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single prospect
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("prospects").select("*, scripts(*)").eq("id", req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update prospect
router.patch("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("prospects").update(req.body).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE prospect
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase.from("prospects").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST import leads from Instantly (API or CSV)
router.post("/import", async (req, res) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads)) return res.status(400).json({ error: "Leads array is required" });

    const results = { imported: 0, skipped: 0, errors: [] };
    const { processProspect, getCampaignSenderEmail } = require("../services/scheduler");
    const { getCampaignSenderEmail: getSender } = require("../services/instantly");

    // Get sender email once for the batch
    const campaignId = process.env.INSTANTLY_CAMPAIGN_ID;
    const senderEmail = await getSender(campaignId);

    for (const lead of leads) {
      try {
        // 1. Check for duplicate
        const { data: existing } = await supabase
          .from("prospects")
          .select("id")
          .eq("company_name", lead.companyName)
          .maybeSingle();

        if (existing) {
          results.skipped++;
          continue;
        }

        // 2. Insert new prospect
        const { data: prospect, error: insErr } = await supabase
          .from("prospects")
          .insert({
            company_name: lead.companyName,
            website: lead.website || "",
            status: "researching",
            verified_email: lead.email,
            decision_maker_name: `${lead.firstName || ""} ${lead.lastName || ""}`.trim()
          })
          .select()
          .single();

        if (insErr || !prospect) throw new Error(insErr?.message || "Failed to insert prospect");

        results.imported++;

        // 3. Trigger enrichment asynchronously (don't wait for it to finish)
        processProspect(prospect.id, senderEmail).catch(err => 
          console.error(`Async enrichment failed for ${lead.companyName}:`, err.message)
        );

      } catch (err) {
        results.errors.push(`${lead.companyName}: ${err.message}`);
      }
    }

    res.json(results);
  } catch (err) {
    console.error("Import failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST manually push to Instantly
router.post("/:id/push-to-instantly", async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;
    const { id } = req.params;

    if (!email) return res.status(400).json({ error: "Email is required" });

    // 1. Fetch prospect and their email scripts
    const { data: prospect, error: pErr } = await supabase
      .from("prospects")
      .select("*, scripts(*)")
      .eq("id", id)
      .single();

    if (pErr || !prospect) return res.status(404).json({ error: "Prospect not found" });

    const scripts = prospect.scripts?.[0];
    if (!scripts) return res.status(400).json({ error: "No scripts found for this prospect. Please re-run scripting." });

    // 2. Prepare Instantly payload
    const { addContact } = require("../services/instantly");
    const email1 = typeof scripts.email_1 === "string" ? JSON.parse(scripts.email_1) : scripts.email_1;

    const instRes = await addContact({
      email,
      firstName: firstName || prospect.decision_maker_name?.split(" ")[0] || "Hi",
      lastName: lastName || prospect.decision_maker_name?.split(" ").slice(1).join(" ") || "",
      companyName: prospect.company_name,
      customFields: {
        company_brief: prospect.company_brief?.slice(0, 200),
        trigger_signal: prospect.trigger_signal?.slice(0, 200),
        email1_subject: email1?.subject,
        email1_opener: email1?.body?.slice(0, 300),
      },
      campaignId: process.env.INSTANTLY_CAMPAIGN_ID
    });

    const contactId = instRes.created_leads?.[0]?.id || instRes.id;

    // 3. Update status in DB
    const { error: uErr } = await supabase
      .from("prospects")
      .update({
        status: "pushed_to_instantly",
        instantly_contact_id: contactId,
        instantly_campaign_id: process.env.INSTANTLY_CAMPAIGN_ID
      })
      .eq("id", id);

    if (uErr) throw uErr;

    res.json({ success: true, contactId });
  } catch (err) {
    console.error("Manual push failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
