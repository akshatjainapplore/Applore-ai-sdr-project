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
    skip_if_in_workspace: true,
    leads: [
      {
        email,
        first_name: firstName || "",
        last_name: lastName || "",
        company_name: companyName || "",
        custom_variables: customFields || {},
      }
    ]
  };
  const res = await axios.post(`${BASE}/leads/add`, payload, { headers: headers() });
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

async function getCampaignSenderEmail(campaignId) {
  try {
    const id = campaignId || process.env.INSTANTLY_CAMPAIGN_ID;
    const res = await axios.get(`${BASE}/campaigns/${id}`, {
      headers: headers(),
    });
    // v2 typically returns campaign details in res.data
    const campaign = res.data;
    const accounts = campaign.email_accounts || campaign.accounts || [];
    if (accounts.length > 0) {
      // Return the email field from the first account object
      return accounts[0].email || accounts[0];
    }
    return process.env.SENDER_EMAIL || "rav@applore.in";
  } catch (err) {
    console.error("Instantly fetch sender failed:", err.message);
    return process.env.SENDER_EMAIL || "rav@applore.in";
  }
}

async function getLeadStatus(email) {
  const res = await axios.get(`${BASE}/leads`, {
    headers: headers(),
    params: { email },
  });
  return res.data;
}

module.exports = { addContact, getCampaigns, getCampaignAnalytics, getLeadStatus, getCampaignSenderEmail };
