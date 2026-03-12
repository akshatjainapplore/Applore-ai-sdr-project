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

module.exports = router;
