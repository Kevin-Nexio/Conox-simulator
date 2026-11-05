import { useEffect, useRef, useState } from "react";
import { SimulatorApp } from "../App.jsx";
import RecordingPlayer from "../components/RecordingPlayer.jsx";
import GameApp from "../game/GameApp.jsx";
import { GameI18nProvider } from "../game/GameI18n.jsx";
import { LAB_MESSAGES, initialSuiteLocale } from "./messages.js";
import logoUrl from "../game/assets/fresenius-kabi.svg";
import { createDemoFile } from "./demoCase.js";

const DESIGNS = [
  {
    id: "clair",
    number: "01",
    name: "Clair",
    detail: "Familier, lumineux, aéré",
    description:
      "Le bleu du jeu, des surfaces claires et des commandes qui respirent.",
    points: [
      "Navigation en haut",
      "Cartes arrondies",
      "Repères bleu et menthe",
    ],
  },
  {
    id: "atelier",
    number: "02",
    name: "Atelier",
    detail: "Structuré, compact, direct",
    description:
      "Un espace de travail organisé autour d’une navigation latérale permanente.",
    points: [
      "Navigation latérale",
      "Réglages à portée de main",
      "Densité maîtrisée",
    ],
  },
  {
    id: "focus",
    number: "03",
    name: "Focus",
    detail: "Sombre, calme, immersif",
    description:
      "Une interface bleu nuit qui donne la priorité aux signaux et aux actions.",
    points: [
      "Surfaces bleu nuit",
      "Accents bleus et menthe",
      "Courbes au premier plan",
    ],
  },
];
const SOLUTIONS = [
  {
    id:
      window.location.pathname.endsWith("/game/") ||
      window.location.pathname.endsWith("/game/index.html")
        ? "jeu"
        : "simulateur",
    short: "Simulateur",
    title: "Explorer les signaux.",
    description:
      "Change une situation et observe l’EEG, le DSA et les indices.",
    tag: "SIMULATION",
    number: "01",
    step: "Observer · Ajuster · Comprendre",
  },
  {
    id: "cas",
    short: "Revue de cas",
    title: "Un cas, tous les repères.",
    description:
      "Rejoue un enregistrement, repère les événements et prépare un extrait.",
    tag: "ANALYSE",
    number: "02",
    step: "Ouvrir · Explorer · Partager",
  },
  {
    id: "jeu",
    short: "Jeu",
    title: "Apprendre en explorant.",
    description:
      "Retrouve Coni et progresse à ton rythme dans les parcours du jeu.",
    tag: "CHALLENGE",
    number: "03",
    step: "Découvrir · S’entraîner · Progresser",
  },
];
function initialState() {
  const params = new URLSearchParams(window.location.search);
  return {
    design: "clair",
    solution: SOLUTIONS.some((s) => s.id === params.get("solution"))
      ? params.get("solution")
      : "simulateur",
  };
}

