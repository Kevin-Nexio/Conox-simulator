import * as React from "react";
import { formatPosition } from "../recordings/playback.js";
import {
  createEegPath,
  createSeriesPath,
  getDsaImageBounds,
  getRecordingRange,
} from "../recordings/vectorPlots.js";

const TREND_COLORS = {
  qcon: "#70ec8f",
  qnox: "#ffdb67",
  bsr: "#ff8d94",
  emg: "#76c9ff",
};

export default function RecordingPlot({
  kind,
  data,
  dsaImage,
  position = 0,
  settings = {},
  width = 1200,
  height = 240,
  axes = true,
  x = 0,
  y = 0,
  embedded = false,
}) {
  const clipId = `recording-plot-${React.useId().replaceAll(":", "")}`;
  const imageUrl = React.useMemo(
    () => (kind === "dsa" ? dsaImage?.toDataURL?.("image/png") || null : null),
    [dsaImage, kind],
  );
  const duration = data?.recording?.durationSeconds || 0;
  const range = getRecordingRange(
    data?.recording,
    position,
    kind === "eeg" ? settings.eegWindow || 4 : settings.dsaWindow,
  );
  const left = axes ? 58 : 0;
  const top = axes ? 22 : 0;
  const plotWidth = Math.max(1, width - left - (axes ? 12 : 0));
  const plotHeight = Math.max(1, height - top - (axes ? 30 : 0));
  const bottom = top + plotHeight;
  const amplitude = settings.amplitude > 0 ? settings.amplitude : 120;
  const values =
    kind === "eeg"
      ? [-amplitude, -amplitude / 2, 0, amplitude / 2, amplitude]
      : kind === "dsa"
        ? [0, 4, 8, 13, 30, 45]
        : [0, 50, 100];
  const yFor = (value) =>
    kind === "eeg"
      ? top + plotHeight / 2 - ((value / amplitude) * plotHeight) / 2
      : bottom - (value / (kind === "dsa" ? 45 : 100)) * plotHeight;
  const xFor = (value) =>
    left +
    ((value - range.start) / Math.max(0.0001, range.end - range.start)) *
      plotWidth;
  const geometry = { range, width: plotWidth, height: plotHeight, left, top };
  const imageBounds = getDsaImageBounds(data?.spectrum, range, geometry);
  const eegPath = React.useMemo(
    () =>
      kind === "eeg"
        ? createEegPath({
            ...geometry,
            samples: data?.filtered,
            sampleRate: data?.recording?.sampleRate,
            amplitude,
          })
        : "",
    [
      kind,
      data?.filtered,
      data?.recording?.sampleRate,
      range.start,
      range.end,
      plotWidth,
      plotHeight,
      left,
      top,
      amplitude,
    ],
  );
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`recording-plot recording-plot-${kind}`}
      x={x}
      y={y}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={axes ? "xMidYMid meet" : "none"}
      style={{
        ...(embedded ? {} : { width: "100%", height: "100%" }),
        display: "block",
        overflow: "hidden",
      }}
      aria-hidden="true"
      fontFamily="Arial, Helvetica, sans-serif"
      fontSize="17"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={left} y={top} width={plotWidth} height={plotHeight} />
        </clipPath>
      </defs>
      <rect width={width} height={height} fill="#030a0d" />
      <g clipPath={`url(#${clipId})`}>
        {kind === "dsa" && imageUrl && imageBounds && (
          <image
            href={imageUrl}
            {...imageBounds}
            preserveAspectRatio="none"
            style={{ imageRendering: "pixelated" }}
          />
        )}
        {values.map(
          (value) =>
            (settings.guides || (kind === "eeg" && value === 0)) && (
              <line
                key={value}
                x1={left}
                x2={left + plotWidth}
                y1={yFor(value)}
                y2={yFor(value)}
                stroke={kind === "dsa" ? "#ffffff80" : "#91a9b34d"}
                strokeDasharray={settings.guides ? "4 5" : undefined}
              />
            ),
        )}
        {settings.guides &&
          Array.from({ length: 5 }, (_, index) => (
            <line
              key={index}
              x1={left + (plotWidth * index) / 4}
              x2={left + (plotWidth * index) / 4}
              y1={top}
              y2={bottom}
              stroke="#91a9b34d"
              strokeDasharray="4 5"
            />
          ))}
        {kind === "eeg" && (
          <path d={eegPath} fill="none" stroke="#edfff6" strokeWidth="1.25" />
        )}
        {kind === "trends" &&
          Object.entries(TREND_COLORS).map(([metric, color]) => (
            <path
              key={metric}
              d={createSeriesPath({
                ...geometry,
                points: data?.recording?.frames,
                metric: (frame) => frame.indices?.[metric],
                maxGap: 0.375,
              })}
              fill="none"
              stroke={color}
              strokeWidth="1.7"
            />
          ))}
        {kind === "dsa" &&
          [
            [settings.sef50, "sef50", "#ffffff"],
            [settings.sef95, "sef95", "#ffacdf"],
          ].map(
            ([enabled, metric, color]) =>
              enabled && (
                <path
                  key={metric}
                  d={createSeriesPath({
                    ...geometry,
                    points: data?.spectrum?.columns,
                    metric,
                    maximum: 45,
                    maxGap: 1.5,
                  })}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.8"
                />
              ),
          )}
        {duration > 0 && position >= range.start && position <= range.end && (
          <line
            x1={xFor(position)}
            x2={xFor(position)}
            y1={top}
            y2={bottom}
            stroke="#f7f9fabb"
            strokeWidth="1.5"
          />
        )}
      </g>
      {axes && (
        <g fill="#c4d4dd">
          {kind !== "trends" && (
            <text x="6" y="15" fontSize="15">
              {kind === "eeg" ? "µV*" : "Hz"}
            </text>
          )}
          {values.map((value) => (
            <text key={value} x="6" y={yFor(value)} dominantBaseline="middle">
              {value}
            </text>
          ))}
          {Array.from({ length: 5 }, (_, index) => (
            <text
              key={index}
              x={left + (plotWidth * index) / 4}
              y={height - 7}
              textAnchor={
                index === 0 ? "start" : index === 4 ? "end" : "middle"
              }
            >
              {formatPosition(
                range.start + ((range.end - range.start) * index) / 4,
              )}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
}
