const axios = require("axios");

const BASE = "https://api.instantly.ai/api/v2";

function headers() {
  return { 
    Authorization: `Bearer ${process.env.INSTANTLY_API_KEY}`,
    'Content-Type': 'application/json'
  };
}

async function addContact({ email, firstName, lastName, companyName, customFields, campaignId }) {
  const payload = {
    campaign_id: campaignId || process.env.INSTANTLY_CAMPAIGN_ID,
    email,
    first_name: firstName || "",
    last_name: lastName || "",
    company_name: companyName || "",
    custom_variables: customFields || {},
  };
  const res = await axios.post(`${BASE}/leads`, payload, { headers: headers() });
  return res.data;
}

async function getCampaigns() {
  const res = await axios.get(`${BASE}/campaigns`, {
    headers: headers(),
    params: { limit: 20, skip: 0 },
  });
  return res.data;
}

async function getCampaignAnalytics(campaignId) {
  const res = await axios.get(`${BASE}/analytics/campaign/summary`, {
    headers: headers(),
    params: { campaign_id: campaignId },
  });
  return res.data;
}

async function getLeadStatus(email) {
  const res = await axios.get(`${BASE}/leads`, {
    headers: headers(),
    params: { email },
  });
  return res.data;
}

module.exports = { addContact, getCampaigns, getCampaignAnalytics, getLeadStatus };
