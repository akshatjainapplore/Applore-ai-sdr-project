const router = require("express").Router();
const supabase = require("../db/client");

// GET scripts for a prospect
router.get("/:prospectId", async (req, res) => {
  try {
    const { data, error } = await supabase.from("scripts").select("*").eq("prospect_id", req.params.prospectId).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update a script
router.patch("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("scripts").update(req.body).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
