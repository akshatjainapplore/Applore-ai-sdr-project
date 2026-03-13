require('dotenv').config();
const axios = require('axios');

async function testManualPush() {
  // Use a prospect ID from the database that is scripted or pending
  // From previous check: '789e3e26-fb8d-4a5b-ab54-67d08fa8fd17' (CoreVault) was scripting
  const prospectId = '7b7a94fb-40ba-4b50-b3d6-4e434cfe1a95'; 
  const testEmail = `verified.test.${Date.now()}@applore.in`;
  
  console.log(`🚀 Testing manual push for prospect ${prospectId}...`);
  try {
    const res = await axios.post(`http://localhost:4000/api/prospects/${prospectId}/push-to-instantly`, {
      email: testEmail,
      firstName: "Verified",
      lastName: "Tester"
    });
    console.log("✅ API Response:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("❌ API Error:", err.response?.status, JSON.stringify(err.response?.data || err.message, null, 2));
  }
}

testManualPush();
