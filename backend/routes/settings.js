const router = require("express").Router();
const supabase = require("../db/client");

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
    if (error) throw error;
    // Mask API keys
    if (data) {
      if (data.instantly_api_key) data.instantly_api_key = "sk-****" + data.instantly_api_key.slice(-4);
      if (data.vibe_api_key) data.vibe_api_key = "****" + data.vibe_api_key.slice(-4);
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("settings").update({ ...req.body, updated_at: new Date() }).eq("id", 1).select().single();
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
