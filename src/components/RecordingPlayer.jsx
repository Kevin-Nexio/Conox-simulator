import * as React from "react";
import { createI18n, getInitialLocale, LOCALES } from "../i18n/index.js";
import { RECORDING_UI } from "../i18n/recordings.js";
import {
  advancePlayback,
  formatPosition,
  parsePosition,
} from "../recordings/playback.js";
import { createDsaImage } from "../recordings/rendering.js";
import {
  clampTimelinePosition,
  normalizeSelection,
} from "../recordings/timeline.js";
import {
  loadPresentationAssets,
  renderPresentation,
} from "../recordings/presentation.js";
import {
  canvasToPng,
  canvasToPdf,
  exportVideo,
  getSupportedVideoFormats,
  saveExport,
} from "../recordings/export.js";
import RecordingTimeline from "./RecordingTimeline.jsx";
import RecordingPresentation from "./RecordingPresentation.jsx";
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
  const [layout, setLayout] = React.useState("blocks");
  const [assets, setAssets] = React.useState(null);
  const [exporting, setExporting] = React.useState(null);
  const [exportProgress, setExportProgress] = React.useState(0);
  const [exportError, setExportError] = React.useState(null);
  const videoFormats = React.useMemo(() => getSupportedVideoFormats(), []);
  const [videoType, setVideoType] = React.useState(
    () => videoFormats[0]?.mimeType || "",
  );
  const workerRef = React.useRef(null);
  const requestRef = React.useRef(0);
  const positionRef = React.useRef(0);
  const fileInputRef = React.useRef(null);
  const exportAbortRef = React.useRef(null);
  const exportRequestRef = React.useRef(0);
  const locked = busy || Boolean(exporting);

  React.useEffect(() => {
    let active = true;
    loadPresentationAssets(import.meta.env.BASE_URL)
      .then((loaded) => {
        if (active) setAssets(loaded);
      })
      .catch(() => {
        if (active) setAssets({});
      });
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    localStorage.setItem("conox.locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);
  React.useEffect(
    () => () => {
      requestRef.current++;
      workerRef.current?.terminate();
      exportRequestRef.current++;
      exportAbortRef.current?.abort();
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
    const next = clampTimelinePosition(
      value,
      data?.recording.durationSeconds || 0,
    );
    setPlaying(false);
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
  };
  const commitPassage = () => {
    const start = parsePosition(selectionText.start);
    const end = parsePosition(selectionText.end);
    if (
      start === null ||
      end === null ||
      start >= end ||
      end - start < Math.min(0.25, data.recording.durationSeconds) ||
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
    setExportError(null);
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
  const settings = React.useMemo(
    () => ({
      eegWindow,
      amplitude,
      dsaWindow,
      colorOffset,
      guides,
      sef50,
      sef95,
    }),
    [eegWindow, amplitude, dsaWindow, colorOffset, guides, sef50, sef95],
  );

  const startExport = async (kind) => {
    if (!data || locked || assets === null) return;
    if (kind === "video" && selectionError) return;
    setPlaying(false);
    setExportError(null);
    setExportProgress(0);
    setExporting(kind);
    const request = ++exportRequestRef.current;
    const controller = new AbortController();
    exportAbortRef.current = controller;
    const exportPosition = positionRef.current;
    const canvas = document.createElement("canvas");
    const renderFrame = (at) =>
      renderPresentation(canvas, {
        data,
        dsaImage,
        position: at,
        settings,
        layout,
        t,
        assets,
      });
    try {
      renderFrame(exportPosition);
      let blob;
      let extension = kind === "pdf" ? "pdf" : "png";
      if (kind === "video") {
        extension = videoFormats.find(
          (format) => format.mimeType === videoType,
        )?.extension;
        if (!extension) throw { code: "UNSUPPORTED_VIDEO" };
        blob = await exportVideo({
          canvas,
          renderFrame,
          start: selection.start,
          end: selection.end,
          speed,
          mimeType: videoType,
          onProgress: setExportProgress,
          signal: controller.signal,
        });
      } else
        blob =
          kind === "pdf"
            ? await canvasToPdf(canvas)
            : await canvasToPng(canvas);
      if (controller.signal.aborted || request !== exportRequestRef.current)
        return;
      const at =
        kind === "video"
          ? `${formatPosition(selection.start, true)}-${formatPosition(selection.end, true)}`
          : formatPosition(exportPosition, true);
      saveExport(
        blob,
        `CONOX-${layout}-${at.replaceAll(":", "m").replaceAll(".", "-")}.${extension}`,
      );
    } catch (failure) {
      if (
        request === exportRequestRef.current &&
        failure.code !== "EXPORT_ABORTED"
      )
        setExportError(failure.code || "EXPORT_FAILED");
    } finally {
      if (request === exportRequestRef.current) {
        setExporting(null);
        exportAbortRef.current = null;
      }
    }
  };

  const recording = data?.recording;
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
                disabled={Boolean(exporting)}
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
            disabled={locked}
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
            <fieldset className="recording-controls" disabled={locked}>
              <legend>{t("recording.selection")}</legend>
              <div className="recording-transport">
                <button
                  type="button"
                  className="sb-btn recording-play"
                  disabled={selectionError}
                  aria-pressed={playing}
                  onClick={() => {
                    if (
                      !playing &&
                      (positionRef.current >= selection.end ||
                        positionRef.current < selection.start)
                    )
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
              <RecordingTimeline
                duration={recording.durationSeconds}
                position={position}
                selection={selection}
                onSeek={seek}
                onSelectionChange={(value) =>
                  setPassage(
                    normalizeSelection(value, recording.durationSeconds),
                  )
                }
                disabled={locked}
                t={t}
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
            <fieldset className="recording-display-controls" disabled={locked}>
              <legend>{t("display.heading")}</legend>
              <label>
                {t("recording.layout")}
                <select
                  aria-label={t("recording.layout")}
                  value={layout}
                  onChange={(event) => setLayout(event.target.value)}
                >
                  {["blocks", "conox-frame", "conox-screen"].map((value) => (
                    <option key={value} value={value}>
                      {t(`recording.layout.${value}`)}
                    </option>
                  ))}
                </select>
              </label>
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
            <fieldset
              className="recording-export-controls"
              disabled={locked || assets === null}
            >
              <legend>{t("recording.export")}</legend>
              <div className="recording-export-actions">
                <button
                  type="button"
                  className="sb-btn"
                  onClick={() => startExport("image")}
                >
                  {t("recording.exportImage")}
                </button>
                <button
                  type="button"
                  className="sb-btn"
                  onClick={() => startExport("pdf")}
                >
                  {t("recording.exportPdf")}
                </button>
                {videoFormats.length > 0 && (
                  <label>
                    {t("recording.videoFormat")}
                    <select
                      aria-label={t("recording.videoFormat")}
                      value={videoType}
                      onChange={(event) => setVideoType(event.target.value)}
                    >
                      {videoFormats.map((format) => (
                        <option key={format.mimeType} value={format.mimeType}>
                          {format.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <button
                  type="button"
                  className="sb-btn"
                  disabled={!videoFormats.length || selectionError}
                  onClick={() => startExport("video")}
                >
                  {t("recording.exportVideo")}
                </button>
              </div>
              <p>{t("recording.exportViewNote")}</p>
              <small>
                {videoFormats.length
                  ? t("recording.videoNote", {
                      duration: formatPosition(
                        (selection.end - selection.start) / speed,
                      ),
                    })
                  : t("recording.exportUnsupported")}
              </small>
            </fieldset>
            {exporting && (
              <div className="recording-export-progress" role="status">
                <span>
                  {t(
                    exporting === "video"
                      ? "recording.exportingVideo"
                      : "recording.exportingImage",
                    { count: Math.round(exportProgress * 100) },
                  )}
                </span>
                {exporting === "video" && (
                  <>
                    <progress
                      max={1}
                      value={exportProgress}
                      aria-label={t("recording.exportProgress")}
                    />
                    <button
                      type="button"
                      className="sb-btn"
                      onClick={() => exportAbortRef.current?.abort()}
                    >
                      {t("recording.cancel")}
                    </button>
                  </>
                )}
              </div>
            )}
            {exportError && (
              <p className="recording-error" role="alert">
                {t(
                  `recording.exportError.${["EXPORT_FAILED", "EXPORT_HIDDEN", "UNSUPPORTED_VIDEO"].includes(exportError) ? exportError : "EXPORT_FAILED"}`,
                )}
              </p>
            )}
            <RecordingPresentation
              data={data}
              dsaImage={dsaImage}
              position={position}
              settings={settings}
              layout={layout}
              t={t}
              assets={assets}
            />
          </>
        )}
      </div>
    </main>
  );
}
