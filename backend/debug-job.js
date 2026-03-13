require('dotenv').config();
const { runDailyJob } = require('./services/scheduler');

async function testJob() {
  console.log("🚦 Starting manual job run for debugging...");
  try {
    await runDailyJob();
    console.log("🏁 Manual job run finished.");
  } catch (err) {
    console.error("❌ Manual job run failed:", err);
  }
}

testJob();
