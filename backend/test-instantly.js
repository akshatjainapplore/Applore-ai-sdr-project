require('dotenv').config();
const { getCampaigns } = require('./services/instantly');

async function test() {
  try {
    console.log('Testing Instantly connection...');
    console.log('API Key:', process.env.INSTANTLY_API_KEY ? 'Present' : 'Missing');
    const campaigns = await getCampaigns();
    console.log('Connection successful!');
    console.log('Available Campaigns:');
    campaigns.forEach(c => {
      console.log(`- ${c.name} (ID: ${c.id})`);
    });
  } catch (err) {
    console.error('Instantly Error:', err.response ? err.response.status : err.message);
    if (err.response && err.response.data) {
      console.error('Details:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

test();
