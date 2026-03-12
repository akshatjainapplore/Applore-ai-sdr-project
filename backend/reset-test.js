require("dotenv").config();
const supabase = require("./db/client");

async function resetAndTest() {
  console.log("Updating daily target to 2...");
  await supabase.from("settings").update({ daily_lead_target: 2 }).eq("id", 1);
  
  console.log("Deleting stuck prospects...");
  await supabase.from("prospects").delete().eq("status", "researching");
  
  console.log("Done resetting DB for test run!");
}

resetAndTest();
