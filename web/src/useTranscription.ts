/**
 * Live transcription hook based on the browser Web Speech API.
 * Exposes a stable interface so native iOS transcription can replace it later.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { Language } from "./i18n";

const MAX_FINAL_LINES = 30;

type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0?: { transcript?: string } }>;
};

type SpeechErrorEvent = { error: string };

type SpeechRecognizer = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognizerConstructor = new () => SpeechRecognizer;

export type TranscriptLine = {
  text: string;
  timestamp: number;
  speaker?: string;
};

export type UseTranscriptionResult = {
  isListening: boolean;
  interimText: string;
  finalLines: TranscriptLine[];
  start: () => void;
  stop: () => void;
  supported: boolean;
  error: string | null;
};

function getSpeechRecognition(): SpeechRecognizerConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognizerConstructor;
    webkitSpeechRecognition?: SpeechRecognizerConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useTranscription(language: Language): UseTranscriptionResult {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [finalLines, setFinalLines] = useState<TranscriptLine[]>([]);
  type Rec = InstanceType<NonNullable<ReturnType<typeof getSpeechRecognition>>>;
  const recognizerRef = useRef<Rec | null>(null);
  const supported = getSpeechRecognition() !== null;
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(() => {
    const Klass = getSpeechRecognition();
    if (!Klass) return;
    setError(null);
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (_) {}
      recognizerRef.current = null;
    }
    const rec = new Klass();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = language === "zh" ? "zh-CN" : "en-CA";
    rec.onstart = () => {
      setIsListening(true);
    };
    rec.onresult = (event: SpeechResultEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          if (text.trim()) {
            setFinalLines((prev) => {
              const next = [...prev, { text: text.trim(), timestamp: Date.now(), speaker: "unknown" }];
              return next.slice(-MAX_FINAL_LINES);
            });
          }
        } else {
          interim += text;
        }
      }
      setInterimText(interim);
    };
    rec.onerror = (ev: SpeechErrorEvent) => {
      setIsListening(false);
      if (ev.error !== "aborted") {
        setInterimText("");
        setError(ev.error);
      }
    };
    rec.onend = () => {
      setIsListening(false);
    };
    try {
      rec.start();
      recognizerRef.current = rec;
      setInterimText("");
    } catch (e) {
      setIsListening(false);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [language]);

  const stop = useCallback(() => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (_) {}
      recognizerRef.current = null;
    }
    setIsListening(false);
    setInterimText("");
  }, []);

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  return { isListening, interimText, finalLines, start, stop, supported, error };
}

