/**
 * DeepSeek Chat Completions API (OpenAI-compatible).
 * Env: DEEPSEEK_API_KEY (required), DEEPSEEK_BASE_URL, DEEPSEEK_MODEL.
 */

const BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

const SYSTEM_PROMPT = `You are an AI assistant for a human Dungeon Master running a post-apocalyptic tabletop adventure. Use the current turn and conversation to suggest how the story could progress. You must output exactly one valid JSON object with no Markdown, code fences, or extra text.

The JSON must contain exactly these fields with the stated types:
- dm_read_aloud: string, an atmospheric passage of roughly 80–160 words for the human DM to read or adapt.
- choices: an array of exactly 4 items shaped as { "id": "1"|"2"|"3"|"4", "text": string }, each a concise suggested player action.
- dm_private: an object containing:
  - scene_summary: string, a brief summary of the current scene;
  - hidden_info: string[], information hidden from the players;
  - checks: string[], optional rule or ability-check prompts for the human DM;
  - state_delta: object[], any state changes;
  - next_turn_suggestion: string, a suggestion for the next turn.
- need_clarify: boolean, whether the human DM should clarify a player action.
- clarify_question: string, the clarification question when need_clarify is true, otherwise an empty string.

Write all generated content in the language requested by the user message. The human DM remains in control: provide suggestions and private notes rather than presenting yourself as an autonomous DM.`;

function buildUserMessage({ turnOwner, transcriptWindow, sessionState, language }) {
  const stateObj = sessionState && typeof sessionState === "object" ? sessionState : {};
  const history = Array.isArray(stateObj.history) ? stateObj.history : [];
  const joinedHistory = history.join("\n");
  return `Current turn owner: ${turnOwner || "DM"}
Recent conversation (transcriptWindow):
${JSON.stringify(transcriptWindow || [], null, 0)}

History (chronological, one entry per line): ${joinedHistory || "None"}

Output language: ${language === "zh" ? "Simplified Chinese" : "English"}.
Return only the required JSON object, with no prefix, suffix, or explanation.`;
}

function parseResponse(text) {
  const trimmed = String(text).trim();
  let parsed;
  try {
    // Tolerate an accidental Markdown code fence.
    const noCodeBlock = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
    parsed = JSON.parse(noCodeBlock);
  } catch (e) {
    return null;
  }
  if (!parsed || typeof parsed.dm_read_aloud !== "string" || !Array.isArray(parsed.choices)) {
    return null;
  }
  // Normalize each choice to at least an id and text.
  parsed.choices = parsed.choices.slice(0, 4).map((c, i) => ({
    id: String(c?.id ?? i + 1),
    text: String(c?.text ?? "").slice(0, 54)
  }));
  if (!parsed.dm_private || typeof parsed.dm_private !== "object") {
    parsed.dm_private = {
      scene_summary: "",
      hidden_info: [],
      checks: [],
      state_delta: [],
      next_turn_suggestion: ""
    };
  }
  parsed.need_clarify = Boolean(parsed.need_clarify);
  parsed.clarify_question = typeof parsed.clarify_question === "string" ? parsed.clarify_question : "";
  return parsed;
}

async function doChatCompletion(apiKey, body, retryOnlyJson = false) {
  const url = `${BASE_URL.replace(/\/$/, "")}/v1/chat/completions`;
  const messages = [...body.messages];
  if (retryOnlyJson) {
    messages.push({
      role: "user",
      content: "Try again. Return exactly one valid JSON object with no Markdown or extra text. Write all content in English."
    });
  }
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ ...body, messages })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek API ${res.status}: ${errText}`);
  }
  return res.json();
}

export async function deepseekNext({ turnOwner, transcriptWindow, sessionState, language = "en" }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error("DEEPSEEK_API_KEY is required");
  }

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage({ turnOwner, transcriptWindow, sessionState, language }) }
    ],
    temperature: 0.7,
    max_tokens: 1024
  };

  let data = await doChatCompletion(apiKey, body, false);
  const content = data?.choices?.[0]?.message?.content;
  if (content == null) {
    throw new Error("DeepSeek API: no content in response");
  }

  let out = parseResponse(content);
  if (out) return out;

  const data2 = await doChatCompletion(apiKey, body, true);
  const content2 = data2?.choices?.[0]?.message?.content;
  out = content2 != null ? parseResponse(content2) : null;
  if (out) return out;

  throw new Error("DeepSeek API: response was not valid JSON");
}

function parseSummaryResponse(text) {
  const trimmed = String(text).trim();
  let parsed;
  try {
    const noCodeBlock = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
    parsed = JSON.parse(noCodeBlock);
  } catch (e) {
    return null;
  }
  if (!parsed || typeof parsed.summary !== "string") {
    return null;
  }
  return parsed;
}

export async function deepseekSummarizeHistory({ historyToSummarize }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error("DEEPSEEK_API_KEY is required");
  }

  const body = {
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You summarize older history for a human Dungeon Master running a post-apocalyptic tabletop adventure. Produce a concise English summary covering the current location, important NPCs, active quests, key items, player state, and unresolved clues. Return only JSON shaped as {\"summary\":\"...\"}, with no other fields or text."
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            history_to_summarize: historyToSummarize
          },
          null,
          0
        )
      }
    ],
    temperature: 0.4,
    max_tokens: 512
  };

  let data = await doChatCompletion(apiKey, body, false);
  let content = data?.choices?.[0]?.message?.content;
  let out = content != null ? parseSummaryResponse(content) : null;
  if (out) return out.summary;

  const data2 = await doChatCompletion(apiKey, body, true);
  content = data2?.choices?.[0]?.message?.content;
  out = content != null ? parseSummaryResponse(content) : null;
  if (out) return out.summary;

  throw new Error("DeepSeek summarize: response was not valid JSON");
}

