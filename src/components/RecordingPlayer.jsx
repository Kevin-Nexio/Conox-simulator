import * as React from "react";
import { createI18n, getInitialLocale, LOCALES } from "../i18n/index.js";
import { RECORDING_UI } from "../i18n/recordings.js";
import {
  advancePlayback,
  formatPosition,
  getViewRange,
  parsePosition,
} from "../recordings/playback.js";
import {
  createDsaImage,
  drawDsa,
  drawEeg,
  drawTrends,
} from "../recordings/rendering.js";
import "../styles/recordings.css";

const MAX_FILE_BYTES = 64 * 1024 * 1024;

export default function RecordingPlayer({ onClose }) {
  const [locale, setLocale] = React.useState(getInitialLocale);
  const { t } = React.useMemo(() => createI18n(locale), [locale]);
  const [data, setData] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [position, setPosition] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [selection, setSelection] = React.useState({ start: 0, end: 0 });
  const [selectionText, setSelectionText] = React.useState({
    start: "0:00",
    end: "0:00",
  });
  const [selectionError, setSelectionError] = React.useState(false);
  const [eegWindow, setEegWindow] = React.useState(4);
  const [amplitude, setAmplitude] = React.useState(120);
  const [dsaWindow, setDsaWindow] = React.useState(0);
  const [colorOffset, setColorOffset] = React.useState(0);
  const [guides, setGuides] = React.useState(true);
  const [sef50, setSef50] = React.useState(false);
  const [sef95, setSef95] = React.useState(false);
  const workerRef = React.useRef(null);
  const requestRef = React.useRef(0);
  const positionRef = React.useRef(0);
  const fileInputRef = React.useRef(null);
  const eegRef = React.useRef(null);
  const dsaRef = React.useRef(null);
  const trendRef = React.useRef(null);

  React.useEffect(() => {
    localStorage.setItem("conox.locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);
  React.useEffect(
    () => () => {
      requestRef.current++;
      workerRef.current?.terminate();
    },
    [],
  );

  const cancelLoad = () => {
    requestRef.current++;
    workerRef.current?.terminate();
    workerRef.current = null;
    setBusy(false);
  };
  const seek = (value) => {
    const next = Math.max(
      selection.start,
      Math.min(selection.end, Number(value)),
    );
    positionRef.current = next;
    setPosition(next);
  };
  const setPassage = (next) => {
    setSelection(next);
    setSelectionText({
      start: formatPosition(next.start, true),
      end: formatPosition(next.end, true),
    });
    setSelectionError(false);
    setPlaying(false);
    positionRef.current = Math.max(
      next.start,
      Math.min(next.end, positionRef.current),
    );
    setPosition(positionRef.current);
  };
  const commitPassage = () => {
    const start = parsePosition(selectionText.start);
    const end = parsePosition(selectionText.end);
    if (
      start === null ||
      end === null ||
      start >= end ||
      end > data.recording.durationSeconds
    ) {
      setSelectionError(true);
      return;
    }
    setPassage({ start, end });
  };
  const loadFile = async (file) => {
    if (!file) return;
    cancelLoad();
    setPlaying(false);
    setError(null);
    if (file.size > MAX_FILE_BYTES) {
      setError("TOO_LARGE");
      return;
    }
    setBusy(true);
    const request = ++requestRef.current;
    try {
      const buffer = await file.arrayBuffer();
      if (request !== requestRef.current) return;
      const worker = new Worker(
        new URL("../recordings/recording.worker.js", import.meta.url),
        { type: "module" },
      );
      workerRef.current = worker;
      const fail = (code) => {
        if (request !== requestRef.current) return;
        worker.terminate();
        workerRef.current = null;
        setBusy(false);
        setError(code);
      };
      worker.onerror = () => fail("UNKNOWN");
      worker.onmessage = ({ data: result }) => {
        if (request !== requestRef.current) return;
        if (result.error) {
          fail(result.error);
          return;
        }
        worker.terminate();
        workerRef.current = null;
        setData(result);
        positionRef.current = 0;
        setPosition(0);
        setPassage({ start: 0, end: result.recording.durationSeconds });
        setBusy(false);
      };
      worker.postMessage({ buffer, fileName: file.name }, [buffer]);
    } catch {
      if (request === requestRef.current) {
        setBusy(false);
        setError("UNKNOWN");
      }
    }
  };

  React.useEffect(() => {
    if (!playing || !data) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const next = advancePlayback(
        positionRef.current,
        (now - previous) / 1000,
        speed,
        selection.start,
        selection.end,
      );
      previous = now;
      positionRef.current = next.position;
      setPosition(next.position);
      if (next.ended) setPlaying(false);
    }, 50);
    // Do not jump through a teaching passage when the browser goes into the background.
    const pauseWhenHidden = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", pauseWhenHidden);
    };
  }, [playing, data, speed, selection]);

  const dsaImage = React.useMemo(
    () => (data ? createDsaImage(data.spectrum, colorOffset) : null),
    [data, colorOffset],
  );
  React.useEffect(() => {
    if (!data || !eegRef.current || !dsaRef.current || !trendRef.current)
      return;
    const { recording, filtered, spectrum } = data;
    const eegRange = getViewRange(
      position,
      recording.durationSeconds,
      eegWindow,
    );
    const overviewRange = getViewRange(
      position,
      recording.durationSeconds,
      dsaWindow || recording.durationSeconds,
    );
    drawEeg(
      eegRef.current,
      filtered,
      recording.sampleRate,
      position,
      eegRange,
      amplitude,
      guides,
    );
    drawDsa(
      dsaRef.current,
      dsaImage,
      spectrum,
      position,
      overviewRange,
      guides,
      sef50,
      sef95,
    );
    drawTrends(trendRef.current, recording, position, overviewRange, guides);
  }, [
    data,
    dsaImage,
    position,
    eegWindow,
    amplitude,
    dsaWindow,
    guides,
    sef50,
    sef95,
  ]);

  const recording = data?.recording;
  const indices =
    recording?.frames[
      Math.min(recording.frames.length - 1, Math.floor(position * 4))
    ]?.indices;
  const errorText =
    error &&
    (RECORDING_UI[locale][`recording.error.${error}`] || t("recording.error"));
  return (
    <main className="sb-shell recording-shell">
      <header className="sb-header recording-header">
        <div>
          <strong>{t("recording.title")}</strong>
          <small>{t("recording.local")}</small>
        </div>
        <div className="recording-header-tools">
          <div className="sb-language-switch" aria-label="Language">
            {LOCALES.map((item) => (
              <button
                key={item.code}
                type="button"
                className={locale === item.code ? "active" : ""}
                aria-pressed={locale === item.code}
                onClick={() => setLocale(item.code)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="sb-btn"
            title={t("recording.backNote")}
            onClick={onClose}
          >
            {t("recording.back")}
          </button>
        </div>
      </header>
      <div className="recording-content">
        <p className="recording-notice">{t("recording.experimental")}</p>
        <div className="recording-filebar">
          <button
            type="button"
            className="sb-btn"
            disabled={busy}
            onClick={() => fileInputRef.current.click()}
          >
            {t(recording ? "recording.replace" : "recording.choose")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".cxbin"
            hidden
            aria-label={t("recording.choose")}
            onChange={(event) => {
              loadFile(event.target.files[0]);
              event.target.value = "";
            }}
          />
          {busy && (
            <>
              <span role="status">{t("recording.loading")}</span>
              <button type="button" className="sb-btn" onClick={cancelLoad}>
                {t("recording.cancel")}
              </button>
            </>
          )}
          {!busy && recording && (
            <span className="recording-file-name">
              {recording.fileName} · {t("recording.duration")}:{" "}
              {formatPosition(recording.durationSeconds)}
            </span>
          )}
        </div>
        {error && (
          <p className="recording-error" role="alert">
            {errorText}
          </p>
        )}
        {!recording && !busy && (
          <div className="recording-empty">{t("recording.empty")}</div>
        )}
        {recording && (
          <>
            <p className="recording-meta">
              {recording.id} · {t("recording.date")}:{" "}
              {recording.startedAt?.replace("T", " ")}
            </p>
            <div className="recording-warnings" role="status">
              {recording.warnings
                .filter((warning) => warning.code !== "experimentalDecoding")
                .map((warning) => (
                  <p key={warning.code}>
                    {t(`recording.warning.${warning.code}`, warning)}
                  </p>
                ))}
            </div>
            <fieldset className="recording-controls" disabled={busy}>
              <legend>{t("recording.selection")}</legend>
              <div className="recording-transport">
                <button
                  type="button"
                  className="sb-btn recording-play"
                  aria-pressed={playing}
                  onClick={() => {
                    if (!playing && positionRef.current >= selection.end)
                      seek(selection.start);
                    setPlaying((value) => !value);
                  }}
                >
                  {t(playing ? "recording.pause" : "recording.play")}
                </button>
                <button
                  type="button"
                  className="sb-btn"
                  onClick={() => {
                    setPlaying(false);
                    seek(selection.start);
                  }}
                >
                  {t("recording.restart")}
                </button>
                <label>
                  {t("recording.speed")}
                  <select
                    value={speed}
                    aria-label={t("recording.speed")}
                    onChange={(event) => setSpeed(Number(event.target.value))}
                  >
                    {[0.25, 0.5, 1, 2, 4].map((value) => (
                      <option key={value} value={value}>
                        {value}×
                      </option>
                    ))}
                  </select>
                </label>
                <output data-testid="recording-time">
                  {formatPosition(position, true)} /{" "}
                  {formatPosition(recording.durationSeconds)}
                </output>
              </div>
              <input
                className="recording-seek"
                type="range"
                min={selection.start}
                max={selection.end}
                step="0.05"
                value={position}
                aria-label={t("recording.position")}
                onChange={(event) => seek(event.target.value)}
              />
              <div className="recording-passage">
                {[
                  ["start", "recording.start"],
                  ["end", "recording.end"],
                ].map(([key, label]) => (
                  <label key={key}>
                    {t(label)}
                    <input
                      type="text"
                      value={selectionText[key]}
                      aria-invalid={selectionError}
                      onChange={(event) =>
                        setSelectionText((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      onBlur={commitPassage}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") commitPassage();
                      }}
                    />
                  </label>
                ))}
                <button
                  type="button"
                  className="sb-btn"
                  disabled={position >= selection.end}
                  onClick={() => setPassage({ ...selection, start: position })}
                >
                  {t("recording.markStart")}
                </button>
                <button
                  type="button"
                  className="sb-btn"
                  disabled={position <= selection.start}
                  onClick={() => setPassage({ ...selection, end: position })}
                >
                  {t("recording.markEnd")}
                </button>
                <button
                  type="button"
                  className="sb-btn"
                  onClick={() =>
                    setPassage({ start: 0, end: recording.durationSeconds })
                  }
                >
                  {t("recording.fullCase")}
                </button>
              </div>
              <small>{t("recording.selectionNote")}</small>
              {selectionError && (
                <p className="recording-error" role="alert">
                  {t("recording.invalidSelection")}
                </p>
              )}
            </fieldset>
            <fieldset className="recording-display-controls" disabled={busy}>
              <legend>{t("display.heading")}</legend>
              <label>
                {t("recording.eegWindow")}
                <select
                  value={eegWindow}
                  aria-label={t("recording.eegWindow")}
                  onChange={(event) => setEegWindow(Number(event.target.value))}
                >
                  {[2, 4, 8].map((value) => (
                    <option key={value} value={value}>
                      {value} s
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("recording.amplitude")}
                <select
                  value={amplitude}
                  aria-label={t("recording.amplitude")}
                  onChange={(event) => setAmplitude(Number(event.target.value))}
                >
                  {[25, 50, 120, 475].map((value) => (
                    <option key={value} value={value}>
                      ±{value} µV*
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("recording.dsaWindow")}
                <select
                  value={dsaWindow}
                  aria-label={t("recording.dsaWindow")}
                  onChange={(event) => setDsaWindow(Number(event.target.value))}
                >
                  <option value={0}>{t("recording.whole")}</option>
                  {[60, 300, 1800].map((value) => (
                    <option key={value} value={value}>
                      {t("recording.minutes", { count: value / 60 })}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("recording.color")}
                <select
                  value={colorOffset}
                  aria-label={t("recording.color")}
                  onChange={(event) =>
                    setColorOffset(Number(event.target.value))
                  }
                >
                  {[-16, -12, -8, -4, 0, 4, 8, 12, 16].map((value) => (
                    <option key={value} value={value}>
                      {value > 0 ? "+" : ""}
                      {value} dB
                    </option>
                  ))}
                </select>
              </label>
              <label className="recording-check">
                <input
                  type="checkbox"
                  checked={guides}
                  onChange={(event) => setGuides(event.target.checked)}
                />
                {t("recording.grid")}
              </label>
              <label className="recording-check">
                <input
                  type="checkbox"
                  checked={sef50}
                  onChange={(event) => setSef50(event.target.checked)}
                />
                SEF50
              </label>
              <label className="recording-check">
                <input
                  type="checkbox"
                  checked={sef95}
                  onChange={(event) => setSef95(event.target.checked)}
                />
                SEF95
              </label>
            </fieldset>
            <section
              className="recording-indices"
              aria-label={t("recording.indices")}
            >
              <span>{t("recording.indices")}</span>
              {[
                ["qCON", "qcon"],
                ["qNOX", "qnox"],
                ["BSR", "bsr"],
                ["SQI", "sqi"],
                ["EMG", "emg"],
              ].map(([label, key]) => (
                <div key={key} className={`recording-index ${key}`}>
                  <b>{label}</b>
                  <strong
                    title={
                      indices?.[key] === null
                        ? t("recording.unavailable")
                        : undefined
                    }
                  >
                    {indices?.[key] ?? "--"}
                  </strong>
                </div>
              ))}
            </section>
            <section className="recording-chart">
              <h2>{t("recording.eeg")}</h2>
              <canvas
                ref={eegRef}
                width={1200}
                height={240}
                aria-label={t("recording.eeg")}
              />
            </section>
            <section className="recording-chart">
              <h2>{t("recording.dsa")}</h2>
              <div className="recording-dsa-row">
                <canvas
                  ref={dsaRef}
                  width={1200}
                  height={280}
                  aria-label={t("recording.dsa")}
                />
                <div
                  className="recording-color-key"
                  aria-label={t("recording.color")}
                >
                  <span>{50 - colorOffset}</span>
                  <i />
                  <span>{-30 - colorOffset} dB</span>
                </div>
              </div>
              <p>{t("recording.dsaMethod")}</p>
            </section>
            <section className="recording-chart">
              <h2>{t("recording.trends")}</h2>
              <div className="recording-trend-legend">
                <span className="qcon">qCON</span>
                <span className="qnox">qNOX</span>
                <span className="bsr">BSR</span>
                <span className="emg">EMG</span>
              </div>
              <canvas
                ref={trendRef}
                width={1200}
                height={190}
                aria-label={t("recording.trends")}
              />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
