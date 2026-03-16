const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Extracts first name from email (e.g. john.doe@applore.in -> John)
 */
function senderNameFromEmail(email) {
  if (!email) return "Rav"; // Fallback to Rav if no email
  const localPart = email.split("@")[0];
  const firstName = localPart.split(".")[0].split("_")[0].split("-")[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

async function researchAndGenerateScripts(prospect, senderEmail) {
  const currentYear = new Date().getFullYear();
  const senderName = senderNameFromEmail(senderEmail);
  
  // 1. Determine if we need web search
  const hasExistingInfo = !!(prospect.company_brief || prospect.trigger_signal);
  const useWebSearch = !hasExistingInfo;
  const model = useWebSearch ? "claude-sonnet-4-20250514" : "claude-haiku-4-5-20251001";
  
  console.log(`🤖 Using model: ${model} (Web search: ${useWebSearch ? "ON" : "OFF"})`);

  const prompt = `You are a senior B2B sales researcher and SDR at Applore Technologies.
Applore: AI-powered product development — embed senior engineers into client teams, ship AI features in 8-12 weeks.

Current year: ${currentYear}.

Company: ${prospect.company_name}
Website: ${prospect.website || "unknown"}
Sector: ${prospect.sector}
Country: ${prospect.country}
${hasExistingInfo ? `Existing Brief: ${prospect.company_brief}\nExisting Trigger: ${prospect.trigger_signal}` : ""}

Task: 
1. Research/Refine company details (brief, trigger, decision maker, LinkedIn query).
2. Write 7 personalised outreach messages (3 emails, 4 LinkedIn).

Return ONLY a valid JSON object with this structure:
{
  "research": {
    "company_brief": "3-4 sentences",
    "trigger_signal": "compelling recent event",
    "decision_maker_title": "CTO/CPO/etc",
    "decision_maker_name": "Name or null",
    "linkedin_search_query": "Exact query",
    "funding_stage": "Stage or Unknown",
    "pain_points": ["point 1", "point 2"]
  },
  "scripts": {
    "email_1": { "subject": "...", "body": "... Sign off: Best regards,\n${senderName}" },
    "email_2": { "subject": "...", "body": "... Sign off: Best regards,\n${senderName}" },
    "email_3": { "subject": "...", "body": "... Sign off: Best regards,\n${senderName}" },
    "linkedin_connection_note": "under 280 chars",
    "linkedin_dm_1": "...",
    "linkedin_dm_2": "...",
    "linkedin_dm_3": "..."
  }
}`;

  let response;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const params = {
        model: model,
        max_tokens: 1200,
        system: "You are a senior SDR & researcher. Respond ONLY with valid JSON. No markdown, no preambles.",
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: "{" }
        ],
      };

      if (useWebSearch) {
        params.tools = [{ type: "web_search_20250305", name: "web_search" }];
      }

      response = await client.messages.create(params);
      break;
    } catch (err) {
      if (err.status === 429 && attempt < 3) {
        console.warn(`⏳ Rate limit hit. Retrying in ${attempt * 20}s...`);
        await new Promise(r => setTimeout(r, attempt * 20000));
      } else {
        throw err;
      }
    }
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("No text response from Claude");
  
  let clean = "{" + textBlock.text;
  clean = clean.replace(/```json|```/g, "").trim();
  
  // Standard cleanup for the pre-filled {
  const lastBrace = clean.lastIndexOf("}");
  if (lastBrace > 0) {
    clean = clean.substring(0, lastBrace + 1);
  }

  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("Parse error. Raw text:", clean);
    throw new Error("Failed to parse Claude response");
  }
}

module.exports = { researchAndGenerateScripts };
