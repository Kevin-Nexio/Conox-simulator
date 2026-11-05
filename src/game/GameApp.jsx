import LanguageSelect from "../components/LanguageSelect.jsx";
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
import Buddy from "./Buddy.jsx";
import { Discovery, CASE_KEY, DISCOVERY_STEP_COUNT } from "./Discovery.jsx";
import {
  SOURCE,
  STORAGE_KEY,
  parseProgress,
  scoreFor,
  mergeResult,
  isUnlocked,
} from "./content.js";
import logoUrl from "./assets/fresenius-kabi.svg";
function Icon({ name, size = 22 }) {
  const paths = {
    sprout: (
      <React.Fragment>
        <path
          d={
            "M12 21v-9M12 15C4 15 3 9 3 4c7 0 9 4 9 8M12 12c0-6 4-9 9-9 0 6-3 10-9 10"
          }
        />
      </React.Fragment>
    ),
    compass: (
      <React.Fragment>
        <circle cx={"12"} cy={"12"} r={"9"} />
        <path d={"m16 8-2 6-6 2 2-6z"} />
      </React.Fragment>
    ),
    sparkles: (
      <React.Fragment>
        <path
          d={
            "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5zM20 2v4M18 4h4"
          }
        />
      </React.Fragment>
    ),
    arrow: <path d={"M5 12h14m-6-6 6 6-6 6"} />,
    back: <path d={"M19 12H5m6-6-6 6 6 6"} />,
    check: <path d={"m5 12 4 4L19 6"} />,
    lock: (
      <React.Fragment>
        <rect x={"5"} y={"10"} width={"14"} height={"11"} rx={"3"} />
        <path d={"M8 10V7a4 4 0 0 1 8 0v3"} />
      </React.Fragment>
    ),
    help: (
      <React.Fragment>
        <path d={"M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9z"} />
      </React.Fragment>
    ),
    star: (
      <path
        d={
          "m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3l-5.5 2.9 1-6.2L3 9.6l6.2-.9z"
        }
      />
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox={"0 0 24 24"}
      fill={"none"}
      stroke={"currentColor"}
      strokeWidth={"1.7"}
      strokeLinecap={"round"}
      strokeLinejoin={"round"}
      aria-hidden={"true"}
    >
      {paths[name] || paths.sparkles}
    </svg>
  );
}
function AutoFit({ children, className = "" }) {
  const outer = useRef(null),
    inner = useRef(null);
  useLayoutEffect(() => {
    let raf;
    const fit = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!outer.current || !inner.current) return;
        // Keep phone text and touch targets at their natural size. The panel
        // scrolls when needed; desktop retains the original single-screen fit.
        if (
          window.matchMedia(
            "(max-width: 760px), (max-width: 1000px) and (max-height: 500px)",
          ).matches
        ) {
          inner.current.style.transform = "none";
          return;
        }
        inner.current.style.transform = `scale(${Math.min(1, (outer.current.clientHeight - 2) / Math.max(1, inner.current.scrollHeight))})`;
      });
    };
    const ro = new ResizeObserver(fit);
    ro.observe(outer.current);
    ro.observe(inner.current);
    fit();
    document.fonts.ready.then(fit);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className={`path-autofit ${className}`} ref={outer}>
      <div className={"path-autofit-inner"} ref={inner}>
        {children}
      </div>
    </div>
  );
}
function ProgressBar({ done, total = 4 }) {
  const { t } = useGameI18n();
  return (
    <div
      className={"path-progress"}
      role={"progressbar"}
      aria-valuenow={done}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={t("progress.completed")}
    >
      <span
        style={{
          width: `${(done / total) * 100}%`,
        }}
      />
    </div>
  );
}
function Dialog({ title, copy, confirm, onConfirm, onCancel }) {
  const { t } = useGameI18n();
  const cancel = useRef();
  useEffect(() => {
    const before = document.activeElement;
    cancel.current?.focus();
    return () => before?.focus();
  }, []);
  return (
    <div
      className={"path-dialog-shade"}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
        if (e.key === "Tab") {
          const bs = [...e.currentTarget.querySelectorAll("button")];
          if (e.shiftKey && document.activeElement === bs[0]) {
            e.preventDefault();
            bs.at(-1).focus();
          } else if (!e.shiftKey && document.activeElement === bs.at(-1)) {
            e.preventDefault();
            bs[0].focus();
          }
        }
      }}
    >
      <section
        role={"dialog"}
        aria-modal={"true"}
        aria-labelledby={"dialog-title"}
        className={"path-dialog"}
      >
        <h2 id={"dialog-title"}>{title}</h2>
        <p>{copy}</p>
        <div>
          <button ref={cancel} onClick={onCancel} className={"path-secondary"}>
            {t("common.keepPlaying")}
          </button>
          <button className={"game-primary"} onClick={onConfirm}>
            {confirm}
          </button>
        </div>
      </section>
    </div>
  );
}
function Home({ results, onChoose, caseDone }) {
  const { t, paths: PATHS } = useGameI18n();
  return (
    <AutoFit className={"path-home"}>
      <div className={"path-home-intro"}>
        <div>
          <span className={"game-eyebrow"}>{t("home.eyebrow")}</span>
          <h1 tabIndex={-1}>
            {t("home.title")}
            <br />
            {t("home.subtitle")}
          </h1>
          <p>{t("home.intro")}</p>
        </div>
        <div className={"path-hello"}>
          <span>{t("home.hello")}</span>
          <Buddy />
        </div>
      </div>
      <h2 className={"path-question"}>{t("home.question")}</h2>
      <div className={"path-options"}>
        {PATHS.map((path) => {
          const done = path.missions.filter((m) => results[m.id]).length;
          return (
            <button
              className={`path-option ${path.color}`}
              key={path.id}
              onClick={() => onChoose(path.id)}
            >
              <span className={"path-card-top"}>
                <span className={"path-icon"}>
                  <Icon name={path.icon} size={26} />
                </span>
                <span className={"path-tag"}>{path.tag}</span>
              </span>
              <span className={"path-audience"}>{path.audience}</span>
              <strong>{path.title}</strong>
              <span className={"path-description"}>{path.description}</span>
              <span className={"path-topic-list"}>
                {path.missions.map((m) => (
                  <span key={m.id}>{m.title}</span>
                ))}
              </span>
              <span className={"path-support"}>{path.support}</span>
              {path.id !== "discover" && <ProgressBar done={done} />}
              <span className={"path-card-bottom"}>
                <span>
                  {path.id === "discover"
                    ? caseDone
                      ? t("home.demoDone")
                      : t("home.steps", { count: DISCOVERY_STEP_COUNT })
                    : done
                      ? t("home.completed", { done, total: 4 })
                      : t("home.missions")}
                </span>
                <b>
                  {path.id === "discover"
                    ? t("home.startDemo")
                    : done
                      ? t("common.continue")
                      : t("common.start")}{" "}
                  <Icon name={"arrow"} size={18} />
                </b>
              </span>
            </button>
          );
        })}
      </div>
      <p className={"path-home-foot"}>{t("home.foot")}</p>
    </AutoFit>
  );
}
function PathSummary({ path, results, onStart, onHome, onReset, onDiscover }) {
  const { t } = useGameI18n();
  const done = path.missions.filter((m) => results[m.id]).length;
  const points = path.missions.reduce(
    (n, m) => n + (results[m.id]?.score || 0),
    0,
  );
  const next = path.missions.findIndex((m) => !results[m.id]);
  return (
    <AutoFit className={`path-map ${path.color}`}>
      <div className={"path-map-nav"}>
        <button className={"game-text-button"} onClick={onHome}>
          <Icon name={"back"} />
          {t("common.choosePath")}
        </button>
        <span>{path.support}</span>
      </div>
      <div className={"path-map-heading"}>
        <div>
          <span className={"game-eyebrow"}>{t("summary.eyebrow")}</span>
          <h1 tabIndex={-1}>{t("summary.title")}</h1>
          <p>{t("summary.intro")}</p>
          <div className={"path-map-stats"}>
            <strong>{t("summary.complete", { done, total: 4 })}</strong>
            <span>{t("summary.points", { points })}</span>
            <span>{t("summary.noBonus")}</span>
          </div>
        </div>
        <Buddy />
      </div>
      <ProgressBar done={done} />
      {path.id === "discover" && (
        <div className={"case-entry-strip"}>
          <div>
            <b>{t("summary.storyTitle")}</b>
            <p>{t("summary.storyCopy")}</p>
          </div>
          <button className={"path-secondary"} onClick={onDiscover}>
            {t("summary.openStory")}
          </button>
        </div>
      )}
      <div className={"path-mission-grid"}>
        {path.missions.map((m, i) => {
          const unlocked = isUnlocked(path, i, results),
            record = results[m.id];
          return (
            <button
              key={m.id}
              className={`path-mission-card ${record ? "completed" : ""}`}
              disabled={!unlocked}
              onClick={() => onStart(i)}
            >
              <span className={"path-mission-number"}>
                {unlocked ? (
                  String(i + 1).padStart(2, "0")
                ) : (
                  <Icon name={"lock"} />
                )}
              </span>
              <span>
                <b>{m.title}</b>
                <small>{m.intro}</small>
                <em>
                  {record
                    ? t("summary.best", { score: record.score })
                    : unlocked
                      ? t("summary.ready")
                      : t("summary.locked", { number: i })}
                </em>
              </span>
              <Icon name={record ? "check" : "arrow"} />
            </button>
          );
        })}
      </div>
      <div className={"path-map-bottom"}>
        <button className={"game-text-button"} onClick={onReset}>
          {t("summary.reset")}
        </button>
        <button
          className={"game-primary"}
          onClick={() => (next === -1 ? onHome() : onStart(next))}
        >
          {next === -1
            ? t("summary.another")
            : done
              ? t("summary.continue")
              : t("summary.start")}
          <Icon name={"arrow"} />
        </button>
      </div>
    </AutoFit>
  );
}
function Mission({ mission: m, path, index, onExit, onFinish, onNext }) {
  const { t, metrics: METRICS, formatList } = useGameI18n();
  const [stage, setStage] = useState("observe"),
    [selected, setSelected] = useState([]),
    [matches, setMatches] = useState({}),
    [reference, setReference] = useState(0),
    [seen, setSeen] = useState([0]),
    [allView, setAllView] = useState(false),
    [hint, setHint] = useState(false),
    [choice, setChoice] = useState(""),
    [obsErrors, setObsErrors] = useState(0),
    [answerErrors, setAnswerErrors] = useState([]),
    [feedback, setFeedback] = useState(""),
    [panel, setPanel] = useState("challenge"),
    [exit, setExit] = useState(false),
    [detail, setDetail] = useState(false),
    [advisory, setAdvisory] = useState({
      enabled: false,
      lower: 20,
      upper: 80,
    }),
    [triggerSeen, setTriggerSeen] = useState(false),
    [qcon, setQcon] = useState(null);
  const monitor = useRef(null),
    controls = useRef(null),
    heading = useRef(null),
    completed = useRef(false);
  const references = m.references ?? [];
  const scenario = useMemo(
    () =>
      scenarioFor({
        scenarioId:
          m.kind === "compare"
            ? references[reference].scenarioId
            : m.scenarioId,
      }),
    [m, reference],
  );
  const answerOrder = useMemo(() => {
    const a = m.options.map((option) => option.id);
    for (let i = a.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, [m.id]);
  const answers = answerOrder.map((id) =>
    m.options.find((option) => option.id === id),
  );
  const feedbackText = !feedback
    ? ""
    : feedback === "observation"
      ? m.kind === "match"
        ? t("mission.reviewRoles")
        : t("mission.reviewEvidence", {
            metrics: formatList(
              m.evidence.map(
                (id) => METRICS.find((item) => item.id === id).label,
              ),
            ),
          })
      : m.options.find((option) => option.id === feedback)?.feedback;
  useEffect(() => {
    heading.current?.focus({
      preventScroll: true,
    });
  }, [stage]);
  useEffect(() => {
    const node = monitor.current;
    if (!node) return;
    node
      .querySelectorAll(".path-highlight")
      .forEach((el) => el.classList.remove("path-highlight"));
    for (const id of selected) {
      const metric = METRICS.find((item) => item.id === id);
      node
        .querySelectorAll(metric.selector)
        .forEach((el) => el.classList.add("path-highlight"));
    }
    return () =>
      node
        .querySelectorAll(".path-highlight")
        .forEach((el) => el.classList.remove("path-highlight"));
  }, [selected, reference]);
  useEffect(() => {
    if (m.kind !== "advisory") return;
    const poll = () => {
      const c = controls.current;
      if (c) {
        setQcon(c.indices.qcon);
        if (c.enabled && c.triggered) setTriggerSeen(true);
      }
    };
    poll();
    const timer = setInterval(poll, 250);
    return () => clearInterval(timer);
  }, [m]);
  const observed =
    m.kind === "scan"
      ? m.evidence.every((id) => selected.includes(id)) &&
        selected.length === m.evidence.length
      : m.kind === "match"
        ? matches.qcon === "consciousness" && matches.qnox === "response"
        : m.kind === "views"
          ? allView
          : m.kind === "compare"
            ? seen.length === references.length
            : triggerSeen;
  const ready =
    m.kind === "scan"
      ? selected.length === m.evidence.length
      : m.kind === "match"
        ? matches.qcon && matches.qnox
        : m.kind === "views"
          ? allView
          : m.kind === "compare"
            ? seen.length === references.length
            : triggerSeen;
  function submit() {
    if (stage === "observe") {
      if (!observed) {
        setObsErrors((n) => n + 1);
        setFeedback("observation");
        return;
      }
      setStage("reason");
      setFeedback("");
      return;
    }
    const a = answers.find((x) => x.id === choice);
    if (!a || completed.current) return;
    if (!a.correct) {
      setAnswerErrors((prev) => [...prev, a.id]);
      setFeedback(a.id);
      setChoice("");
      return;
    }
    completed.current = true;
    onFinish(m.id, scoreFor(obsErrors, answerErrors.length));
    setStage("done");
    setFeedback("");
  }
  function toggleMetric(id) {
    setFeedback("");
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < m.evidence.length
          ? [...prev, id]
          : prev,
    );
  }
  function setExample(i) {
    setReference(i);
    setSeen((prev) => (prev.includes(i) ? prev : [...prev, i]));
  }
  function changeAdvisory(key, value) {
    const c = controls.current;
    if (!c) return;
    let next = {
      ...advisory,
      [key]: value,
    };
    if (key === "lower")
      next.lower = Math.max(0, Math.min(value, next.upper - 1));
    if (key === "upper")
      next.upper = Math.min(99, Math.max(value, next.lower + 1));
    if (key === "enabled") c.setAdvisory(value);
    else if (key === "lower") c.setLower(next.lower);
    else c.setUpper(next.upper);
    setAdvisory(next);
  }
  return (
    <React.Fragment>
      <div className={"game-mission-nav"}>
        <button
          className={"game-text-button"}
          onClick={() => (stage === "done" ? onExit() : setExit(true))}
        >
          <Icon name={"back"} />
          {t("common.choosePath")}
        </button>
        <span>{t("mission.nav", { path: path.title, number: index + 1 })}</span>
        <span>{t("mission.noPressure")}</span>
      </div>
      <nav className={"game-mobile-tabs"} aria-label={t("mission.view")}>
        <button
          aria-pressed={panel === "monitor"}
          onClick={() => setPanel("monitor")}
        >
          {t("mission.monitor")}
        </button>
        <button
          aria-pressed={panel === "challenge"}
          onClick={() => setPanel("challenge")}
        >
          {stage === "done" ? t("mission.result") : t("mission.challenge")}
        </button>
      </nav>
      <div className={"game-play-layout"} data-view={panel}>
        <section
          className={"game-observation path-observation"}
          ref={monitor}
          aria-label={t("mission.display")}
        >
          <GameMonitor scenario={scenario} controls={controls} />
          <p className={"game-monitor-caption"}>
            {t("mission.signals")}
            <span>{t("mission.caption")}</span>
          </p>
          {m.kind === "compare" && (
            <div className={"path-reference-status"}>
              {references[reference].description}
            </div>
          )}
        </section>
        <AutoFit className={"game-decision"}>
          <div className={"path-mission-heading"}>
            <span className={`path-mini-icon ${path.color}`}>
              <Icon name={path.icon} />
            </span>
            <span>{m.title}</span>
          </div>
          <div className={"game-stepper"} aria-label={t("mission.steps")}>
            {[
              t("mission.step.observe"),
              t("mission.step.reason"),
              t("mission.step.done"),
            ].map((t, i) => (
              <span
                key={t}
                className={
                  ["observe", "reason", "done"].indexOf(stage) === i
                    ? "current"
                    : ""
                }
              >
                {i + 1}
                {". "}
                {t}
              </span>
            ))}
          </div>
          <h1 ref={heading} tabIndex={-1}>
            {stage === "observe"
              ? t("mission.look")
              : stage === "reason"
                ? m.question
                : t("mission.wellDone")}
          </h1>
          {stage === "observe" && (
            <React.Fragment>
              <p className={"mission-brief"}>{m.scene}</p>
              <p className={"game-prompt"}>{m.prompt}</p>
              {m.kind === "scan" && (
                <React.Fragment>
                  <div className={"game-evidence"}>
                    {METRICS.map((metric) => (
                      <button
                        key={metric.id}
                        aria-pressed={selected.includes(metric.id)}
                        disabled={
                          !selected.includes(metric.id) &&
                          selected.length === m.evidence.length
                        }
                        onClick={() => toggleMetric(metric.id)}
                      >
                        <b>{metric.label}</b>
                        {path.id === "discover" && (
                          <small>{metric.detail}</small>
                        )}
                        {selected.includes(metric.id) && (
                          <Icon name={"check"} size={17} />
                        )}
                      </button>
                    ))}
                  </div>
                  <p className={"game-selection-count"} aria-live={"polite"}>
                    {t("mission.selected", {
                      count: selected.length,
                      total: m.evidence.length,
                    })}
                  </p>
                </React.Fragment>
              )}
              {m.kind === "match" && (
                <div className={"path-match"}>
                  {["qcon", "qnox"].map((id) => (
                    <label key={id}>
                      <strong>{id === "qcon" ? "qCON" : "qNOX"}</strong>
                      <select
                        aria-label={t("mission.role", {
                          index: id === "qcon" ? "qCON" : "qNOX",
                        })}
                        value={matches[id] || ""}
                        onChange={(e) => {
                          setMatches((p) => ({
                            ...p,
                            [id]: e.target.value,
                          }));
                          setFeedback("");
                        }}
                      >
                        <option value={""}>{t("mission.chooseRole")}</option>
                        <option value={"response"}>
                          {t("mission.response")}
                        </option>
                        <option value={"quality"}>
                          {t("mission.quality")}
                        </option>
                        <option value={"consciousness"}>
                          {t("mission.consciousness")}
                        </option>
                      </select>
                    </label>
                  ))}
                </div>
              )}
              {m.kind === "views" && (
                <div className={"path-tool-buttons"}>
                  <button
                    className={"path-secondary"}
                    onClick={() => controls.current?.setView("eeg-dsa")}
                  >
                    {"EEG + DSA"}
                  </button>
                  <button
                    className={`path-secondary ${allView ? "selected" : ""}`}
                    onClick={() => {
                      controls.current?.setView("all");
                      setAllView(true);
                    }}
                  >
                    {t("mission.allSignals")}
                    {allView && <Icon name={"check"} size={17} />}
                  </button>
                  <p className={"path-tool-status"} aria-live={"polite"}>
                    {allView
                      ? t("mission.viewExplored")
                      : t("mission.changeView")}
                  </p>
                </div>
              )}
              {m.kind === "compare" && (
                <div className={"path-tool-buttons"}>
                  {references.map((item, i) => (
                    <button
                      key={i}
                      className={`path-secondary ${reference === i ? "selected" : ""}`}
                      aria-pressed={reference === i}
                      onClick={() => setExample(i)}
                    >
                      {item.label}
                      {seen.includes(i) && <Icon name={"check"} size={16} />}
                    </button>
                  ))}
                  <p className={"path-tool-status"} aria-live={"polite"}>
                    {t("mission.references", {
                      count: seen.length,
                      total: references.length,
                    })}
                  </p>
                </div>
              )}
              {m.kind === "advisory" && (
                <div className={"path-advisory"}>
                  <div>
                    <strong>{t("advisory.title")}</strong>
                    <button
                      className={`path-toggle ${advisory.enabled ? "on" : ""}`}
                      role={"switch"}
                      aria-checked={advisory.enabled}
                      aria-label={t("advisory.enable")}
                      onClick={() =>
                        changeAdvisory("enabled", !advisory.enabled)
                      }
                    >
                      {advisory.enabled ? t("advisory.on") : t("advisory.off")}
                    </button>
                  </div>
                  {["lower", "upper"].map((key) => (
                    <label key={key}>
                      <span>
                        {key === "lower"
                          ? t("advisory.lower")
                          : t("advisory.upper")}
                        <b>{advisory[key]}</b>
                      </span>
                      <input
                        type={"range"}
                        min={key === "lower" ? 0 : advisory.lower + 1}
                        max={key === "lower" ? advisory.upper - 1 : 99}
                        value={advisory[key]}
                        onChange={(e) => changeAdvisory(key, +e.target.value)}
                      />
                    </label>
                  ))}
                  <p>{t("advisory.value", { value: qcon ?? "…" })}</p>
                  <p
                    role={"status"}
                    className={triggerSeen ? "path-verified" : ""}
                  >
                    {triggerSeen
                      ? t("advisory.observed")
                      : t("advisory.instruction")}
                  </p>
                </div>
              )}
            </React.Fragment>
          )}
          {stage === "reason" && (
            <fieldset className={"game-answers"}>
              <legend className={"sr-only"}>
                {t("mission.bestInterpretation")}
              </legend>
              {answers.map((a) => (
                <label
                  key={a.id}
                  className={`${choice === a.id ? "selected" : ""} ${answerErrors.includes(a.id) ? "incorrect" : ""}`}
                >
                  <input
                    type={"radio"}
                    name={"mission-answer"}
                    value={a.id}
                    checked={choice === a.id}
                    disabled={answerErrors.includes(a.id)}
                    onChange={() => {
                      setChoice(a.id);
                      setFeedback("");
                    }}
                  />
                  <span>{a.label}</span>
                  {answerErrors.includes(a.id) && (
                    <small>{t("mission.review")}</small>
                  )}
                </label>
              ))}
            </fieldset>
          )}
          {feedback && (
            <p className={"game-answer-feedback"} role={"status"}>
              {feedbackText}
            </p>
          )}
          {stage !== "done" ? (
            <React.Fragment>
              <button
                className={"game-primary"}
                disabled={stage === "observe" ? !ready : !choice}
                onClick={submit}
              >
                {stage === "observe"
                  ? t("mission.confirmObservation")
                  : t("mission.confirmAnswer")}
                <Icon name={"arrow"} size={19} />
              </button>
              <div
                className={`path-coach ${path.id === "discover" ? "guided" : ""}`}
              >
                <Buddy />
                <div>
                  {path.id === "discover" && <p>{m.guide}</p>}
                  <button
                    className={"game-text-button"}
                    aria-expanded={hint}
                    onClick={() => setHint(!hint)}
                  >
                    <Icon name={"help"} size={18} />
                    {hint ? t("mission.hideHint") : t("mission.askConi")}
                    <small>{t("mission.freeHint")}</small>
                  </button>
                </div>
              </div>
              {hint && (
                <p className={"game-hint-text"} role={"status"}>
                  {m.guide}
                </p>
              )}
            </React.Fragment>
          ) : (
            <div className={"game-debrief"}>
              <div className={"game-result"}>
                <div
                  className={"path-stars"}
                  aria-label={t("mission.stars", {
                    count:
                      scoreFor(obsErrors, answerErrors.length) >= 85
                        ? 3
                        : scoreFor(obsErrors, answerErrors.length) >= 60
                          ? 2
                          : 1,
                  })}
                >
                  {[0, 60, 85].map((n) => (
                    <span
                      key={n}
                      className={
                        scoreFor(obsErrors, answerErrors.length) >= n
                          ? "earned"
                          : ""
                      }
                    >
                      <Icon name={"star"} size={26} />
                    </span>
                  ))}
                </div>
                <b>
                  {scoreFor(obsErrors, answerErrors.length)}
                  <small>{" / 100"}</small>
                </b>
              </div>
              <div className={"game-takeaway"}>
                <h2>{t("mission.takeaway")}</h2>
                <p>{m.takeaway}</p>
              </div>
              <button
                className={"game-text-button path-why"}
                aria-expanded={detail}
                onClick={() => setDetail(!detail)}
              >
                {detail ? t("mission.hideDetails") : t("mission.details")}
              </button>
              {detail && (
                <div className={"path-detail"}>
                  <p>{m.guide}</p>
                  <p>
                    {t("mission.scoreExplanation", {
                      observation: obsErrors * 10,
                      answer: answerErrors.length * 15,
                    })}
                  </p>
                </div>
              )}
              <a
                className={"game-reference"}
                href={m.url || SOURCE}
                target={"_blank"}
                rel={"noreferrer"}
              >
                {m.reference}
                {" \u2197"}
              </a>
              <button className={"game-primary"} onClick={onNext}>
                {index === 3 ? t("mission.pathResults") : t("mission.next")}
                <Icon name={"arrow"} />
              </button>
              <div className={"path-coach path-success"}>
                <Buddy />
                <p>{t("mission.success")}</p>
              </div>
            </div>
          )}
        </AutoFit>
      </div>
      {exit && (
        <Dialog
          title={t("dialog.leaveTitle")}
          copy={t("dialog.leaveCopy")}
          confirm={t("dialog.leave")}
          onConfirm={onExit}
          onCancel={() => setExit(false)}
        />
      )}
    </React.Fragment>
  );
}
export default function App() {
  const { t, locale, setLocale, paths: PATHS } = useGameI18n();
  const [caseDone, setCaseDone] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CASE_KEY))?.completed === true;
    } catch {
      return false;
    }
  });
  const [results, setResults] = useState(() => {
      try {
        return parseProgress(localStorage.getItem(STORAGE_KEY));
      } catch {
        return {};
      }
    }),
    [view, setView] = useState("home"),
    [pathId, setPathId] = useState(null),
    [active, setActive] = useState(0),
    [attempt, setAttempt] = useState(0),
    [reset, setReset] = useState(false),
    [storageFailed, setStorageFailed] = useState(false);
  const path = PATHS.find((p) => p.id === pathId);
  const main = useRef(null);
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 3,
          results,
        }),
      );
      setStorageFailed(false);
    } catch {
      setStorageFailed(true);
    }
  }, [results]);
  useEffect(() => {
    if (view !== "mission")
      main.current?.querySelector("h1")?.focus({
        preventScroll: true,
      });
  }, [view, pathId]);
  function start(i) {
    if (!isUnlocked(path, i, results)) return;
    setActive(i);
    setAttempt((n) => n + 1);
    setView("mission");
  }
  function startPath(id) {
    const selectedPath = PATHS.find((item) => item.id === id);
    if (!selectedPath) return;
    const next = selectedPath.missions.findIndex(
      (mission) => !results[mission.id],
    );
    setPathId(id);
    setActive(Math.max(0, next));
    setAttempt((n) => n + 1);
    setView("mission");
  }
  return (
    <div className={"game-app pathways-app"}>
      <header className={"game-header"}>
        <div className={"game-brand"}>
          <button
            className="game-home-logo"
            aria-label={t("app.home")}
            onClick={() => setView("home")}
          >
            <img src={logoUrl} alt="Fresenius" />
          </button>
          <span>{"Challenge"}</span>
        </div>
        {path && view !== "home" && view !== "discovery" ? (
          <div className={"path-header-right"}>
            <span className={`path-header-tag ${path.color}`}>
              {path.title}
            </span>
            <div className={"game-header-progress"}>
              <ol aria-label={t("app.progress")}>
                {path.missions.map((m, i) => (
                  <li
                    key={m.id}
                    className={
                      view === "mission" && i === active
                        ? "active"
                        : results[m.id]
                          ? "complete"
                          : ""
                    }
                    aria-current={
                      view === "mission" && i === active ? "step" : void 0
                    }
                    aria-label={t(
                      results[m.id] ? "app.missionComplete" : "app.mission",
                      { number: i + 1 },
                    )}
                  >
                    {results[m.id] ? <Icon name={"check"} size={16} /> : i + 1}
                  </li>
                ))}
              </ol>
              <b>
                {path.missions.filter((m) => results[m.id]).length}
                {" / 4"}
              </b>
            </div>
          </div>
        ) : (
          <span className={"path-header-note"}>
            <Icon name={"sparkles"} size={17} />{" "}
            {view === "discovery" ? t("paths.discover.title") : t("app.learn")}
          </span>
        )}
        <div
          className="game-language-switch"
          role="group"
          aria-label={t("app.language")}
        >
          <LanguageSelect
            locale={locale}
            onChange={setLocale}
            label={t("app.language")}
          />
        </div>
      </header>
      <main ref={main} className={"game-content"}>
        {storageFailed && (
          <p className={"game-storage-warning"} role={"status"}>
            {t("app.storage")}
          </p>
        )}
        {view === "home" ? (
          <Home
            caseDone={caseDone}
            results={results}
            onChoose={(id) => {
              if (id === "discover") {
                setPathId(id);
                setView("discovery");
              } else startPath(id);
            }}
          />
        ) : view === "discovery" ? (
          <Discovery
            onComplete={() => setCaseDone(true)}
            onExit={() => setView("home")}
            onBasics={() => startPath("discover")}
          />
        ) : view === "mission" ? (
          <Mission
            key={`${pathId}-${active}-${attempt}`}
            mission={path.missions[active]}
            path={path}
            index={active}
            onExit={() => setView("home")}
            onFinish={(id, score) =>
              setResults((prev) => mergeResult(prev, id, score))
            }
            onNext={() =>
              active === 3 ? setView("summary") : start(active + 1)
            }
          />
        ) : (
          <PathSummary
            path={path}
            results={results}
            onStart={start}
            onDiscover={() => setView("discovery")}
            onHome={() => setView("home")}
            onReset={() => setReset(true)}
          />
        )}
      </main>
      <footer className={"game-footer"}>
        <span>{t("app.signals")}</span>
        <span>{t("app.disclaimer")}</span>
      </footer>
      {reset && (
        <Dialog
          title={t("dialog.resetTitle", { path: path.title })}
          copy={t("dialog.resetCopy")}
          confirm={t("summary.reset")}
          onConfirm={() => {
            setResults((prev) => {
              const next = {
                ...prev,
              };
              path.missions.forEach((m) => delete next[m.id]);
              return next;
            });
            setReset(false);
            start(0);
          }}
          onCancel={() => setReset(false)}
        />
      )}
    </div>
  );
}
