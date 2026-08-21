/**
 * Session state: history + last_choice, persisted in localStorage.
 */

import { useState, useEffect, useCallback } from "react";
import type { Language } from "./i18n";

const LEGACY_STORAGE_KEY = "dnd_dm_session";
const storageKey = (language: Language) => `dnd_dm_session_${language}`;

export type SessionState = {
  history: string[];
  last_choice?: string;
  activeSpeaker?: string;
};

const defaultState: SessionState = { history: [], activeSpeaker: "DM" };

function parseState(raw: string | null): SessionState | null {
  if (!raw) return null;
  const parsed = JSON.parse(raw) as SessionState;
  if (!Array.isArray(parsed?.history)) return null;
  return {
    history: parsed.history,
    last_choice: parsed.last_choice,
    activeSpeaker: parsed.activeSpeaker || "DM"
  };
}

function load(language: Language): SessionState {
  try {
    const current = parseState(localStorage.getItem(storageKey(language)));
    if (current) return current;

    const legacy = parseState(localStorage.getItem(LEGACY_STORAGE_KEY));
    if (legacy) {
      const containsChinese = legacy.history.some((line) => /[\u3400-\u9fff]/.test(line));
      if ((language === "zh") === containsChinese) {
        localStorage.setItem(storageKey(language), JSON.stringify(legacy));
        return legacy;
      }
    }
  } catch (_) {}
  return defaultState;
}

function save(language: Language, state: SessionState) {
  try {
    localStorage.setItem(storageKey(language), JSON.stringify(state));
  } catch (_) {}
}

export function useSessionState(language: Language) {
  const [state, setState] = useState<SessionState>(() => load(language));

  useEffect(() => {
    save(language, state);
  }, [language, state]);

  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  return [state, setState, reset] as const;
}

