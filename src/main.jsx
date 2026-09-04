import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import { initializeDocumentActions } from "./services/documentActions.js";
import "./styles/app.css";

initializeDocumentActions();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
