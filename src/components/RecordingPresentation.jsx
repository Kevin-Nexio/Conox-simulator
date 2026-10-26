import * as React from "react";
import {
  getPresentationSize,
  renderPresentation,
} from "../recordings/presentation.js";

export default function RecordingPresentation({
  data,
  dsaImage,
  position,
  settings,
  layout,
  t,
  assets,
}) {
  const canvasRef = React.useRef(null);
  const hostRef = React.useRef(null);
  const enterRef = React.useRef(null);
  const descriptionId = React.useId();
  const [fullscreen, setFullscreen] = React.useState(false);
  const size = getPresentationSize(layout);
  const indices =
    data.recording.frames[
      Math.min(data.recording.frames.length - 1, Math.floor(position * 4))
    ]?.indices;
  React.useEffect(() => {
    if (!fullscreen) return;
    hostRef.current.querySelector("button")?.focus();
    const trapTab = (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
        hostRef.current.querySelector("button")?.focus();
      }
    };
    document.addEventListener("keydown", trapTab);
    return () => {
      document.removeEventListener("keydown", trapTab);
      enterRef.current?.focus();
    };
  }, [fullscreen]);
  React.useEffect(() => {
    renderPresentation(canvasRef.current, {
      data,
      dsaImage,
      position,
      settings,
      layout,
      t,
      assets: assets || {},
    });
  }, [data, dsaImage, position, settings, layout, t, assets]);
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
        <h2>{t(`recording.layout.${layout}`)}</h2>
        <button
          type="button"
          className="sb-btn"
          ref={enterRef}
          onClick={enterFullscreen}
        >
          {t("recording.fullscreen")}
        </button>
      </div>
      <div
        ref={hostRef}
        role={fullscreen ? "dialog" : undefined}
        aria-modal={fullscreen || undefined}
        aria-label={fullscreen ? t(`recording.layout.${layout}`) : undefined}
        className={`recording-stage layout-${layout}${fullscreen ? " is-fullscreen" : ""}`}
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
        <canvas
          ref={canvasRef}
          width={size.width}
          height={size.height}
          aria-label={t(`recording.layout.${layout}`)}
          aria-describedby={descriptionId}
        />
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
