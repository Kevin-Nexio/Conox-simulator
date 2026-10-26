import { Metric } from "./UiPrimitives.jsx";

const valueOrGap = (value) => (Number.isFinite(value) ? value : "--");

export function ConoxMonitor({
  frameControls,
  children,
  borderless = false,
  brandLabel = "Fresenius Kabi",
}) {
  return (
    <div
      className={`sb-monitor-wrap${borderless ? " conox-monitor-borderless" : ""}`}
    >
      <a
        className="sb-device-brand"
        href="https://www.fresenius-kabi.com/de-ch"
        target="_blank"
        rel="noreferrer"
        aria-label={brandLabel}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/fresenius-kabi-logo.png`}
          alt="Fresenius Kabi"
        />
      </a>
      <span className="sb-device-led" aria-hidden="true" />
      {frameControls}
      <div className="sb-monitor-scroll">
        <div className="sb-monitor">{children}</div>
      </div>
      <div className="sb-device-wordmark" aria-label="CONOX">
        <img
          src={`${import.meta.env.BASE_URL}images/conox-wordmark.png`}
          alt="CONOX"
        />
      </div>
    </div>
  );
}

export function ConoxMetrics({ indices }) {
  return (
    <div className="sb-metrics">
      <Metric label="SQI" value={valueOrGap(indices?.sqi)} tone="green" />
      <Metric label="EMG" value={valueOrGap(indices?.emg)} tone="blue" />
      <Metric label="BSR" value={valueOrGap(indices?.bsr)} tone="red" />
      <Metric label="qNOX" value={valueOrGap(indices?.qnox)} tone="yellow" />
    </div>
  );
}

export function ConoxEegPanel({
  displayView = "eeg-dsa",
  caption,
  scale,
  children,
  hints,
}) {
  const active = ["eeg-index", "eeg-dsa", "all", "eeg-only"].includes(
    displayView,
  );
  return (
    <section
      className={`sb-rawbox ${active ? "active" : ""} ${displayView === "all" ? "layout-all-top" : displayView === "eeg-only" ? "layout-full" : "layout-top"}`}
      aria-label="Raw EEG"
      aria-hidden={!active}
    >
      <div className="sb-signal-caption">{caption}</div>
      <div className="sb-raw-content">
        <div className="sb-raw-scale">{scale}</div>
        {children}
      </div>
      {hints}
    </section>
  );
}

export function ConoxDsaPanel({
  displayView = "eeg-dsa",
  caption,
  frequencyAxis,
  children,
  colorScale,
  timeline,
}) {
  const active = ["dsa-index", "eeg-dsa", "all", "dsa-only"].includes(
    displayView,
  );
  return (
    <section
      className={`sb-dsabox ${active ? "active" : ""} ${displayView === "all" ? "layout-all-middle" : displayView === "dsa-only" ? "layout-full" : displayView === "eeg-dsa" ? "layout-bottom" : "layout-top"}`}
      aria-label="DSA"
      aria-hidden={!active}
    >
      <div className="sb-signal-caption">{caption}</div>
      <div className="sb-dsa-content">
        <div className="sb-frequency-axis">{frequencyAxis}</div>
        <div className="sb-dsa-canvas">{children}</div>
        <div className="sb-db-scale">{colorScale}</div>
      </div>
      <div className="sb-timeline">{timeline}</div>
    </section>
  );
}

export function ConoxBell({ className }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7 23h18c-2.2-2.7-3.3-6.2-3.3-10.1 0-4.1-2.5-7-5.7-7s-5.7 2.9-5.7 7C10.3 16.8 9.2 20.3 7 23Z" />
      <path d="M13.2 25.4c.5 1.4 1.5 2.2 2.8 2.2s2.3-.8 2.8-2.2" />
      <path d="M14.2 5.8V4.2h3.6v1.6" />
    </svg>
  );
}

export function ConoxQconPanel({ value, valueClassName, status }) {
  return (
    <section className="sb-qcon">
      <div>
        <ConoxBell className="sb-qcon-bell" />
        {" qCON"}
      </div>
      <strong className={valueClassName} aria-live="polite">
        {valueOrGap(value)}
      </strong>
      <small>{status}</small>
    </section>
  );
}
