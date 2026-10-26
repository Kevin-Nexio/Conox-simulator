import * as React from "react";
import { getPresentationSize } from "../recordings/presentation.js";
import RecordingBlockView from "./RecordingBlockView.jsx";
import RecordingSimulatorView from "./RecordingSimulatorView.jsx";
import RecordingDisplayControls from "./RecordingDisplayControls.jsx";
import "../styles/recordingScene.css";
import { getRecordedIndices } from "../recordings/vectorPlots.js";

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
  const enterRef = React.useRef(null);
  const descriptionId = React.useId();
  const [fullscreen, setFullscreen] = React.useState(false);
  const [scale, setScale] = React.useState(1);
  const size = getPresentationSize(layout);
  React.useLayoutEffect(() => {
    const host = hostRef.current;
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
          'button:not(:disabled), a[href], [tabindex="0"]',
        ),
      ].filter(
        (node) =>
          node.getClientRects().length &&
          getComputedStyle(node).visibility !== "hidden",
      );
    focusable()[0]?.focus();
    const trapTab = (event) => {
      if (event.key === "Tab") {
        const items = focusable();
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
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
        className={`recording-stage layout-${layout}${fullscreen ? " is-fullscreen" : ""}`}
        style={{ "--recording-aspect": size.width / size.height }}
      >
        {fullscreen && (
          <button
            type="button"
            className="sb-btn recording-fullscreen-exit"
            onClick={leaveFullscreen}
          >
            {t("recording.exitFullscreen")}
          </button>
        )}
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
    </section>
  );
}
