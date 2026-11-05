import { useEffect, useRef, useState } from "react";
import Buddy from "./Buddy.jsx";
import { SOURCE, METRICS } from "./content.js";

const CONSENSUS =
  "https://link.springer.com/article/10.1007/s12028-022-01565-5";
export default function LearningGuide({ onClose, onControls }) {
  const TOPICS = [
    {
      label: "Why EEG?",
      title: "Observe the brain during sedation.",
      text: "Propofol changes brain activity. EEG helps us observe that effect continuously, alongside the patient's clinical response. Blood pressure and ventilator behaviour remain important, but do not directly show the EEG pattern.",
      note: "The simulator's alpha/delta example shows continuous activity. Deep sedation does not require burst suppression.",
      steps: [
        ["Clinical assessment", "How does the patient respond?"],
        ["Raw EEG", "What is the brain activity doing?"],
        ["Together", "Compare the observations with the goal."],
      ],
    },
    {
      label: "Why in ICU?",
      title: "Follow a changing clinical situation.",
      text: "The reason for sedation can change during an ICU stay. EEG and DSA can reveal changes in continuity between clinical assessments, including unexpected suppression. Interpret the pattern with signal quality, medications and the patient's condition.",
      note: "Clinical assessment and EEG-derived indices describe different information. There is no fixed RASS-to-qCON conversion.",
      steps: [
        ["Agree the goal", "Why is sedation needed now?"],
        ["Observe the trend", "What changed, and when?"],
        ["Reassess together", "Does the plan still fit the patient?"],
      ],
    },
    {
      label: "Meet Conox",
      title: "From the sensor to the screen.",
      text: "A disposable forehead sensor with three electrodes records the EEG. A patient cable connects it to the monitor, which brings the waveform, spectrogram and processed indices together.",
      note: "Conox supports monitoring during anaesthesia and sedation. It is not a diagnostic EEG system, and its indices alone do not determine a drug dose.",
      steps: [
        ["Forehead sensor", "Records the signal"],
        ["Patient cable", "Connects sensor and monitor"],
        ["Conox display", "EEG · DSA · indices"],
      ],
    },
  ];
  const [topic, setTopic] = useState(0);
  const close = useRef(null);
  const body = useRef(null);
  const current = TOPICS[topic];
  useEffect(() => {
    const before = document.activeElement;
    close.current?.focus();
    return () => before?.focus();
  }, []);
  function keyboard(event) {
    if (event.key === "Escape") onClose();
    if (event.key !== "Tab") return;
    const items = [
      ...event.currentTarget.querySelectorAll(
        "button:not([disabled]), a[href]",
      ),
    ];
    if (event.shiftKey && document.activeElement === items[0]) {
      event.preventDefault();
      items.at(-1)?.focus();
    } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
      event.preventDefault();
      items[0]?.focus();
    }
  }
  return (
    <div
      className="path-dialog-shade"
      onKeyDown={keyboard}
      onClick={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <section
        className="path-dialog learning-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="learning-title"
      >
        <header className="learning-guide-header">
          <Buddy />
          <div>
            <span>{"EXPLORE WITH CONI"}</span>
            <h2 id="learning-title">{"A closer look at EEG."}</h2>
          </div>
          <button
            ref={close}
            className="game-text-button learning-close"
            aria-label={"Close learning guide"}
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <nav className="learning-topics" aria-label={"EEG learning topics"}>
          {TOPICS.map((item, index) => (
            <button
              key={item.label}
              aria-pressed={topic === index}
              onClick={() => {
                setTopic(index);
                if (body.current) body.current.scrollTop = 0;
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div ref={body} className="learning-guide-body">
          <div aria-live="polite">
            <h3>{current.title}</h3>
            <p>{current.text}</p>
            <div className="learning-flow">
              {current.steps.map(([title, detail], index) => (
                <div key={title}>
                  <span aria-hidden="true">{index + 1}</span>
                  <b>{title}</b>
                  <small>{detail}</small>
                </div>
              ))}
            </div>
            {topic === 2 && (
              <dl className="learning-metrics">
                {METRICS.map((metric) => (
                  <div key={metric.id}>
                    <dt>{metric.label}</dt>
                    <dd>
                      {metric.id === "qnox"
                        ? "Probability of response to a noxious stimulus"
                        : metric.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="learning-note">{current.note}</p>
            <a
              className="learning-source"
              href={topic === 2 ? SOURCE : CONSENSUS}
              target="_blank"
              rel="noreferrer"
            >
              {topic === 2 ? "Conox instructions for use" : "ICU EEG consensus"}{" "}
              ↗
            </a>
          </div>
        </div>
        <footer className="learning-guide-footer">
          <button className="game-text-button" onClick={onClose}>
            {"Back to the story"}
          </button>
          <button className="game-primary" onClick={onControls}>
            {"Try the Conox controls →"}
          </button>
          <a href="../" target="_blank" rel="noreferrer">
            {"Explore the full simulator ↗"}
          </a>
        </footer>
      </section>
    </div>
  );
}
