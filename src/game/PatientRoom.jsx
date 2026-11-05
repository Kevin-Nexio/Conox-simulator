import { useState } from "react";
import PatientScene from "./PatientScene.jsx";

export default function PatientRoom() {
  const BRIEFING = [
    {
      label: "Treatment goal",
      title: "Deep sedation has a reason.",
      text: "Early severe ARDS. For this patient, the team has chosen temporary deep sedation to support controlled, lung-protective ventilation. Prone positioning is being prepared.",
    },
    {
      label: "At the bedside",
      title: "Intubated. Ventilated. Closely observed.",
      text: "For clarity, this example shows propofol alone, delivered intravenously. It does not depict a complete ICU treatment. EEG helps us observe the effect on brain activity alongside the clinical assessment.",
    },
    {
      label: "Clinical assessment",
      title: "Target RASS −4. Observed RASS −4.",
      text: "No response to voice; movement to physical stimulation. There is no neuromuscular blockade in this teaching case. This assessment does not tell us whether the EEG is continuous or suppressed.",
    },
  ];
  const [detail, setDetail] = useState(0);
  return (
    <div className="clinical-room">
      <div className="clinical-illustration">
        <span className="clinical-room-label">{"ICU · ACUTE PHASE"}</span>
        <PatientScene />
        <div className="clinical-room-caption">
          <b>{"Severe ARDS"}</b>
          <span>{"Intubated · IV propofol · Proning planned"}</span>
        </div>
        <p className="clinical-focus-note">
          <b>{"Our focus: the brain."}</b>
          {
            "Only propofol is shown to keep this learning case simple. Other ICU treatments are outside the example."
          }
        </p>
      </div>
      <div className="clinical-briefing">
        <div className="clinical-goal">
          <span>{"THIS PATIENT’S GOAL"}</span>
          <b>RASS −4</b>
          <small>{"Temporary deep sedation"}</small>
        </div>
        <div
          className="clinical-tabs"
          aria-label={"Explore the clinical context"}
        >
          {BRIEFING.map((item, i) => (
            <button
              key={item.label}
              aria-pressed={detail === i}
              onClick={() => setDetail(i)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="clinical-detail" aria-live="polite">
          <h2>{BRIEFING[detail].title}</h2>
          <p>{BRIEFING[detail].text}</p>
        </div>
      </div>
    </div>
  );
}
