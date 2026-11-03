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
import Buddy from "./Buddy.jsx";

export const CASE_KEY = "conox.challenge.icu-story.v2";
export const DISCOVERY_STEP_COUNT = 4;
const CONSENSUS =
  "https://link.springer.com/article/10.1007/s12028-022-01565-5";
const ARDS = "https://pmc.ncbi.nlm.nih.gov/articles/PMC10870893/";
const QCON_RASS = "https://pmc.ncbi.nlm.nih.gov/articles/PMC9067479/";

function ReferenceMonitor({ progressive, replay }) {
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
      ? "Continuous activity"
      : elapsed < 35
        ? "Early discontinuity"
        : elapsed < 60
          ? "Suppressed intervals lengthen"
          : "Suppression is now prominent";
  return (
    <div className="clinical-monitor-stage">
      <GameMonitor
        key={`${scenario.id}-${replay}`}
        scenario={scenario}
        controls={controls}
        maskIndices
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
            aria-label="Progress through the illustrative EEG sequence"
          />
          <small>Watch the raw EEG and the one-minute DSA together.</small>
        </div>
      )}
    </div>
  );
}

function InfoDialog({ onClose }) {
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
        <h2 id="case-info-title">About this clinical story</h2>
        <p>
          This fictional patient has early severe ARDS. The team has documented
          a temporary RASS −4 goal for controlled ventilation while preparing
          prone positioning. This is an individual scenario, not a sedation
          target for every patient with ARDS. No neuromuscular blockade is
          present during the RASS assessments.
        </p>
        <p>
          Deep sedation and burst suppression are different observations. RASS
          −4 or −5 does not define an EEG pattern. Suppression is not intended
          in this case; specific neurological indications require their own
          specialist plan.
        </p>
        <p>
          The 60-second sequence is a teaching illustration, not the time course
          of a drug or a patient recording. The shared simulator generates the
          signals. Indices are hidden because the story does not establish a
          numerical RASS–qCON conversion. Alpha/delta activity is an example in
          this propofol context, not a universal target.
        </p>
        <p>
          The reassessment illustrates what the team would review together. No
          dose or treatment interval is calculated. A frontal EEG display
          complements clinical assessment; it does not provide a complete
          neurological diagnosis or establish analgesia.
        </p>
        <div className="clinical-sources">
          <a href={CONSENSUS} target="_blank" rel="noreferrer">
            International ICU pEEG consensus ↗
          </a>
          <a href={ARDS} target="_blank" rel="noreferrer">
            ATS ARDS guideline ↗
          </a>
          <a href={QCON_RASS} target="_blank" rel="noreferrer">
            qCON and RASS: observational evidence ↗
          </a>
        </div>
        <button ref={close} className="game-primary" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
}

export function Discovery({ onExit, onBasics, onComplete }) {
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState(false);
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
    "Start with the treatment goal.",
    "Deep sedation. Continuous EEG.",
    "The EEG changes between assessments.",
    "Reassess the patient and the goal.",
  ];
  const copy = [
    [
      "What can the clinical assessment tell us?",
      "RASS describes the response to stimulation. It cannot show whether brain activity remains continuous. Explore the bedside context, then add the EEG.",
    ],
    [
      "Deep sedation does not mean burst suppression.",
      "This reference shows continuous alpha/delta activity. The clinical RASS is −4 in our story. EEG and the clinical score describe different aspects of the patient's state.",
    ],
    [
      "Watch the quiet intervals become longer.",
      "The sequence develops gradually over 60 seconds. This change may occur without a different RASS score. Check signal quality, treatment timing and other causes; do not deepen sedation just to obtain a lower number.",
    ],
    [
      "Same clinical score. A more continuous pattern.",
      "After reviewing signal quality, possible causes and the treatment plan, the team reassesses. This illustrative endpoint combines RASS −4 with continuous EEG. The display does not calculate how to get there.",
    ],
  ];
  const actions = [
    "Add the EEG",
    "Watch the change",
    "See the reassessment",
    "Start again",
  ];
  return (
    <div ref={story} className="simple-discovery clinical-discovery">
      <nav className="simple-nav">
        <button className="game-text-button" onClick={onExit}>
          ← Paths
        </button>
        <span>DISCOVER EEG</span>
        <div
          className="simple-progress"
          aria-label={`Step ${step + 1} of ${DISCOVERY_STEP_COUNT}`}
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
            <small>clinical assessment</small>
          </span>
        )}
      </div>
      <section
        className={`simple-stage ${step === 0 ? "show-room" : "show-conox"}`}
        aria-label={
          step === 0
            ? "Clinical context"
            : step === 2
              ? "Gradual EEG discontinuity sequence"
              : "Continuous alpha and delta reference"
        }
      >
        {step === 0 ? (
          <PatientRoom />
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
          onClick={() => setStep(step === lastStep ? 0 : step + 1)}
        >
          {actions[step]}{" "}
          <span aria-hidden="true">{step === lastStep ? "↻" : "→"}</span>
        </button>
      </div>
      <div className="simple-bottom">
        <button className="game-text-button" onClick={() => setInfo(true)}>
          About this story
        </button>
        {step > 0 && (
          <button
            className="game-text-button"
            onClick={() => setStep(step - 1)}
          >
            ← Previous
          </button>
        )}
        {step === 2 && (
          <button
            className="game-text-button"
            onClick={() => setReplay((n) => n + 1)}
          >
            Replay sequence ↻
          </button>
        )}
        <span>
          {step > 0
            ? "Illustrative EEG · No fixed RASS–qCON conversion"
            : "A fictional ICU case · No quiz, no timer"}
        </span>
        {step === lastStep && (
          <button className="game-text-button" onClick={onBasics}>
            Try the Conox controls →
          </button>
        )}
        {saveError && <span role="status">Progress could not be saved.</span>}
      </div>
      {info && <InfoDialog onClose={() => setInfo(false)} />}
    </div>
  );
}
