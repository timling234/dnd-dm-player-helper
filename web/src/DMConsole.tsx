import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "./useWebSocket";
import { useTranscription } from "./useTranscription";
import { useSessionState } from "./useSessionState";
import type { SessionState } from "./useSessionState";
import { copy, type Language } from "./i18n";
const TRANSCRIPT_MAX_LINES = 30;
const SPEAKERS = ["DM", "P1", "P2", "P3", "P4", "NPC"] as const;

type NextResponse = {
  dm_read_aloud: string;
  choices: Array<{ id: string; text: string }>;
  dm_private: string | Record<string, unknown> | unknown[];
  need_clarify?: boolean;
  clarify_question?: string;
};

type RequestStatus = "idle" | "loading" | "success" | "error";

function renderDmPrivate(value: NextResponse["dm_private"]) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number") return String(value);
  return (
    <pre className="dm-private-json">{JSON.stringify(value, null, 2)}</pre>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-CA", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function DMConsole({ language }: { language: Language }) {
  const t = copy[language];
  const [data, setData] = useState<NextResponse | null>(null);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [lastOverrides, setLastOverrides] = useState<{ historyAdd: string; last_choice?: string } | null>(null);
  const requestIdRef = useRef(0);
  const [speakerByTimestamp, setSpeakerByTimestamp] = useState<Record<number, string>>({});

  const { isListening, interimText, finalLines, start: startMic, stop: stopMic, supported: micSupported, error: micError } = useTranscription(language);
  const [sessionState, setSessionState, resetSession] = useSessionState(language);
  const { ready, send } = useWebSocket(() => {});

  const activeSpeaker = sessionState.activeSpeaker || "DM";
  const debugMemory = (sessionState as any).memory ?? "";
  const debugHistory = sessionState.history.slice(-15);

  useEffect(() => {
    setSpeakerByTimestamp((prev) => {
      if (!finalLines.length) return prev;
      let changed = false;
      const next = { ...prev };
      for (const line of finalLines) {
        if (!(line.timestamp in next)) {
          next[line.timestamp] = activeSpeaker;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [finalLines, activeSpeaker]);

  const transcriptWindow = finalLines
    .slice(-TRANSCRIPT_MAX_LINES)
    .map((l) => {
      const speaker = speakerByTimestamp[l.timestamp] || activeSpeaker;
      return `[${speaker}] ${l.text}`;
    })
    .join("\n");

  const isLoading = status === "loading";

  const generateNext = async (overrides?: { historyAdd: string; last_choice?: string }, isRetry?: boolean) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setStatus("loading");
    setError(null);
    if (!isRetry) {
      setLastOverrides(overrides ?? null);
    }
    const effectiveSession: SessionState = overrides
      ? { history: [...sessionState.history, overrides.historyAdd], last_choice: overrides.last_choice }
      : sessionState;

    try {
      const res = await fetch("/api/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnOwner: "dm",
          transcriptWindow,
          sessionState: effectiveSession,
          language,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const nextData: NextResponse = await res.json();
      if (requestId !== requestIdRef.current) return;
      setData(nextData);
      setSessionState({
        history: [...effectiveSession.history, `DM: ${nextData.dm_read_aloud}`],
        last_choice: effectiveSession.last_choice,
      });
      setStatus("success");
      try {
        send({ type: "dm_push", payload: nextData });
      } catch (_) {}
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  const handleChoiceClick = (text: string) => {
    generateNext({ historyAdd: `PLAYER_CHOICE: ${text}`, last_choice: text });
  };

  const handleCustomSubmit = () => {
    const t = customInput.trim();
    if (!t) return;
    setCustomInput("");
    generateNext({ historyAdd: `CUSTOM: ${t}` });
  };

  const handleSpeakerChange = (s: string) => {
    setSessionState((prev) => ({ ...prev, activeSpeaker: s }));
  };

  const handleRetry = () => {
    if (lastOverrides) {
      generateNext(lastOverrides, true);
    } else {
      generateNext(undefined, true);
    }
  };

  const handleResetSession = () => {
    resetSession();
    setData(null);
    setError(null);
    setStatus("idle");
    setLastOverrides(null);
  };

  return (
    <div className="dm-console">
      <h1>{t.dmConsole}</h1>
      <p className="ws-status">{t.liveConnection}: {ready ? t.connected : t.disconnected}</p>

      {/* Transcription */}
      <section>
        <h3>{t.liveTranscription}</h3>
        {micSupported ? (
          <>
            <div className="speaker-buttons">
              {SPEAKERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSpeakerChange(s)}
                  disabled={isLoading}
                  style={{ fontWeight: (sessionState.activeSpeaker || "DM") === s ? "bold" : "normal" }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mic-buttons">
              <button type="button" onClick={startMic} disabled={isListening}>
                {t.startListening}
              </button>
              <button type="button" onClick={stopMic} disabled={!isListening}>
                {t.stopListening}
              </button>
            </div>
            <p className="mic-status">
              {micError
                ? `${t.statusError} — ${micError}`
                : isListening
                ? t.statusListening
                : t.statusIdle}
            </p>
            <div className="transcript-live">
              <div className="transcript-final">
                {finalLines.slice(-TRANSCRIPT_MAX_LINES).map((line, i) => {
                  const speaker = speakerByTimestamp[line.timestamp] || activeSpeaker;
                  return (
                    <div key={`${line.timestamp}-${i}`} className="transcript-line">
                      <span className="transcript-time">{formatTime(line.timestamp)}</span>
                      <span>{`[${speaker}] ${line.text}`}</span>
                    </div>
                  );
                })}
              </div>
              {interimText && <div className="transcript-interim">{interimText}</div>}
            </div>
          </>
        ) : (
          <p className="unsupported">{t.unsupported}</p>
        )}
      </section>

      {/* Generation and errors */}
      <section>
        <button type="button" onClick={() => generateNext()} disabled={isLoading}>
          {isLoading ? t.generating : t.generateNext}
        </button>
        <button type="button" onClick={handleResetSession} className="btn-reset">
          {t.resetSession}
        </button>
      </section>
      {error && (
        <section className="error">
          <h3>{t.error}</h3>
          <p>{error}</p>
          <button type="button" onClick={handleRetry} disabled={isLoading}>
            {t.retry}
          </button>
        </section>
      )}

      {/* Story, suggestions, and custom actions */}
      {data && (
        <div className="dm-content">
          <section>
            <h3>{t.readAloud}</h3>
            <p>{data.dm_read_aloud}</p>
          </section>
          <section>
            <h3>{t.suggestedActions}</h3>
            <div className="choices-buttons">
              {data.choices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleChoiceClick(c.text)}
                  disabled={isLoading}
                >
                  {c.text}
                </button>
              ))}
            </div>
          </section>
          <section className="custom-input-section">
            <h3>{t.customPlayerAction}</h3>
            <div className="custom-input">
              <input
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                placeholder={t.playerActionPlaceholder}
                disabled={isLoading}
              />
              <button type="button" onClick={handleCustomSubmit} disabled={isLoading}>
                {t.submitContinue}
              </button>
            </div>
          </section>
          <section>
            <h3>{t.privateNotes}</h3>
            {renderDmPrivate(data.dm_private)}
          </section>
        </div>
      )}
      <details>
        <summary>{t.sessionMemory}</summary>
        <section>
          <h3>{t.memory}</h3>
          <pre className="dm-private-json">{debugMemory}</pre>
        </section>
        <section>
          <h3>{t.recentHistory}</h3>
          <pre className="dm-private-json">
            {debugHistory.join("\n")}
          </pre>
        </section>
      </details>
    </div>
  );
}

