require('dotenv').config();
const axios = require('axios');

async function probeVibe() {
  const apiKey = process.env.VIBE_API_KEY;
  const endpoints = [
    "https://api.explorium.ai/v1/businesses",
    "https://api.explorium.ai/api/v1/businesses",
    "https://vibeprospecting.explorium.ai/api/v1/businesses",
    "https://vibeprospecting.explorium.ai/api/companies/search" // current
  ];

  for (const url of endpoints) {
    console.log(`\n🔍 Probing: ${url} ...`);
    try {
      const res = await axios.post(url, {
        filters: {
          industry: ["Software"],
          size: { min: 50, max: 100 }
        },
        limit: 1
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ Success! Response:`, JSON.stringify(res.data).slice(0, 100));
    } catch (err) {
      console.log(`❌ Failed: ${err.response?.status || err.message} - ${JSON.stringify(err.response?.data || "").slice(0, 50)}`);
    }
  }
}

probeVibe();