export default function SuiteApp() {
  const [state, setState] = useState(initialState);
  const [locale, setLocale] = useState(initialSuiteLocale);
  const copy = LAB_MESSAGES[locale];
  const designs = DESIGNS.map((item, index) => ({
    ...item,
    ...copy.designs[index],
  }));
  const solutions = SOLUTIONS.map((item, index) => ({
    ...item,
    ...copy.solutions[index],
  }));
  const [deviceFrame, setDeviceFrame] = useState(false);
  const [focusControls, setFocusControls] = useState(false);
  const [pendingSolution, setPendingSolution] = useState(null);
  const [caseLoaded, setCaseLoaded] = useState(false);
  const design = designs.find((d) => d.id === state.design);
  const solution = solutions.find((s) => s.id === state.solution);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("design");
    url.searchParams.set("solution", state.solution);
    url.searchParams.set("lang", locale);
    window.history.replaceState(null, "", url);
    document.title = `Conox · ${solution.short}`;
    document.documentElement.lang = locale;
    try {
      localStorage.setItem("conox.suite.locale", locale);
    } catch {}
  }, [state, design.name, solution.short, locale]);

  function changeSolution(next) {
    if (next === state.solution) return;
    if (state.solution === "cas" && caseLoaded) {
      setPendingSolution(next);
      return;
    }
    setState((current) => ({ ...current, solution: next }));
  }
  function finishSwitch() {
    setCaseLoaded(false);
    setState((current) => ({ ...current, solution: pendingSolution }));
    setPendingSolution(null);
  }
  function navigation(className) {
    return (
      <nav className={className} aria-label={copy.navigation}>
        {solutions.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={state.solution === item.id ? "page" : undefined}
            onClick={() => changeSolution(item.id)}
          >
            <span className="lab-nav-number" aria-hidden="true">
              {item.number}
            </span>
            <span>{item.short}</span>
            <span className="lab-nav-dot" aria-hidden="true" />
          </button>
        ))}
      </nav>
    );
  }

  return (
    <div
      className="lab"
      lang={locale}
      data-design={state.design}
      data-solution={state.solution}
      data-frame={deviceFrame ? "device" : "flat"}
      data-focus-controls={focusControls ? "open" : "closed"}
    >
      <a className="lab-skip" href="#lab-workspace">
        {copy.skip}
      </a>
      <div className="lab-shell">
        <header className="lab-suite-header">
          <div className="lab-brand">
            <img src={logoUrl} alt="Fresenius Kabi" />
            <span>
              conox<span className="lab-brand-sub">learning suite</span>
            </span>
          </div>
          {navigation("lab-top-nav")}
          <span className="lab-suite-note">{copy.suiteNote}</span>
          <div className="lab-language" role="group" aria-label={copy.language}>
            {[
              { code: "de", name: "Deutsch" },
              { code: "fr", name: "Français" },
              { code: "en", name: "English" },
            ].map((language) => (
              <button
                key={language.code}
                type="button"
                lang={language.code}
                title={language.name}
                aria-label={language.name}
                aria-pressed={locale === language.code}
                onClick={() => setLocale(language.code)}
              >
                {language.code.toUpperCase()}
              </button>
            ))}
          </div>
        </header>
        <aside className="lab-sidebar">
          <span className="lab-sidebar-label">{copy.yourSpace}</span>
          {navigation("lab-side-nav")}
          <div className="lab-sidebar-bottom">
            <span className="lab-small-status">
              <i />
              {copy.localOnly}
            </span>
            <p>
              {copy.threeTools}
              <br />
              {copy.sameLanguage}
            </p>
            <span>CONOX · Learning suite</span>
          </div>
        </aside>
        <div id="lab-workspace" className="lab-workspace" tabIndex={-1}>
          <div className="lab-intro">
            <div>
              <div className="lab-eyebrow">
                <span>{solution.tag}</span>
                <span>{solution.step}</span>
              </div>
              <h1>{solution.title}</h1>
              <p>{solution.description}</p>
            </div>
            {state.solution === "simulateur" && state.design === "focus" && (
              <button
                type="button"
                className="lab-frame-toggle lab-inspector-toggle"
                aria-expanded={focusControls}
                onClick={() => setFocusControls((value) => !value)}
              >
                {focusControls ? copy.hideSettings : copy.showSettings}
              </button>
            )}
            {state.solution === "simulateur" && (
              <button
                type="button"
                className="lab-frame-toggle"
                aria-pressed={deviceFrame}
                onClick={() => setDeviceFrame((value) => !value)}
              >
                {deviceFrame ? copy.hideFrame : copy.showFrame}
              </button>
            )}
            {state.solution === "jeu" && (
              <span className="lab-game-note">{copy.gameNote}</span>
            )}
          </div>
          <div className="lab-application">
            {state.solution === "simulateur" && (
              <SimulatorApp
                suiteLocale={locale}
                onOpenRecording={() => changeSolution("cas")}
              />
            )}
            {state.solution === "cas" && (
              <RecordingPlayer
                onClose={() => changeSolution("simulateur")}
                demoFileFactory={() => createDemoFile(locale)}
                suiteLocale={locale}
                previewCopy={copy.recording}
                onLoaded={() => setCaseLoaded(true)}
              />
            )}
            {state.solution === "jeu" && (
              <div lang={locale}>
                <GameI18nProvider suiteLocale={locale}>
                  <GameApp />
                </GameI18nProvider>
              </div>
            )}
          </div>
          <footer className="lab-footer">
            <span>{copy.footer}</span>
            <span>{copy.training}</span>
          </footer>
        </div>
      </div>
      {pendingSolution && (
        <SwitchDialog
          copy={copy}
          onCancel={() => setPendingSolution(null)}
          onConfirm={finishSwitch}
        />
      )}
    </div>
  );
}

function SwitchDialog({ onCancel, onConfirm, copy }) {
  const cancel = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    cancel.current?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <div className="lab-dialog-backdrop">
      <section
        className="lab-dialog lab-confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lab-leave-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
          if (event.key === "Tab") {
            const buttons = [...event.currentTarget.querySelectorAll("button")];
            if (event.shiftKey && document.activeElement === buttons[0]) {
              event.preventDefault();
              buttons.at(-1).focus();
            } else if (
              !event.shiftKey &&
              document.activeElement === buttons.at(-1)
            ) {
              event.preventDefault();
              buttons[0].focus();
            }
          }
        }}
      >
        <h2 id="lab-leave-title">{copy.leaveTitle}</h2>
        <p>{copy.leaveText}</p>
        <div className="lab-dialog-actions">
          <button
            ref={cancel}
            type="button"
            className="lab-secondary"
            onClick={onCancel}
          >
            {copy.stay}
          </button>
          <button type="button" className="lab-primary" onClick={onConfirm}>
            {copy.change}
          </button>
        </div>
      </section>
    </div>
  );
}
