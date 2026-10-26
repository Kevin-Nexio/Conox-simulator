import * as React from "react";
import { createSeriesPath } from "../recordings/vectorPlots.js";

export const TIMELINE_INDICES = [
  ["qcon", "qCON", "#70ec8f"],
  ["qnox", "qNOX", "#ffdb67"],
  ["bsr", "BSR", "#ff8d94"],
  ["sqi", "SQI", "#c7a5ff"],
  ["emg", "EMG", "#76c9ff"],
];

// Paths depend on the case, not the playhead: scrubbing only moves the cursor.
export default React.memo(function RecordingTimelineTrends({
  frames,
  duration,
  hidden,
}) {
  const paths = React.useMemo(
    () =>
      TIMELINE_INDICES.map(([key, label, color]) => ({
        key,
        label,
        color,
        path: createSeriesPath({
          points: frames,
          metric: (frame) => frame.indices?.[key],
          range: { start: 0, end: duration },
          width: 1200,
          height: 52,
          top: 4,
          maxGap: 0.375,
        }),
      })),
    [frames, duration],
  );
  return (
    <svg
      className="recording-timeline-trends"
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {[4, 30, 56].map((y) => (
        <line
          key={y}
          x1="0"
          x2="1200"
          y1={y}
          y2={y}
          stroke="#91a9b333"
          strokeDasharray="3 5"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {paths.map(({ key, color, path }) => (
        <path
          key={key}
          data-index={key}
          d={path}
          visibility={hidden.includes(key) ? "hidden" : undefined}
          fill="none"
          stroke={color}
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
});
