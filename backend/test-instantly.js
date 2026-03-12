require('dotenv').config();
const { getCampaignSenderEmail } = require('./services/instantly');

async function test() {
  try {
    const campaignId = process.env.INSTANTLY_CAMPAIGN_ID;
    console.log(`Testing sender extraction for campaign: ${campaignId}`);
    
    const senderEmail = await getCampaignSenderEmail(campaignId);
    console.log(`Result: ${senderEmail}`);
    
    if (senderEmail && senderEmail.includes('@')) {
      console.log('✅ Success! Extracted a valid email.');
    } else {
      console.log('⚠️ Failed to extract a valid email (or using fallback).');
    }
  } catch (err) {
    console.error('Test Error:', err.message);
  }
}

test();
