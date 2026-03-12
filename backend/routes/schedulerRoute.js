const router = require("express").Router();
const { runDailyJob } = require("../services/scheduler");

// Manually trigger the daily job
router.post("/run", async (req, res) => {
  res.json({ message: "Daily job triggered — running in background" });
  runDailyJob(); // fire and forget
});

module.exports = router;
