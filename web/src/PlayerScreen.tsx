import { useState } from "react";
import { useWebSocket } from "./useWebSocket";
import { copy, type Language } from "./i18n";

type Choice = { id: string; text: string };
type DMPushPayload = {
  dm_read_aloud: string;
  choices: Choice[];
};

export default function PlayerScreen({ language }: { language: Language }) {
  const t = copy[language];
  const [readAloud, setReadAloud] = useState("");
  const [choices, setChoices] = useState<Choice[]>([]);
  const [customInput, setCustomInput] = useState("");

  const { ready, send } = useWebSocket((msg: unknown) => {
    const m = msg as { type?: string; payload?: DMPushPayload };
    if (m.type === "dm_push" && m.payload) {
      setReadAloud(m.payload.dm_read_aloud ?? "");
      setChoices(m.payload.choices ?? []);
    }
  });

  const selectChoice = (choiceId: string, text: string) => {
    send({ type: "choice_selected", choiceId, text });
  };

  const submitCustom = () => {
    const t = customInput.trim();
    if (!t) return;
    send({ type: "transcript", text: t });
    setCustomInput("");
  };

  return (
    <div className="player-screen">
      <h1>{t.playerScreen}</h1>
      <p>{t.liveConnection}: {ready ? t.connected : t.disconnected}</p>
      {readAloud && (
        <section className="read-aloud">
          <h3>{t.story}</h3>
          <p>{readAloud}</p>
        </section>
      )}
      {choices.length > 0 && (
        <section className="choices">
          <h3>{t.chooseAction}</h3>
          <ul>
            {choices.map((c) => (
              <li key={c.id}>
                <button onClick={() => selectChoice(c.id, c.text)}>{c.text}</button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="custom-input">
        <h3>{t.customAction}</h3>
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitCustom()}
          placeholder={t.actionPlaceholder}
        />
        <button onClick={submitCustom}>{t.send}</button>
      </section>
    </div>
  );
}

