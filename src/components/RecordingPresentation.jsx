import * as React from "react";
import { getPresentationSize } from "../recordings/presentation.js";
import RecordingBlockView from "./RecordingBlockView.jsx";
import RecordingSimulatorView from "./RecordingSimulatorView.jsx";
import RecordingDisplayControls from "./RecordingDisplayControls.jsx";
import { formatPosition } from "../recordings/playback.js";
import {
  getPlaybackShortcut,
  restorePlaybackFocusAfterPointer,
} from "../recordings/playbackShortcuts.js";
import "../styles/recordingScene.css";
import "../styles/recordingFullscreen.css";
import { getRecordedIndices } from "../recordings/vectorPlots.js";
import { isNativeSpectrum } from "../recordings/referenceProfiles.js";

export default function RecordingPresentation({
  data,
  dsaImage,
  position,
  settings,
  layout,
  t,
  displayViews,
  playing,
  onTogglePlaying,
  onSeek,
  locked,
  onSettingsChange,
  onLayoutChange,
}) {
  const hostRef = React.useRef(null);
  const viewportRef = React.useRef(null);
  const enterRef = React.useRef(null);
  const descriptionId = React.useId();
  const settingsId = React.useId();
  const keyboardHelpId = React.useId();
  const [fullscreen, setFullscreen] = React.useState(false);
  const [showFullscreenSettings, setShowFullscreenSettings] =
    React.useState(false);
  const [scale, setScale] = React.useState(1);
  const size = getPresentationSize(layout);
  React.useLayoutEffect(() => {
    const host = viewportRef.current;
    const resize = () =>
      setScale(
        Math.min(
          host.clientWidth / size.width,
          host.clientHeight / size.height,
        ),
      );
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    return () => observer.disconnect();
  }, [size.width, size.height, fullscreen]);
  const indices = getRecordedIndices(data.recording, position);
  React.useEffect(() => {
    if (!fullscreen) return;
    const focusable = () =>
      [
        ...hostRef.current.querySelectorAll(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, a[href], [tabindex="0"]',
        ),
      ].filter(
        (node) =>
          node.getClientRects().length &&
          getComputedStyle(node).visibility !== "hidden",
      );
    hostRef.current.focus();
    const trapTab = (event) => {
      if (event.key === "Tab") {
        if (!hostRef.current.contains(event.target)) return;
        const items = focusable();
        const first = items[0];
        const last = items.at(-1);
        if (!first) {
          event.preventDefault();
          hostRef.current.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === hostRef.current)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", trapTab);
    return () => {
      document.removeEventListener("keydown", trapTab);
      enterRef.current?.focus();
    };
  }, [fullscreen]);
  React.useEffect(() => {
    if (!fullscreen) return;
    const onPlaybackKey = (event) => {
      const host = hostRef.current;
      if (!host.contains(event.target)) return;
      const dialog = event.target.closest?.('[role="dialog"], dialog');
      if (dialog && dialog !== host) return;
      const command = getPlaybackShortcut(event, {
        fullscreen,
        locked,
        position,
        duration: data.recording.durationSeconds,
      });
      if (!command) return;
      event.preventDefault();
      if (command.type === "toggle") onTogglePlaying();
      else onSeek(command.position);
    };
    document.addEventListener("keydown", onPlaybackKey);
    return () => document.removeEventListener("keydown", onPlaybackKey);
  }, [fullscreen, locked, position, data, onTogglePlaying, onSeek]);
  const leaveFullscreen = () => {
    setFullscreen(false);
    if (document.fullscreenElement === hostRef.current)
      document.exitFullscreen?.().catch(() => {});
  };
  React.useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") leaveFullscreen();
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  const enterFullscreen = () => {
    setFullscreen(true);
    hostRef.current.requestFullscreen?.().catch(() => {});
  };
  return (
    <section className="recording-presentation">
      <div className="recording-presentation-heading">
        <h2 className="recording-accessible-readout">
          {t(`recording.layout.${layout}`)}
        </h2>
        <fieldset
          className="recording-view-choices"
          disabled={locked}
          aria-label={t("recording.layout")}
        >
          <legend className="recording-accessible-readout">
            {t("recording.layout")}
          </legend>
          <span className="recording-view-label" aria-hidden="true">
            {t("recording.viewShort")}
          </span>
          {["blocks", "simulator-frame", "simulator-screen"].map((value) => (
            <button
              type="button"
              key={value}
              className="recording-view-choice"
              aria-pressed={layout === value}
              onClick={() => onLayoutChange(value)}
            >
              {t(`recording.layout.${value}`)}
            </button>
          ))}
        </fieldset>
        <div className="recording-presentation-settings">
          <RecordingDisplayControls
            settings={settings}
            onChange={onSettingsChange}
            locked={locked}
            t={t}
            reference={isNativeSpectrum(data.spectrum)}
          />
          <button
            type="button"
            className="sb-btn"
            ref={enterRef}
            onClick={enterFullscreen}
          >
            {t("recording.fullscreen")}
          </button>
        </div>
      </div>
      <div
        ref={hostRef}
        role={fullscreen ? "dialog" : undefined}
        aria-modal={fullscreen || undefined}
        aria-label={fullscreen ? t(`recording.layout.${layout}`) : undefined}
        aria-describedby={fullscreen ? keyboardHelpId : undefined}
        tabIndex={fullscreen ? 0 : undefined}
        onClick={(event) => restorePlaybackFocusAfterPointer(event, fullscreen)}
        className={`recording-stage layout-${layout}${fullscreen ? " is-fullscreen" : ""}`}
        style={{ "--recording-aspect": size.width / size.height }}
      >
        {fullscreen && (
          <div
            className="recording-fullscreen-toolbar"
            role="group"
            aria-label={t("recording.fullscreenControls")}
          >
            <div className="recording-fullscreen-transport">
              <button
                type="button"
                className="sb-btn"
                disabled={locked}
                onClick={() => onSeek(Math.max(0, position - 5))}
                title={t("recording.seekBack")}
                aria-label={t("recording.seekBack")}
              >
                ← 5 s
              </button>
              <button
                type="button"
                className="sb-btn recording-fullscreen-play"
                disabled={locked}
                aria-pressed={playing}
                onClick={onTogglePlaying}
              >
                {t(playing ? "recording.pause" : "recording.play")}
              </button>
              <button
                type="button"
                className="sb-btn"
                disabled={locked}
                onClick={() =>
                  onSeek(Math.min(data.recording.durationSeconds, position + 5))
                }
                title={t("recording.seekForward")}
                aria-label={t("recording.seekForward")}
              >
                5 s →
              </button>
              <output className="recording-fullscreen-position">
                {formatPosition(position, true)} /{" "}
                {formatPosition(data.recording.durationSeconds)}
              </output>
              <button
                type="button"
                className="sb-btn recording-fullscreen-settings-toggle"
                aria-expanded={showFullscreenSettings}
                aria-controls={settingsId}
                onClick={() => setShowFullscreenSettings((value) => !value)}
              >
                {t("recording.fullscreenSettings")}
              </button>
              <button
                type="button"
                className="sb-btn"
                onClick={leaveFullscreen}
              >
                {t("recording.exitFullscreen")}
              </button>
            </div>
            <p
              id={keyboardHelpId}
              className="recording-fullscreen-keyboard-help"
            >
              {t("recording.keyboardHelp")}
            </p>
            {showFullscreenSettings && (
              <div id={settingsId} className="recording-fullscreen-settings">
                <RecordingDisplayControls
                  settings={settings}
                  onChange={onSettingsChange}
                  locked={locked}
                  t={t}
                  reference={isNativeSpectrum(data.spectrum)}
                />
              </div>
            )}
          </div>
        )}
        <div className="recording-presentation-viewport" ref={viewportRef}>
          <div
            className="recording-view-surface"
            style={{
              width: size.width,
              height: size.height,
              transform: `translate(-50%, -50%) scale(${scale})`,
            }}
          >
            {layout === "blocks" ? (
              <RecordingBlockView
                data={data}
                dsaImage={dsaImage}
                position={position}
                settings={settings}
                t={t}
              />
            ) : (
              <RecordingSimulatorView
                {...{
                  data,
                  dsaImage,
                  position,
                  settings,
                  layout,
                  t,
                  displayViews,
                  playing,
                  onTogglePlaying,
                  onSeek,
                  locked,
                  onSettingsChange,
                }}
              />
            )}
          </div>
          <p id={descriptionId} className="recording-accessible-readout">
            {t("recording.experimentalShort")}.{" "}
            {[
              ["qCON", "qcon"],
              ["qNOX", "qnox"],
              ["BSR", "bsr"],
              ["SQI", "sqi"],
              ["EMG", "emg"],
            ]
              .map(
                ([label, key]) =>
                  `${label}: ${indices?.[key] ?? t("recording.unavailable")}`,
              )
              .join(". ")}
          </p>
        </div>
      </div>
    </section>
  );
}
