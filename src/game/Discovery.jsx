import { useGameI18n } from "./GameI18n.jsx";
import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import GameMonitor from "./GameMonitor.jsx";
import { scenarioFor } from "./scenarios.js";
import PatientRoom from "./PatientRoom.jsx";
import PatientScene from "./PatientScene.jsx";
import LearningGuide from "./LearningGuide.jsx";
import Buddy from "./Buddy.jsx";

export const CASE_KEY = "conox.challenge.icu-story.v2";
export const DISCOVERY_STEP_COUNT = 4;
const CONSENSUS =
  "https://link.springer.com/article/10.1007/s12028-022-01565-5";
const ARDS = "https://pmc.ncbi.nlm.nih.gov/articles/PMC10870893/";
const QCON_RASS = "https://pmc.ncbi.nlm.nih.gov/articles/PMC9067479/";

function ReferenceMonitor({ progressive, replay }) {
  const { t } = useGameI18n();
  const controls = useRef(null);
  const [elapsed, setElapsed] = useState(0);
  const scenario = useMemo(
    () =>
      scenarioFor({
        scenarioId: progressive ? "icu-progression" : "icu-continuous",
      }),
    [progressive],
  );
  useEffect(() => {
    setElapsed(0);
    if (!progressive) return;
    const timer = setInterval(() => {
      setElapsed(Math.min(60, controls.current?.sequence?.elapsed ?? 0));
    }, 250);
    return () => clearInterval(timer);
  }, [progressive, replay]);
  const phase =
    elapsed < 15
      ? t("discovery.phase.continuous")
      : elapsed < 35
        ? t("discovery.phase.early")
        : elapsed < 60
          ? t("discovery.phase.lengthen")
          : t("discovery.phase.prominent");
  return (
    <div className="clinical-monitor-stage">
      <GameMonitor
        key={`${scenario.id}-${replay}`}
        scenario={scenario}
        controls={controls}
        maskIndices
        screenOnly
      />
      {progressive && (
        <div className="clinical-sequence">
          <div>
            <b>{phase}</b>
            <span>{Math.floor(elapsed)} / 60 s</span>
          </div>
          <progress
            value={elapsed}
            max={60}
            aria-label={t("discovery.sequenceProgress")}
          />
          <small>{t("discovery.watch")}</small>
        </div>
      )}
    </div>
  );
}

function InfoDialog({ onClose }) {
  const { t } = useGameI18n();
  const close = useRef(null);
  useEffect(() => {
    const before = document.activeElement;
    close.current?.focus();
    return () => before?.focus();
  }, []);
  return (
    <div
      className="path-dialog-shade"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Tab") {
          const els = [...e.currentTarget.querySelectorAll("a,button")];
          if (e.shiftKey && document.activeElement === els[0]) {
            e.preventDefault();
            els.at(-1).focus();
          } else if (!e.shiftKey && document.activeElement === els.at(-1)) {
            e.preventDefault();
            els[0].focus();
          }
        }
      }}
    >
      <section
        className="path-dialog case-info"
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-info-title"
      >
        <h2 id="case-info-title">{t("discovery.aboutTitle")}</h2>
        <p>{t("discovery.aboutPatient")}</p>
        <p>{t("discovery.aboutFocus")}</p>
        <p>{t("discovery.aboutSuppression")}</p>
        <p>{t("discovery.aboutSequence")}</p>
        <p>{t("discovery.aboutReview")}</p>
        <div className="clinical-sources">
          <a href={CONSENSUS} target="_blank" rel="noreferrer">
            {t("discovery.sourceConsensus")}
          </a>
          <a href={ARDS} target="_blank" rel="noreferrer">
            {t("discovery.sourceArds")}
          </a>
          <a href={QCON_RASS} target="_blank" rel="noreferrer">
            {t("discovery.sourceQcon")}
          </a>
        </div>
        <button ref={close} className="game-primary" onClick={onClose}>
          {t("common.close")}
        </button>
      </section>
    </div>
  );
}

