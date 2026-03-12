const router = require("express").Router();
const supabase = require("../db/client");

// GET pipeline summary stats
router.get("/summary", async (req, res) => {
  try {
    const { data: prospects } = await supabase.from("prospects").select("status, is_hot, meeting_booked, replied, sector, country");

    const total = prospects?.length || 0;
    const byStatus = {};
    const byStage = { researching: 0, scripted: 0, pushed_to_instantly: 0, linkedin_pending: 0, replied: 0, meeting_booked: 0, dead: 0 };

    for (const p of prospects || []) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      if (byStage[p.status] !== undefined) byStage[p.status]++;
    }

    const hotProspects = prospects?.filter((p) => p.is_hot).length || 0;
    const meetingsBooked = prospects?.filter((p) => p.meeting_booked).length || 0;
    const replied = prospects?.filter((p) => p.replied).length || 0;

    // Last scheduler run
    const { data: lastRun } = await supabase
      .from("scheduler_log")
      .select("*")
      .order("run_at", { ascending: false })
      .limit(1)
      .single();

    res.json({ total, byStatus, byStage, hotProspects, meetingsBooked, replied, lastRun });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET hot prospects
router.get("/hot", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("prospects")
      .select("*, scripts(*)")
      .eq("is_hot", true)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET scheduler logs
router.get("/logs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("scheduler_log")
      .select("*")
      .order("run_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
