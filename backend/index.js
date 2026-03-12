require("dotenv").config();
const express = require("express");
const cors = require("cors");
const scheduler = require("./services/scheduler");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// Routes
app.use("/api/prospects", require("./routes/prospects"));
app.use("/api/scripts", require("./routes/scripts"));
app.use("/api/pipeline", require("./routes/pipeline"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/scheduler", require("./routes/schedulerRoute"));
app.use("/api/instantly", require("./routes/instantly"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Start autonomous scheduler
scheduler.init();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Applore AI SDR backend running on port ${PORT}`);
  console.log(`🤖 Autonomous scheduler active — runs daily at ${process.env.CRON_TIME_IST || "7:00"} IST`);
});
