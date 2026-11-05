import { useEffect, useRef, useState } from "react";
import { useGameI18n } from "./GameI18n.jsx";
import Buddy from "./Buddy.jsx";
import { SOURCE } from "./content.js";

const CONSENSUS =
  "https://link.springer.com/article/10.1007/s12028-022-01565-5";
export default function LearningGuide({ onClose, onControls }) {
  const { t, metrics: METRICS } = useGameI18n();
  const TOPICS = [0, 1, 2].map((index) => ({
    label: t(`guide.topic.${index}.label`),
    title: t(`guide.topic.${index}.title`),
    text: t(`guide.topic.${index}.text`),
    note: t(`guide.topic.${index}.note`),
    steps: [0, 1, 2].map((step) => [
      t(`guide.topic.${index}.step.${step}.title`),
      t(`guide.topic.${index}.step.${step}.detail`),
    ]),
  }));
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
            <span>{t("guide.eyebrow")}</span>
            <h2 id="learning-title">{t("guide.title")}</h2>
          </div>
          <button
            ref={close}
            className="game-text-button learning-close"
            aria-label={t("guide.close")}
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <nav className="learning-topics" aria-label={t("guide.topics")}>
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
                        ? t("mission.response")
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
              {topic === 2 ? t("guide.sourceIfu") : t("guide.sourceConsensus")}{" "}
              ↗
            </a>
          </div>
        </div>
        <footer className="learning-guide-footer">
          <button className="game-text-button" onClick={onClose}>
            {t("guide.back")}
          </button>
          <button className="game-primary" onClick={onControls}>
            {t("discovery.tryControls")}
          </button>
          <a href="../" target="_blank" rel="noreferrer">
            {t("guide.simulator")}
          </a>
        </footer>
      </section>
    </div>
  );
}