export function Discovery({ onExit, onBasics, onComplete }) {
  const { t } = useGameI18n();
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState(false);
  const [learning, setLearning] = useState(false);
  const [replay, setReplay] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const heading = useRef(null);
  const story = useRef(null);
  const lastStep = DISCOVERY_STEP_COUNT - 1;
  useLayoutEffect(() => {
    if (story.current) story.current.scrollTop = 0;
  }, [step]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    if (step === lastStep) {
      try {
        localStorage.setItem(
          CASE_KEY,
          JSON.stringify({ version: 2, completed: true }),
        );
        onComplete();
      } catch {
        setSaveError(true);
      }
    }
  }, [step]);
  const titles = [
    t("discovery.title.0"),
    t("discovery.title.1"),
    t("discovery.title.2"),
    t("discovery.title.3"),
  ];
  const copy = [
    [t("discovery.heading.0"), t("discovery.copy.0")],
    [t("discovery.heading.1"), t("discovery.copy.1")],
    [t("discovery.heading.2"), t("discovery.copy.2")],
    [t("discovery.heading.3"), t("discovery.copy.3")],
  ];
  const actions = [
    t("discovery.action.0"),
    t("discovery.action.1"),
    t("discovery.action.2"),
    t("discovery.action.3"),
  ];
  return (
    <div ref={story} className="simple-discovery clinical-discovery">
      <nav className="simple-nav">
        <button className="game-text-button" onClick={onExit}>
          {t("discovery.paths")}
        </button>
        <span>{t("discovery.label")}</span>
        <div
          className="simple-progress"
          aria-label={t("discovery.step", {
            step: step + 1,
            total: DISCOVERY_STEP_COUNT,
          })}
        >
          {titles.map((title, i) => (
            <i
              key={title}
              className={i <= step ? "filled" : ""}
              aria-hidden="true"
            />
          ))}
          <b>
            {step + 1} / {DISCOVERY_STEP_COUNT}
          </b>
        </div>
      </nav>
      <div className="simple-heading">
        <h1 ref={heading} tabIndex={-1}>
          {titles[step]}
        </h1>
        {step > 0 && (
          <span className="simple-rass">
            RASS <b>−4</b>
            <small>{t("discovery.assessment")}</small>
          </span>
        )}
      </div>
      <section
        className={`simple-stage ${step === 0 ? "show-room" : "show-conox"}${step === lastStep ? " show-reassessment" : ""}`}
        aria-label={
          step === 0
            ? t("discovery.context")
            : step === 2
              ? t("discovery.sequence")
              : t("discovery.continuous")
        }
      >
        {step === 0 ? (
          <PatientRoom />
        ) : step === lastStep ? (
          <div className="clinical-reassessment">
            <figure>
              <PatientScene withEeg />
              <figcaption>
                <b>{t("discovery.bedsideTitle")}</b>
                <span>{t("discovery.bedsideCopy")}</span>
              </figcaption>
            </figure>
            <ReferenceMonitor key={step} progressive={false} replay={replay} />
          </div>
        ) : (
          <ReferenceMonitor
            key={step}
            progressive={step === 2}
            replay={replay}
          />
        )}
      </section>
      <div className="simple-action">
        <Buddy />
        <div className="simple-message">
          <h2>{copy[step][0]}</h2>
          <p>{copy[step][1]}</p>
        </div>
        <button
          className="game-primary"
          onClick={() => (step === lastStep ? onBasics() : setStep(step + 1))}
        >
          {actions[step]} <span aria-hidden="true">→</span>
        </button>
      </div>
      <div className="simple-bottom">
        <button className="game-text-button" onClick={() => setLearning(true)}>
          {t("discovery.guide")}
        </button>
        <button className="game-text-button" onClick={() => setInfo(true)}>
          {t("discovery.about")}
        </button>
        {step > 0 && (
          <button
            className="game-text-button"
            onClick={() => setStep(step - 1)}
          >
            {t("common.previous")}
          </button>
        )}
        {step === 2 && (
          <button
            className="game-text-button"
            onClick={() => setReplay((n) => n + 1)}
          >
            {t("discovery.replay")}
          </button>
        )}
        <span>
          {step > 0 ? t("discovery.noConversion") : t("discovery.fictional")}
        </span>
        {step === lastStep && (
          <button className="game-text-button" onClick={() => setStep(0)}>
            {t("discovery.restart")}
          </button>
        )}
        {saveError && <span role="status">{t("discovery.saveError")}</span>}
      </div>
      {info && <InfoDialog onClose={() => setInfo(false)} />}
      {learning && (
        <LearningGuide
          onClose={() => setLearning(false)}
          onControls={onBasics}
        />
      )}
    </div>
  );
}
