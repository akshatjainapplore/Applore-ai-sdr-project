require('dotenv').config();
const { addContact } = require('./services/instantly');

async function verifyService() {
  try {
    const testLead = {
      email: `service.test.${Date.now()}@applore.in`,
      firstName: "Service",
      lastName: "Test",
      companyName: "Applore Service",
      customFields: {
        company_brief: "Testing updated instantly.js",
        trigger_signal: "Service verification run",
        email1_subject: "Live from Service",
        email1_opener: "This is a service test"
      }
    };
    
    console.log("🚀 Testing instantly.addContact with payload:", JSON.stringify(testLead, null, 2));
    const result = await addContact(testLead);
    console.log("✅ API Response:", JSON.stringify(result, null, 2));
    
    const contactId = result.created_leads?.[0]?.id || result.id;
    if (contactId) {
      console.log("🎯 Successfully extracted contact ID:", contactId);
    } else {
      console.log("⚠️ No contact ID found in response.");
    }
    
  } catch (err) {
    if (err.response) {
      console.error("❌ API Error:", err.response.status, JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("❌ Error:", err.message);
    }
  }
}

verifyService();
