import { getInitialLocale } from "./i18n/index.js";
import { loadLocale } from "./i18n/catalog.js";
import { initialSuiteLocale } from "./suite/messages.js";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import SuiteApp from "./suite/LabApp.jsx";
import "./game/game.css";
import "./suite/lab.css";
import { initializeDocumentActions } from "./services/documentActions.js";
import "./styles/app.css";

initializeDocumentActions();

async function start() {
  try {
    await loadLocale(
      new URLSearchParams(window.location.search).has("role")
        ? getInitialLocale()
        : initialSuiteLocale(),
    );
  } catch {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", "en");
    window.history.replaceState(null, "", url);
  }
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      {new URLSearchParams(window.location.search).has("role") ? (
        <App />
      ) : (
        <SuiteApp />
      )}
    </StrictMode>,
  );
}
start();
