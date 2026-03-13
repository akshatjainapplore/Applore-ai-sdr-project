require('dotenv').config();
const { addContact } = require('./services/instantly');

async function debugPush() {
  try {
    const testLead = {
      email: `test.${Date.now()}@applore.in`,
      firstName: "Debug",
      lastName: "User",
      companyName: "Applore Debug",
      customFields: {
        company_brief: "Testing Instantly v2 push",
        trigger_signal: "Manual debug run",
        email1_subject: "Hello from Debug",
        email1_opener: "This is a test opener"
      }
    };
    
    const campaignId = process.env.INSTANTLY_CAMPAIGN_ID;
    const payload = {
      campaign_id: campaignId,
      skip_if_in_workspace: true,
      leads: [
        {
          email: testLead.email,
          first_name: testLead.firstName,
          last_name: testLead.lastName,
          company_name: testLead.companyName,
          custom_variables: testLead.customFields
        }
      ]
    };
    
    console.log("🚀 Testing lead push with /leads/add payload:", JSON.stringify(payload, null, 2));
    const axios = require('axios');
    const headers = { 
      Authorization: `Bearer ${process.env.INSTANTLY_API_KEY}`,
      'Content-Type': 'application/json'
    };
    const res = await axios.post("https://api.instantly.ai/api/v2/leads/add", payload, { headers });
    console.log("✅ API Response:", JSON.stringify(res.data, null, 2));
    
  } catch (err) {
    if (err.response) {
      console.error("❌ API Error:", err.response.status, JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("❌ Error:", err.message);
    }
  }
}

debugPush();
