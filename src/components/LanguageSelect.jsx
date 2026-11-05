import { useState } from "react";
import { EUROPE_LOCALES, loadLocale } from "../i18n/catalog.js";
export default function LanguageSelect({
  locale,
  onChange,
  label = "Language",
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function select(event) {
    const next = event.target.value;
    setBusy(true);
    setError(false);
    try {
      await loadLocale(next);
      onChange(next);
      const url = new URL(window.location.href);
      url.searchParams.set("lang", next);
      window.history.replaceState(null, "", url);
      try {
        localStorage.setItem("conox.suite.locale", next);
        localStorage.setItem("conox.locale", next);
      } catch {}
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="language-select">
      <select
        value={locale}
        onChange={select}
        disabled={busy}
        aria-label={label}
        aria-busy={busy}
      >
        {EUROPE_LOCALES.map((item) => (
          <option key={item.code} value={item.code} lang={item.code}>
            {item.name}
          </option>
        ))}
      </select>
      {error && <span role="alert">⚠ {label}</span>}
    </span>
  );
}
