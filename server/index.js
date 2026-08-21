import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { getNextStub } from "./llm_stub.js";
import { deepseekNext, deepseekSummarizeHistory } from "./llm_deepseek.js";

const PORT = 8787;
const MAX_HISTORY = 40;
const SUMMARIZE_CHUNK = 25;
const KEEP_LAST = 15;

const app = express();
app.use(cors());
app.use(express.json());

function getProvider() {
  const p = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (p === "stub") return "stub";
  const hasKey = !!process.env.DEEPSEEK_API_KEY?.trim();
  if (p === "deepseek") return hasKey ? "deepseek" : "stub";
  return hasKey ? "deepseek" : "stub";
}

function normalizeSessionState(raw) {
  const base = raw && typeof raw === "object" ? raw : {};
  const history = Array.isArray(base.history) ? base.history.map((h) => String(h)) : [];
  const next = {
    ...base,
    history
  };
  return next;
}

async function compressSessionStateIfNeeded(sessionState) {
  const history = Array.isArray(sessionState.history) ? sessionState.history : [];
  if (history.length <= MAX_HISTORY) {
    return sessionState;
  }
  const baseHistory = history.slice();
  let startIndex = 0;
  if (baseHistory[0] && typeof baseHistory[0] === "string" && baseHistory[0].startsWith("SUMMARY:")) {
    startIndex = 0;
  }
  const toSummarize = baseHistory.slice(startIndex, startIndex + SUMMARIZE_CHUNK);
  const recent = baseHistory.slice(-KEEP_LAST);
  try {
    const summary = await deepseekSummarizeHistory({
      historyToSummarize: toSummarize
    });
    const summaryLine = `SUMMARY: ${summary}`;
    return {
      ...sessionState,
      history: [summaryLine, ...recent]
    };
  } catch (err) {
    console.warn("[LLM] summarize failed, skip compression:", err?.message ?? err);
    return sessionState;
  }
}

app.post("/api/next", async (req, res) => {
  const provider = getProvider();
  const body = req.body || {};
  const { turnOwner, transcriptWindow, sessionState } = body;
  const language = body.language === "zh" ? "zh" : "en";

  try {
    let data;
    if (provider === "deepseek") {
      try {
        let effectiveSession = normalizeSessionState(sessionState);
        effectiveSession = await compressSessionStateIfNeeded(effectiveSession);
        data = await deepseekNext({
          turnOwner,
          transcriptWindow,
          sessionState: effectiveSession,
          language
        });
        console.log("[LLM] provider=deepseek model=" + (process.env.DEEPSEEK_MODEL || "deepseek-chat"));
      } catch (err) {
        console.warn("[LLM] DeepSeek failed, fallback to stub:", err?.message ?? err);
        data = await getNextStub(language);
      }
    } else {
      data = await getNextStub(language);
      console.log("[LLM] provider=stub (no DEEPSEEK_API_KEY or LLM_PROVIDER=stub)");
    }
    res.json(data);
  } catch (err) {
    console.error("Error in /api/next:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(rawMessage, excludeSocket) {
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN && client !== excludeSocket) {
      client.send(rawMessage);
    }
  }
}

wss.on("connection", (ws) => {
  ws.send(
    JSON.stringify({
      type: "system",
      message: "Connected to DnD DM helper WebSocket server."
    })
  );

  ws.on("message", (message) => {
    const text = message.toString();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("Received non-JSON message:", text);
      return;
    }

    // Supported types: transcript / dm_push / choice_selected
    const { type } = parsed || {};
    if (!["transcript", "dm_push", "choice_selected"].includes(type)) {
      console.warn("Unknown message type:", type);
    }

    broadcast(JSON.stringify(parsed), ws);
  });

  ws.on("close", () => {
    // No type-specific handling is needed yet.
  });
});

server.listen(PORT, () => {
  const provider = getProvider();
  console.log(`HTTP & WebSocket server listening on http://localhost:${PORT}`);
  console.log(`[LLM] Using: ${provider}${provider === "stub" ? " (set DEEPSEEK_API_KEY in .env to use DeepSeek)" : ""}`);
});

