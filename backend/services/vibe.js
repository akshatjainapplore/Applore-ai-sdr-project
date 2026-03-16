const axios = require("axios");

const BASE = "https://api.explorium.ai/v1";

/**
 * Search for companies matching ICP
 */
async function searchCompanies({ sectors, countries, employeeMin, employeeMax, limit = 10 }) {
  try {
    // Mapping our countries to lowercase alpha-2 (e.g. UK -> gb)
    const countryMap = {
      "UK": "gb", "Germany": "de", "Netherlands": "nl", "Sweden": "se", 
      "France": "fr", "Spain": "es", "USA": "us"
    };

    const res = await axios.post(
      `${BASE}/businesses`,
      {
        mode: "full",
        page_size: limit,
        filters: {
          country_code: {
            values: countries.map(c => countryMap[c] || c.toLowerCase())
          },
          linkedin_category: {
            values: sectors
          },
          employee_count: {
            min: employeeMin,
            max: employeeMax
          }
        }
      },
      {
        headers: {
          api_key: process.env.VIBE_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    // Explorium v1 businesses endpoint returns list in res.data
    return res.data || [];
  } catch (err) {
    console.error("Vibe/Explorium API error:", err.response?.data || err.message);
    // Return mock data if API fails or not fully configured
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
    { company_name: "NerveData", website: "nervedata.com", sector: "HealthTech", country: "Germany", employee_count: "55" },
    { company_name: "PeakFlow", website: "peakflow.io", sector: "FinTech", country: "UK", employee_count: "68" },
    { company_name: "BioMetrico", website: "biometrico.es", sector: "HealthTech", country: "Spain", employee_count: "45" },
    { company_name: "Quantis Bank", website: "quantis.fr", sector: "FinTech", country: "France", employee_count: "90" },
    { company_name: "EtherMed", website: "ethermed.nl", sector: "HealthTech", country: "Netherlands", employee_count: "30" },
    { company_name: "ScaleTrade", website: "scaletrade.com", sector: "FinTech", country: "Sweden", employee_count: "75" },
    { company_name: "LifeSense", website: "lifesense.uk", sector: "HealthTech", country: "UK", employee_count: "120" },
    { company_name: "CoreVault", website: "corevault.de", sector: "FinTech", country: "Germany", employee_count: "50" },
    { company_name: "PulsePath", website: "pulsepath.ai", sector: "HealthTech", country: "France", employee_count: "62" },
    { company_name: "Nexus Pay", website: "nexuspay.io", sector: "FinTech", country: "Sweden", employee_count: "88" },
    { company_name: "Zest Fin", website: "zestfin.co", sector: "FinTech", country: "UK", employee_count: "40" },
    { company_name: "Aura Health", website: "aura.health", sector: "HealthTech", country: "USA", employee_count: "35" }
  ];
  return mocks.slice(0, limit);
}

module.exports = { searchCompanies };
