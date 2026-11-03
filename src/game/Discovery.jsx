import React, { useState, useEffect, useMemo, useRef } from "react";
import GameMonitor from "./GameMonitor.jsx";
import { scenarioFor } from "./scenarios.js";
import Buddy from "./Buddy.jsx";
export var CASE_KEY = "conox.challenge.icu-story.v1";
var CONSENSUS = "https://link.springer.com/article/10.1007/s12028-022-01565-5";
function PatientRoom() {
  return (
    <div className={"icu-room"} aria-label={"Illustrated ICU room"}>
      <div className={"room-window"}>
        <i />
        <i />
        <i />
      </div>
      <div className={"room-wall-panel"}>
        <span>{"CARE \xB7 OBSERVE \xB7 REASSESS"}</span>
        <i />
        <i />
        <i />
      </div>
      <svg
        className={"room-bed"}
        viewBox={"0 0 620 330"}
        role={"img"}
        aria-label={
          "Illustration of a patient resting in an ICU bed. Clinical details are provided in the briefing."
        }
      >
        <ellipse
          cx={"309"}
          cy={"295"}
          rx={"237"}
          ry={"22"}
          fill={"#a0bfc0"}
          opacity={".22"}
        />
        <path
          d={"M85 170v103M526 180v93"}
          stroke={"#9ab5c3"}
          strokeWidth={"15"}
          strokeLinecap={"round"}
        />
        <rect
          x={"72"}
          y={"159"}
          width={"470"}
          height={"80"}
          rx={"22"}
          fill={"#dce9ee"}
          stroke={"#a9c1ce"}
          strokeWidth={"3"}
        />
        <rect
          x={"83"}
          y={"147"}
          width={"450"}
          height={"62"}
          rx={"23"}
          fill={"#fbfdff"}
        />
        <rect
          x={"101"}
          y={"116"}
          width={"123"}
          height={"75"}
          rx={"27"}
          fill={"#f8fbff"}
          stroke={"#d1dfe9"}
          strokeWidth={"3"}
        />
        <ellipse cx={"162"} cy={"137"} rx={"40"} ry={"37"} fill={"#eed4be"} />
        <path
          d={"M122 128q4-46 45-35q35 8 33 38q-14-27-33-23q-27 8-45 20"}
          fill={"#6a6f7b"}
        />
        <path
          d={"M143 139q7 5 14 0m13 0q7 5 14 0"}
          fill={"none"}
          stroke={"#8c776e"}
          strokeWidth={"3"}
          strokeLinecap={"round"}
        />
        <path
          d={"M200 133q54-18 94 6q45-12 104 7q45-5 82 22l31 40H188Z"}
          fill={"#bbdcd5"}
        />
        <path
          d={"M249 140v65m102-61v61"}
          stroke={"#a3cbbf"}
          strokeWidth={"3"}
        />
        <path
          d={"M90 201h430m-417-28v54m91-54v54m220-54v54m91-54v54"}
          stroke={"#b3c7d3"}
          strokeWidth={"8"}
          strokeLinecap={"round"}
        />
        <circle cx={"110"} cy={"280"} r={"13"} fill={"#77909d"} />
        <circle cx={"504"} cy={"280"} r={"13"} fill={"#77909d"} />
      </svg>
      <div className={"simple-patient-facts"}>
        <span>{"YOUR PATIENT"}</span>
        <h2>{"Intubated. Receiving propofol."}</h2>
        <p>{"Deep sedation is still temporarily required."}</p>
        <b>{"Clinical assessment: RASS \u22124"}</b>
      </div>
    </div>
  );
}
function ReferenceMonitor({ after }) {
  const scenario = useMemo(
    () =>
      scenarioFor({
        scenarioId: after ? "target-a" : "strong-suppression",
      }),
    [after],
  );
  return <GameMonitor scenario={scenario} maskIndices />;
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
      className={"path-dialog-shade"}
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
        className={"path-dialog case-info"}
        role={"dialog"}
        aria-modal={"true"}
        aria-labelledby={"case-info-title"}
      >
        <h2 id={"case-info-title"}>{"About this demo"}</h2>
        <p>
          {
            "This teaching story is still being reviewed. The specific reason for deep sedation, individual target and vital signs have not yet been supplied."
          }
        </p>
        <p>
          {
            "The monitor shows existing synthetic reference patterns, not recordings of this patient or a calculated response to propofol. Numerical indices are withheld pending confirmation. The time axis belongs to the reference, not the clinical case."
          }
        </p>
        <p>
          {
            "No dose, treatment interval or ICU outcome is inferred. Alpha and delta in the proposed propofol case are observations, not universal targets."
          }
        </p>
        <p>
          <a href={CONSENSUS} target={"_blank"} rel={"noreferrer"}>
            {"International ICU pEEG consensus \u2197"}
          </a>
          <small>
            {
              "General background, not validation of this individual case or a fixed RASS\u2013qCON conversion."
            }
          </small>
        </p>
        <button ref={close} className={"game-primary"} onClick={onClose}>
          {"Close"}
        </button>
      </section>
    </div>
  );
}
export function Discovery({ onExit, onBasics, onComplete }) {
  const [step, setStep] = useState(0),
    [info, setInfo] = useState(false),
    [saveError, setSaveError] = useState(false);
  const heading = useRef(null);
  useEffect(() => {
    heading.current?.focus({
      preventScroll: true,
    });
    if (step === 2) {
      try {
        localStorage.setItem(
          CASE_KEY,
          JSON.stringify({
            version: 1,
            completed: true,
          }),
        );
        onComplete();
      } catch {
        setSaveError(true);
      }
    }
  }, [step]);
  const titles = [
    "Start with the clinical picture.",
    "Now add the EEG.",
    "Same RASS. Different EEG.",
  ];
  const copy = [
    [
      "What is happening between assessments?",
      "RASS describes the patient\u2019s clinical response. It does not show the EEG pattern.",
    ],
    [
      "Bursts of activity. Near-flat intervals.",
      "Suppression is not intended in this story. The team checks signal quality and possible causes, then reviews sedation.",
    ],
    [
      "The score stays the same. The EEG changes.",
      "After the team adjusts sedation and reassesses the patient, the story describes more continuous EEG activity. Clinical assessment and EEG are read together.",
    ],
  ];
  return (
    <div className={"simple-discovery"}>
      <nav className={"simple-nav"}>
        <button className={"game-text-button"} onClick={onExit}>
          {"\u2190 Paths"}
        </button>
        <span>{"DISCOVER EEG"}</span>
        <div className={"simple-progress"} aria-label={`Step ${step + 1} of 3`}>
          {[0, 1, 2].map((i) => (
            <i
              key={i}
              className={i <= step ? "filled" : ""}
              aria-hidden={"true"}
            />
          ))}
          <b>
            {step + 1}
            {" / 3"}
          </b>
        </div>
      </nav>
      <div className={"simple-heading"}>
        <h1 ref={heading} tabIndex={-1}>
          {titles[step]}
        </h1>
        {step > 0 && (
          <span className={"simple-rass"}>
            {"RASS "}
            <b>{"\u22124"}</b>
            <small>{step === 2 ? "unchanged" : "clinical assessment"}</small>
          </span>
        )}
      </div>
      <section
        className={`simple-stage ${step === 0 ? "show-room" : "show-conox"}`}
        aria-label={
          step === 0
            ? "Clinical context"
            : step === 1
              ? "Suppression reference pattern"
              : "More continuous reference pattern"
        }
      >
        {step === 0 ? <PatientRoom /> : <ReferenceMonitor after={step === 2} />}
      </section>
      <div className={"simple-action"}>
        <Buddy />
        <div className={"simple-message"}>
          <h2>{copy[step][0]}</h2>
          <p>{copy[step][1]}</p>
        </div>
        <button
          className={"game-primary"}
          onClick={() => setStep(step === 2 ? 0 : step + 1)}
        >
          {step === 0
            ? "Reveal the EEG"
            : step === 1
              ? "See the reassessment"
              : "Start again"}{" "}
          <span aria-hidden={"true"}>{step === 2 ? "\u21BB" : "\u2192"}</span>
        </button>
      </div>
      <div className={"simple-bottom"}>
        <button className={"game-text-button"} onClick={() => setInfo(true)}>
          {"About this demo"}
        </button>
        <span>
          {step > 0
            ? "Illustrative signals \xB7 Indices pending validation"
            : "A guided ICU story \xB7 No quiz, no timer"}
        </span>
        {step === 2 && (
          <button className={"game-text-button"} onClick={onBasics}>
            {"Try the Conox controls \u2192"}
          </button>
        )}
        {saveError && (
          <span role={"status"}>{"Progress could not be saved."}</span>
        )}
      </div>
      {info && <InfoDialog onClose={() => setInfo(false)} />}
    </div>
  );
}
