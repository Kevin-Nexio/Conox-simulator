import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createGameI18n,
  GAME_LOCALE_KEY,
  getInitialGameLocale,
  supportedGameLocale,
} from "./i18n.js";

const GameI18nContext = createContext(null);

export function GameI18nProvider({ children, suiteLocale = null }) {
  const [selectedLocale, updateLocale] = useState(getInitialGameLocale);
  const locale = suiteLocale ?? selectedLocale;
  const value = useMemo(
    () => ({
      ...createGameI18n(locale),
      setLocale: (next) => updateLocale(supportedGameLocale(next) ?? "en"),
    }),
    [locale],
  );
  useEffect(() => {
    document.documentElement.lang = locale;
    if (!suiteLocale) document.title = value.t("app.title");
    try {
      localStorage.setItem(GAME_LOCALE_KEY, locale);
    } catch {
      // The selected language still applies for the current session.
    }
  }, [value, locale, suiteLocale]);
  return (
    <GameI18nContext.Provider value={value}>
      {children}
    </GameI18nContext.Provider>
  );
}

export function useGameI18n() {
  return useContext(GameI18nContext);
}
