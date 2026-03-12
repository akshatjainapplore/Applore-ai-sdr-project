const axios = require("axios");

const BASE = "https://vibeprospecting.explorium.ai/api";

/**
 * Search for companies matching ICP
 */
async function searchCompanies({ sectors, countries, employeeMin, employeeMax, limit = 10 }) {
  try {
    const res = await axios.post(
      `${BASE}/companies/search`,
      {
        sectors,
        countries,
        employee_count: { min: employeeMin, max: employeeMax },
        limit,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.VIBE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data.companies || res.data || [];
  } catch (err) {
    console.error("Vibe Prospecting error:", err.response?.data || err.message);
    // Return mock data if Vibe API not configured — remove when API key active
    return getMockCompanies(sectors, countries, limit);
  }
}

function getMockCompanies(sectors, countries, limit) {
  const mocks = [
    { company_name: "Healthflow AI", website: "healthflow.ai", sector: "HealthTech", country: "UK", employee_count: "55" },
    { company_name: "Finova Labs", website: "finovalabs.com", sector: "FinTech", country: "Germany", employee_count: "62" },
    { company_name: "MedScript Pro", website: "medscriptpro.com", sector: "HealthTech", country: "Netherlands", employee_count: "48" },
    { company_name: "PayBridge EU", website: "paybridgeeu.com", sector: "FinTech", country: "Sweden", employee_count: "70" },
    { company_name: "ClinPath", website: "clinpath.io", sector: "HealthTech", country: "France", employee_count: "58" },
    { company_name: "Ledgr", website: "ledgr.io", sector: "FinTech", country: "Spain", employee_count: "65" },
    { company_name: "VitalSync", website: "vitalsync.health", sector: "HealthTech", country: "UK", employee_count: "52" },
    { company_name: "ClearSettle", website: "clearsettle.com", sector: "FinTech", country: "Germany", employee_count: "73" },
    { company_name: "Diagnobot", website: "diagnobot.ai", sector: "HealthTech", country: "Netherlands", employee_count: "60" },
    { company_name: "KreditAI", website: "kreditai.de", sector: "FinTech", country: "Germany", employee_count: "67" },
  ];
  return mocks.slice(0, limit);
}

module.exports = { searchCompanies };
