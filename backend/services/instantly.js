const axios = require("axios");

const BASE = "https://api.instantly.ai/api/v1";

function headers() {
  return { Authorization: `Bearer ${process.env.INSTANTLY_API_KEY}` };
}

async function addContact({ email, firstName, lastName, companyName, customFields, campaignId }) {
  const payload = {
    api_key: process.env.INSTANTLY_API_KEY,
    campaign_id: campaignId || process.env.INSTANTLY_CAMPAIGN_ID,
    email,
    first_name: firstName || "",
    last_name: lastName || "",
    company_name: companyName || "",
    custom_variables: customFields || {},
  };
  const res = await axios.post(`${BASE}/lead/add`, payload);
  return res.data;
}

async function getCampaigns() {
  const res = await axios.get(`${BASE}/campaign/list`, {
    params: { api_key: process.env.INSTANTLY_API_KEY, limit: 20, skip: 0 },
  });
  return res.data;
}

async function getCampaignAnalytics(campaignId) {
  const res = await axios.get(`${BASE}/analytics/campaign/summary`, {
    params: { api_key: process.env.INSTANTLY_API_KEY, campaign_id: campaignId },
  });
  return res.data;
}

async function getLeadStatus(email) {
  const res = await axios.get(`${BASE}/lead/get`, {
    params: { api_key: process.env.INSTANTLY_API_KEY, email },
  });
  return res.data;
}

module.exports = { addContact, getCampaigns, getCampaignAnalytics, getLeadStatus };
