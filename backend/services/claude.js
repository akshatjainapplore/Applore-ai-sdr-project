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

async function researchCompany(company) {
  const currentYear = new Date().getFullYear();
  const prompt = `You are a senior B2B sales researcher for Applore Technologies, an AI product development company.

Current year: ${currentYear}. When researching, prioritize events from the last 2 years (${currentYear-1}-${currentYear}).

Research this company and return a JSON object. Return ONLY valid JSON, no markdown:

Company: ${company.company_name}
Website: ${company.website || "unknown"}
Sector: ${company.sector}
Country: ${company.country}

{
  "company_brief": "3-4 sentence brief: what they do, recent news, funding, pain points relevant to AI product development",
  "trigger_signal": "Single most compelling recent event (ideally from ${currentYear-1} or ${currentYear}) making this a good outreach target right now",
  "decision_maker_title": "Best title to target: CTO / CPO / VP Engineering / Head of Product / CEO",
  "decision_maker_name": "Name if publicly known, otherwise null",
  "linkedin_search_query": "Exact LinkedIn search query e.g. CTO Tandem Bank London",
  "funding_stage": "Seed / Series A / Series B / Series C / Unknown",
  "pain_points": ["pain point 1", "pain point 2", "pain point 3"]
}`;

  let response;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: "You are a senior B2B sales researcher. CRITICAL INSTRUCTION: You must respond ONLY with valid JSON. Under no circumstances should you include conversational text, preambles, or markdown formatting blocks (like ```json). Just the raw JSON object.",
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: "{" }
        ],
      });
      break;
    } catch (err) {
      if (err.status === 429 && attempt < 3) {
        console.warn(`⏳ Rate limit hit in research. Retrying in ${attempt * 20}s...`);
        await new Promise(r => setTimeout(r, attempt * 20000));
      } else {
        throw err;
      }
    }
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("No text response from Claude");
  // Pre-pend the { that we pre-filled
  let clean = "{" + textBlock.text;
  clean = clean.replace(/```json|```/g, "").trim();
  
  while (clean.length > 10) {
    try {
      return JSON.parse(clean);
    } catch (e) {
      const lastBrace = clean.lastIndexOf("}");
      if (lastBrace > 0 && clean.substring(lastBrace + 1).trim() === "") {
        // Remove the very last brace to see if there was an accidental extra one
        clean = clean.substring(0, lastBrace).trim();
        if (!clean.endsWith("}")) clean += "}";
      } else if (lastBrace > 0) {
        // Strip trailing garbage after the last brace
        clean = clean.substring(0, lastBrace + 1);
      } else {
        console.error("Research parse error. Raw:", clean);
        throw new Error("Parse failed");
      }
    }
  }
  
  console.error("Research parse error. Raw:", clean);
  throw new Error("Parse failed");
}

async function generateScripts(prospect, brief, senderEmail) {
  const currentYear = new Date().getFullYear();
  const senderName = senderNameFromEmail(senderEmail);
  const prompt = `You are a senior SDR at Applore Technologies writing personalised outreach for a European ${prospect.sector} company.

Current year: ${currentYear}. CRITICAL: Never reference a year older than ${currentYear} (e.g. don't say "hope your year is going well" if referencing ${currentYear-1}).

Applore: AI-powered product development — embed senior engineers into client teams, ship AI features in 8-12 weeks, no hire overhead.

Company: ${prospect.company_name}
Decision Maker: ${brief.decision_maker_title}${brief.decision_maker_name ? " — " + brief.decision_maker_name : ""}
Brief: ${brief.company_brief}
Trigger: ${brief.trigger_signal}
Pain Points: ${(brief.pain_points || []).join(", ")}

Write 7 outreach messages. Return ONLY valid JSON, no markdown:
{
  "email_1": { "subject": "...", "body": "personalised opener referencing trigger, 3-4 sentences, soft CTA for 20-min call. Sign off: Best regards,\n${senderName}" },
  "email_2": { "subject": "...", "body": "follow-up — engineering pain point + case study angle, 3-4 sentences. Sign off: Best regards,\n${senderName}" },
  "email_3": { "subject": "...", "body": "final nudge — short, respectful, 2-3 sentences. Sign off: Best regards,\n${senderName}" },
  "linkedin_connection_note": "under 280 chars, personalised, references role and trigger",
  "linkedin_dm_1": "After connecting — context + 15-min call ask, 3-4 sentences",
  "linkedin_dm_2": "Case study angle follow-up, 2-3 sentences",
  "linkedin_dm_3": "Final friendly sign-off, 2 sentences"
}`;

  let response;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: "You are a senior SDR. CRITICAL INSTRUCTION: You must respond ONLY with valid JSON. Under no circumstances should you include conversational text, preambles, or markdown formatting blocks (like ```json). Just the raw JSON object.",
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: "{" }
        ],
      });
      break;
    } catch (err) {
      if (err.status === 429 && attempt < 3) {
        console.warn(`⏳ Rate limit hit in scripting. Retrying in ${attempt * 20}s...`);
        await new Promise(r => setTimeout(r, attempt * 20000));
      } else {
        throw err;
      }
    }
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("No script response");
  // Pre-pend the { that we pre-filled
  let clean = "{" + textBlock.text;
  clean = clean.replace(/```json|```/g, "").trim();
  
  while (clean.length > 10) {
    try {
      return JSON.parse(clean);
    } catch (e) {
      const lastBrace = clean.lastIndexOf("}");
      if (lastBrace > 0 && clean.substring(lastBrace + 1).trim() === "") {
        // Remove the very last brace to see if there was an accidental extra one
        clean = clean.substring(0, lastBrace).trim();
        if (!clean.endsWith("}")) clean += "}";
      } else if (lastBrace > 0) {
        // Strip trailing garbage after the last brace
        clean = clean.substring(0, lastBrace + 1);
      } else {
        console.error("Script parse error. Raw:", clean);
        throw new Error("Parse failed");
      }
    }
  }
  
  console.error("Script parse error. Raw:", clean);
  throw new Error("Parse failed");
}

module.exports = { researchCompany, generateScripts };
