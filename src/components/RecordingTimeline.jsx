import * as React from "react";
import { formatPosition } from "../recordings/playback.js";
import {
  clampTimelinePosition,
  moveSelectionBoundary,
  normalizeSelection,
} from "../recordings/timeline.js";
import "../styles/recordingTimeline.css";
import RecordingTimelineTrends, {
  TIMELINE_INDICES,
} from "./RecordingTimelineTrends.jsx";
import RecordingEventEditor from "./RecordingEventEditor.jsx";
import { saveEventMarker } from "../recordings/eventMarkers.js";

const NO_FRAMES = [];

export default function RecordingTimeline({
  duration,
  position,
  selection,
  frames = NO_FRAMES,
  markers: eventMarkers,
  onMarkersChange: setEventMarkers,
  timelineOptions,
  onTimelineOptionsChange,
  onSeek,
  onSelectionChange,
  disabled = false,
  t,
}) {
  const id = React.useId();
  const surfaceRef = React.useRef(null);
  const playheadRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const nextEventId = React.useRef(0);
  const [dragging, setDragging] = React.useState(null);
  const { showIndices, hiddenIndices } = timelineOptions;
  const [eventEditor, setEventEditor] = React.useState(null);
  const curvesVisible = showIndices && frames.length > 0;
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
  // Marker data is restored by the player; only the open editor belongs here.
  React.useEffect(() => {
    setEventEditor(null);
  }, [frames]);

  const editEvent = (marker) => {
    if (inactive) return;
    onSeek(marker?.time ?? playhead);
    setEventEditor(marker || { id: null, label: "", time: playhead });
  };

  const change = (target, value) => {
    if (inactive) return;
    if (target === "position") {
      onSeek(clampTimelinePosition(value, duration));
    } else if (target.startsWith("event:")) {
      const eventId = target.slice(6);
      const time = clampTimelinePosition(value, duration);
      setEventMarkers((current) => {
        const marker = current.find((item) => item.id === eventId);
        return marker
          ? saveEventMarker(current, { ...marker, time }, duration) || current
          : current;
      });
      onSeek(time);
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
          : target === "end"
            ? passage.end
            : eventMarkers.find((marker) => `event:${marker.id}` === target)
                ?.time || 0;
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
      data-indices={curvesVisible}
    >
      <div className="recording-timeline-heading">
        <span id={`${id}-label`}>{t("recording.timeline")}</span>
        <div className="recording-timeline-index-controls">
          <button
            type="button"
            className="recording-timeline-add-event"
            aria-label={t("recording.eventAdd")}
            title={t("recording.eventAdd")}
            disabled={inactive}
            onClick={() => editEvent()}
          >
            + {t("recording.eventShort")}
            {eventMarkers.length > 0 && ` (${eventMarkers.length})`}
          </button>
          <button
            type="button"
            className="recording-timeline-indices-toggle"
            aria-pressed={showIndices}
            aria-label={t("recording.timelineIndices")}
            title={t("recording.timelineIndicesHelp")}
            disabled={inactive || !frames.length}
            onClick={() =>
              onTimelineOptionsChange((current) => ({
                ...current,
                showIndices: !current.showIndices,
              }))
            }
          >
            <svg viewBox="0 0 20 16" aria-hidden="true">
              <path d="M1 13 5 6 9 10 13 2 19 8" />
            </svg>
            {t("recording.timelineIndicesShort")}
          </button>
          {curvesVisible && (
            <div
              className="recording-timeline-index-legend"
              role="group"
              aria-label={t("recording.timelineIndices")}
            >
              {TIMELINE_INDICES.map(([key, label, color]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={!hiddenIndices.includes(key)}
                  disabled={inactive}
                  style={{ "--index-color": color }}
                  onClick={() =>
                    onTimelineOptionsChange((current) => ({
                      ...current,
                      hiddenIndices: current.hiddenIndices.includes(key)
                        ? current.hiddenIndices.filter((index) => index !== key)
                        : [...current.hiddenIndices, key],
                    }))
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <output>
          {formatPosition(passage.start, true)}
          <span aria-hidden="true"> → </span>
          {formatPosition(passage.end, true)}
        </output>
      </div>
      {eventEditor && (
        <RecordingEventEditor
          initial={eventEditor}
          markers={eventMarkers}
          duration={maximum}
          t={t}
          onClose={() => setEventEditor(null)}
          onSeek={onSeek}
          onDelete={(eventId) =>
            setEventMarkers((current) =>
              current.filter((marker) => marker.id !== eventId),
            )
          }
          onSave={(draft) => {
            let eventId = draft.id;
            if (!eventId) {
              do {
                eventId = `event-${++nextEventId.current}`;
              } while (eventMarkers.some((marker) => marker.id === eventId));
            }
            const event = {
              ...draft,
              id: eventId,
            };
            const next = saveEventMarker(eventMarkers, event, maximum);
            if (!next) return false;
            setEventMarkers(next);
            onSeek(event.time);
            return true;
          }}
        />
      )}
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
          {curvesVisible && (
            <RecordingTimelineTrends
              frames={frames}
              duration={maximum}
              hidden={hiddenIndices}
            />
          )}
        </div>
        {eventMarkers.map((marker, index) => (
          <button
            key={marker.id}
            type="button"
            className="recording-timeline-event"
            data-timeline-control={`event:${marker.id}`}
            disabled={inactive}
            aria-label={`${t("recording.eventShort")} ${index + 1} : ${marker.label}, ${formatPosition(marker.time, true)}`}
            title={`${marker.label} · ${formatPosition(marker.time, true)}. ${t("recording.eventMarkerHelp")}`}
            style={{ left: `${percent(marker.time)}%` }}
            onClick={() => onSeek(marker.time)}
            onDoubleClick={() => editEvent(marker)}
            onPointerDown={(event) => beginDrag(event, `event:${marker.id}`)}
            onPointerMove={moveDrag}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onLostPointerCapture={finishDrag}
            onKeyDown={(event) => {
              if (event.key === "F2") {
                event.preventDefault();
                editEvent(marker);
              } else {
                handleKey(event, `event:${marker.id}`, marker.time, 0, maximum);
              }
            }}
          >
            <span
              className="recording-timeline-event-stem"
              aria-hidden="true"
            />
            <span aria-hidden="true">{index + 1}</span>
          </button>
        ))}
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
          <span className="recording-timeline-marker-flag" aria-hidden="true" />
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
          <span className="recording-timeline-marker-flag" aria-hidden="true" />
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
