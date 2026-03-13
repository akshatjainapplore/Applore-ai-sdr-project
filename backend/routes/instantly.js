const router = require("express").Router();
const { getCampaigns, getCampaignAnalytics } = require("../services/instantly");

router.get("/campaigns", async (req, res) => {
  try {
    const data = await getCampaigns();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/analytics/:campaignId", async (req, res) => {
  try {
    const data = await getCampaignAnalytics(req.params.campaignId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/leads", async (req, res) => {
  try {
    const { getCampaignLeads } = require("../services/instantly");
    const data = await getCampaignLeads(req.query.campaignId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
