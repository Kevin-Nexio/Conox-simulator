import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import SuiteApp from "./suite/LabApp.jsx";
import "./game/game.css";
import "./suite/lab.css";
import { initializeDocumentActions } from "./services/documentActions.js";
import "./styles/app.css";

initializeDocumentActions();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {new URLSearchParams(window.location.search).has("role") ? (
      <App />
    ) : (
      <SuiteApp />
    )}
  </StrictMode>,
);
