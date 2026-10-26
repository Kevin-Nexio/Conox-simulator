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
import { loadPresentationAssets } from "../recordings/presentation.js";
import { createRecordingExportScene } from "./RecordingExportScene.jsx";
import { svgToPdf } from "../recordings/vectorPdf.js";
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
  const { t, displayViews } = React.useMemo(() => createI18n(locale), [locale]);
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
  const [layout, setLayout] = React.useState("simulator-frame");
  const [monitorView, setMonitorView] = React.useState("eeg-dsa");
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
  const togglePlaying = () => {
    if (locked || selectionError || !data) return;
    if (
      !playing &&
      (positionRef.current >= selection.end ||
        positionRef.current < selection.start)
    )
      seek(selection.start);
    setPlaying(!playing);
  };
  const changeSettings = (next) => {
    if (locked) return;
    const setters = {
      eegWindow: setEegWindow,
      amplitude: setAmplitude,
      dsaWindow: setDsaWindow,
      colorOffset: setColorOffset,
      guides: setGuides,
      sef50: setSef50,
      sef95: setSef95,
      monitorView: setMonitorView,
    };
    Object.entries(next).forEach(([key, value]) => setters[key]?.(value));
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
    }, 40);
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
      monitorView,
    }),
    [
      eegWindow,
      amplitude,
      dsaWindow,
      colorOffset,
      guides,
      sef50,
      sef95,
      monitorView,
    ],
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
    const scene = createRecordingExportScene({
      data,
      dsaImage,
      settings,
      layout,
      t,
      assets,
      displayViews,
      signal: controller.signal,
    });
    const { canvas, renderFrame } = scene;
    try {
      await renderFrame(exportPosition);
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
            ? layout === "blocks"
              ? await svgToPdf(scene.element)
              : await canvasToPdf(canvas)
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
      scene.dispose();
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
    <main
      className={`sb-shell recording-shell${recording ? " has-recording" : ""}`}
    >
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
        {!recording && (
          <p className="recording-notice">{t("recording.experimental")}</p>
        )}
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
          {recording && (
            <>
              <span
                className="recording-provisional"
                title={t("recording.experimentalShort")}
              >
                {t("recording.provisional")}
              </span>
              <details className="recording-file-details">
                <summary>{t("recording.fileDetails")}</summary>
                <div className="recording-file-details-body">
                  <p className="recording-file-name">
                    {recording.fileName} · {t("recording.duration")}:{" "}
                    {formatPosition(recording.durationSeconds)}
                  </p>
                  <p className="recording-meta">
                    {recording.id} · {t("recording.date")}:{" "}
                    {recording.startedAt?.replace("T", " ")}
                  </p>
                  <p className="recording-notice">
                    {t("recording.experimental")}
                  </p>
                  <div className="recording-warnings" role="status">
                    {recording.warnings
                      .filter(
                        (warning) => warning.code !== "experimentalDecoding",
                      )
                      .map((warning) => (
                        <p key={warning.code}>
                          {t(`recording.warning.${warning.code}`, warning)}
                        </p>
                      ))}
                  </div>
                </div>
              </details>
            </>
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
            <fieldset className="recording-controls" disabled={locked}>
              <legend>{t("recording.toolbar")}</legend>
              <div className="recording-toolbar-row">
                <div className="recording-transport">
                  <button
                    type="button"
                    className="sb-btn recording-play"
                    disabled={selectionError}
                    aria-pressed={playing}
                    onClick={togglePlaying}
                  >
                    {t(playing ? "recording.pause" : "recording.play")}
                  </button>
                  <button
                    type="button"
                    className="sb-btn"
                    onClick={() => seek(selection.start)}
                  >
                    {t("recording.restart")}
                  </button>
                  <label className="recording-inline-field">
                    {t("recording.speedShort")}
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
                <fieldset
                  className="recording-export-actions"
                  disabled={assets === null}
                  aria-label={t("recording.export")}
                >
                  <button
                    type="button"
                    className="sb-btn"
                    aria-label={t("recording.exportImage")}
                    title={t("recording.exportImage")}
                    onClick={() => startExport("image")}
                  >
                    PNG
                  </button>
                  <button
                    type="button"
                    className="sb-btn"
                    aria-label={t("recording.exportPdf")}
                    title={t("recording.exportPdf")}
                    onClick={() => startExport("pdf")}
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    className="sb-btn"
                    aria-label={t("recording.exportVideo")}
                    title={
                      videoFormats.length
                        ? t("recording.exportVideo")
                        : t("recording.exportUnsupported")
                    }
                    disabled={!videoFormats.length || selectionError}
                    onClick={() => startExport("video")}
                  >
                    {t("recording.videoShort")}
                  </button>
                </fieldset>
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
              <div className="recording-toolbar-row recording-toolbar-secondary">
                <div className="recording-passage">
                  {[
                    ["start", "recording.start"],
                    ["end", "recording.end"],
                  ].map(([key, label]) => (
                    <label key={key} className="recording-inline-field">
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
                {videoFormats.length > 0 && (
                  <label className="recording-inline-field recording-video-format">
                    {t("recording.videoFormat")}
                    <select
                      aria-label={t("recording.videoFormat")}
                      value={videoType}
                      disabled={assets === null}
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
                <details className="recording-help-details">
                  <summary>{t("recording.helpShort")}</summary>
                  <div className="recording-help-body">
                    <p>{t("recording.selectionNote")}</p>
                    <p>{t("recording.exportViewNote")}</p>
                    <p>
                      {videoFormats.length
                        ? t("recording.videoNote", {
                            duration: formatPosition(
                              (selection.end - selection.start) / speed,
                            ),
                          })
                        : t("recording.exportUnsupported")}
                    </p>
                  </div>
                </details>
              </div>
              {selectionError && (
                <p className="recording-error" role="alert">
                  {t("recording.invalidSelection")}
                </p>
              )}
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
              displayViews={displayViews}
              playing={playing}
              onTogglePlaying={togglePlaying}
              onSeek={seek}
              locked={locked}
              onSettingsChange={changeSettings}
              onLayoutChange={setLayout}
            />
          </>
        )}
      </div>
    </main>
  );
}
