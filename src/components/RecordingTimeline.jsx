import * as React from "react";
import { formatPosition } from "../recordings/playback.js";
import {
  clampTimelinePosition,
  moveSelectionBoundary,
  normalizeSelection,
} from "../recordings/timeline.js";
import "../styles/recordingTimeline.css";

export default function RecordingTimeline({
  duration,
  position,
  selection,
  onSeek,
  onSelectionChange,
  disabled = false,
  t,
}) {
  const id = React.useId();
  const surfaceRef = React.useRef(null);
  const playheadRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(null);
  const maximum = clampTimelinePosition(duration, duration);
  const passage = normalizeSelection(selection, duration);
  const playhead = clampTimelinePosition(position, duration);
  const minimumSpan = Math.min(0.25, maximum);
  const inactive = disabled || maximum <= 0;
  const percent = (value) => (maximum > 0 ? (value / maximum) * 100 : 0);

  React.useEffect(() => {
    if (inactive) {
      dragRef.current = null;
      setDragging(null);
    }
  }, [inactive]);

  const change = (target, value) => {
    if (inactive) return;
    if (target === "position") {
      onSeek(clampTimelinePosition(value, duration));
    } else {
      onSelectionChange(
        moveSelectionBoundary(passage, target, value, duration),
      );
    }
  };

  const valueAtPointer = (event) => {
    const bounds = surfaceRef.current.getBoundingClientRect();
    return bounds.width > 0
      ? ((event.clientX - bounds.left) / bounds.width) * maximum
      : 0;
  };

  const beginDrag = (event, target) => {
    if (inactive || (event.button !== undefined && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    const value =
      target === "position"
        ? playhead
        : target === "start"
          ? passage.start
          : passage.end;
    dragRef.current = {
      pointerId: event.pointerId,
      target,
      offset: value - valueAtPointer(event),
    };
    setDragging(target);
  };

  const moveDrag = (event) => {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    change(drag.target, valueAtPointer(event) + drag.offset);
  };

  const finishDrag = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    event.stopPropagation();
    dragRef.current = null;
    setDragging(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKey = (event, target, current, minimum, max) => {
    if (inactive) return;
    const step = event.shiftKey ? 1 : 0.25;
    const values = {
      ArrowLeft: current - step,
      ArrowDown: current - step,
      ArrowRight: current + step,
      ArrowUp: current + step,
      Home: minimum,
      End: max,
    };
    if (!(event.key in values)) return;
    event.preventDefault();
    change(target, values[event.key]);
  };

  const sliderProps = (target, label, current, minimum, max) => ({
    role: "slider",
    tabIndex: inactive ? -1 : 0,
    "aria-label": label,
    "aria-orientation": "horizontal",
    "aria-valuemin": minimum,
    "aria-valuemax": max,
    "aria-valuenow": current,
    "aria-valuetext": formatPosition(current, true),
    "aria-disabled": inactive,
    "aria-describedby": `${id}-help`,
    title: `${label}: ${formatPosition(current, true)}`,
    "data-timeline-control": target,
    onPointerDown: (event) => beginDrag(event, target),
    onPointerMove: moveDrag,
    onPointerUp: finishDrag,
    onPointerCancel: finishDrag,
    onLostPointerCapture: finishDrag,
    onKeyDown: (event) => handleKey(event, target, current, minimum, max),
  });

  return (
    <section
      className="recording-timeline"
      aria-labelledby={`${id}-label`}
      data-disabled={inactive}
    >
      <div className="recording-timeline-heading">
        <span id={`${id}-label`}>{t("recording.timeline")}</span>
        <output>
          {formatPosition(passage.start, true)}
          <span aria-hidden="true"> → </span>
          {formatPosition(passage.end, true)}
        </output>
      </div>
      <div
        className="recording-timeline-surface"
        ref={surfaceRef}
        data-dragging={dragging || undefined}
        onPointerDown={(event) => {
          if (event.target.closest("[data-timeline-control]")) return;
          if (inactive || event.button !== 0) return;
          event.preventDefault();
          playheadRef.current.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = {
            pointerId: event.pointerId,
            target: "position",
            offset: 0,
          };
          setDragging("position");
          change("position", valueAtPointer(event));
        }}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onLostPointerCapture={finishDrag}
      >
        <div className="recording-timeline-ruler" aria-hidden="true">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <span
              key={fraction}
              className="recording-timeline-tick"
              style={{ left: `${fraction * 100}%` }}
            >
              {formatPosition(maximum * fraction)}
            </span>
          ))}
        </div>
        <div className="recording-timeline-track" aria-hidden="true">
          <div
            className="recording-timeline-passage"
            style={{
              left: `${percent(passage.start)}%`,
              width: `${percent(passage.end - passage.start)}%`,
            }}
          />
        </div>
        <div
          className="recording-timeline-marker recording-timeline-marker-in"
          style={{ left: `${percent(passage.start)}%` }}
          {...sliderProps(
            "start",
            t("recording.inMarker"),
            passage.start,
            0,
            Math.max(0, passage.end - minimumSpan),
          )}
        >
          <span className="recording-timeline-marker-flag" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M15 5H8v14h7M8 12h9" />
            </svg>
          </span>
          <span className="recording-timeline-marker-stem" aria-hidden="true" />
        </div>
        <div
          className="recording-timeline-marker recording-timeline-marker-out"
          style={{ left: `${percent(passage.end)}%` }}
          {...sliderProps(
            "end",
            t("recording.outMarker"),
            passage.end,
            Math.min(maximum, passage.start + minimumSpan),
            maximum,
          )}
        >
          <span className="recording-timeline-marker-flag" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M9 5h7v14H9M16 12H7" />
            </svg>
          </span>
          <span className="recording-timeline-marker-stem" aria-hidden="true" />
        </div>
        <div
          className="recording-timeline-playhead"
          ref={playheadRef}
          style={{ left: `${percent(playhead)}%` }}
          {...sliderProps(
            "position",
            t("recording.playhead"),
            playhead,
            0,
            maximum,
          )}
        >
          <span
            className="recording-timeline-playhead-head"
            aria-hidden="true"
          />
          <span
            className="recording-timeline-playhead-stem"
            aria-hidden="true"
          />
        </div>
      </div>
      <small id={`${id}-help`} className="recording-timeline-help">
        {t("recording.timelineHelp")}
      </small>
    </section>
  );
}
