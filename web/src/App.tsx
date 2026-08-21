import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import DMConsole from "./DMConsole";
import PlayerScreen from "./PlayerScreen";
import { copy, type Language } from "./i18n";

export default function App() {
  const { pathname } = useLocation();
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem("dnd_dm_language") === "zh" ? "zh" : "en"
  );
  const t = copy[language];

  useEffect(() => {
    localStorage.setItem("dnd_dm_language", language);
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const content = pathname === "/dm"
    ? <DMConsole key={language} language={language} />
    : pathname === "/player"
    ? <PlayerScreen key={language} language={language} />
    : null;

  if (content) {
    return (
      <>
        <div className="language-toolbar">
          <span>{t.languageLabel}</span>
          <button type="button" onClick={() => setLanguage(language === "en" ? "zh" : "en")}>
            {t.switchLanguage}
          </button>
        </div>
        {content}
      </>
    );
  }
  return <Navigate to="/dm" replace />;
}

