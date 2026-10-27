import * as React from "react";
import {
  createReferenceEegPath,
  createAndroidEegPath,
  createReferenceSweepPath,
} from "../recordings/referenceEeg.js";
import { isNativeSpectrum } from "../recordings/referenceProfiles.js";
import {
  createEegSweepPath,
  createSeriesPath,
  getDsaImageBounds,
  getRecordingRange,
  formatPlotPosition,
} from "../recordings/vectorPlots.js";

const TREND_COLORS = {
  qcon: "#ffffff",
  qnox: "#ffff00",
  bsr: "#ff0000",
  emg: "#0080ff",
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
  const eegWindow =
    Number.isFinite(settings.eegWindow) && settings.eegWindow > 0
      ? settings.eegWindow
      : 4;
  const range =
    kind === "eeg"
      ? { start: 0, end: eegWindow }
      : getRecordingRange(data?.recording, position, settings.dsaWindow, {
          batchSeconds:
            kind === "dsa" && data?.referenceProfile === "android-2.4" ? 5 : 0,
        });
  const left = axes ? 58 : 0;
  const top = axes ? 22 : 0;
  const plotWidth = Math.max(1, width - left - (axes ? 12 : 0));
  const plotHeight = Math.max(1, height - top - (axes ? 30 : 0));
  const bottom = top + plotHeight;
  const amplitude = settings.amplitude > 0 ? settings.amplitude : 120;
  const referenceEeg = data?.eeg?.source === "conoxview-16be";
  const referenceDsa = isNativeSpectrum(data?.spectrum);
  const android = data?.referenceProfile === "android-2.4";
  const iosDsa = referenceDsa && !android;
  const values =
    kind === "eeg"
      ? referenceEeg && !android
        ? [0, 0.5, 1]
        : [-amplitude, -amplitude / 2, 0, amplitude / 2, amplitude]
      : kind === "dsa"
        ? [iosDsa ? 1 : 0, 4, 8, 13, 30, 45]
        : [0, 50, 100];
  const yFor = (value) =>
    kind === "eeg"
      ? referenceEeg && !android
        ? top + plotHeight * (0.8 - (value * 2) / 3)
        : top + plotHeight / 2 - ((value / amplitude) * plotHeight) / 2
      : bottom -
        ((value - (kind === "dsa" && iosDsa ? 1 : 0)) /
          (kind === "dsa" ? (iosDsa ? 44 : 45) : 100)) *
          plotHeight;
  const xFor = (value) =>
    left +
    ((value - range.start) / Math.max(0.0001, range.end - range.start)) *
      plotWidth;
  const geometry = { range, width: plotWidth, height: plotHeight, left, top };
  const imageBounds = getDsaImageBounds(data?.spectrum, range, geometry);
  const sweep = React.useMemo(
    () =>
      kind === "eeg"
        ? (referenceEeg
            ? settings.eegMotion !== "scroll"
              ? createReferenceSweepPath
              : android
                ? createAndroidEegPath
                : createReferenceEegPath
            : createEegSweepPath)({
            ...geometry,
            samples: data?.eeg?.samples || data?.filtered,
            sampleRate: data?.eeg?.sampleRate || data?.recording?.sampleRate,
            amplitude,
            position,
            duration,
            windowSeconds: eegWindow,
            profile: data?.referenceProfile,
          })
        : null,
    [
      kind,
      data?.filtered,
      data?.eeg,
      referenceEeg,
      android,
      data?.recording?.sampleRate,
      range.start,
      range.end,
      plotWidth,
      plotHeight,
      left,
      top,
      amplitude,
      position,
      duration,
      eegWindow,
      settings.eegMotion,
    ],
  );
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`recording-plot recording-plot-${kind}`}
      data-sweep-cursor={sweep?.cursorFraction}
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
      <rect
        width={width}
        height={height}
        fill={
          kind === "dsa" && android
            ? "#00007f"
            : referenceEeg || referenceDsa
              ? "#000000"
              : "#030a0d"
        }
      />
      <g clipPath={`url(#${clipId})`}>
        {kind === "dsa" && imageUrl && imageBounds && (
          <image
            href={imageUrl}
            {...imageBounds}
            preserveAspectRatio="none"
            style={{ imageRendering: android ? "auto" : "pixelated" }}
          />
        )}
        {values.map(
          (value) =>
            (settings.guides ||
              (kind === "eeg" && !referenceEeg && value === 0)) && (
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
          (kind === "eeg"
            ? Array.from(
                { length: Math.max(0, Math.ceil(eegWindow) - 1) },
                (_, index) => (index + 1) / eegWindow,
              )
            : [0, 0.25, 0.5, 0.75, 1]
          ).map((fraction, index) => (
            <line
              key={index}
              x1={left + plotWidth * fraction}
              x2={left + plotWidth * fraction}
              y1={top}
              y2={bottom}
              stroke="#91a9b34d"
              strokeDasharray="4 5"
            />
          ))}
        {kind === "eeg" && (
          <path
            d={sweep.path}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.25"
          />
        )}
        {kind === "trends" &&
          Object.entries(TREND_COLORS).map(([metric, color]) => (
            <path
              key={metric}
              d={createSeriesPath({
                ...geometry,
                points: data?.recording?.trendFrames || data?.recording?.frames,
                metric: (frame) =>
                  !referenceDsa || frame.time <= position
                    ? frame.indices?.[metric]
                    : null,
                maxGap: android ? 1.5 : 0.375,
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
              enabled &&
              !referenceDsa && (
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
        {duration > 0 &&
          ((kind === "eeg" &&
            (!referenceEeg || settings.eegMotion !== "scroll")) ||
            (kind !== "eeg" &&
              position >= range.start &&
              position <= range.end)) && (
            <line
              x1={
                kind === "eeg"
                  ? left + sweep.cursorFraction * plotWidth
                  : xFor(position)
              }
              x2={
                kind === "eeg"
                  ? left + sweep.cursorFraction * plotWidth
                  : xFor(position)
              }
              y1={top}
              y2={bottom}
              stroke={kind === "eeg" ? "#81d3aba6" : "#f7f9fabb"}
              strokeWidth="1.5"
            />
          )}
      </g>
      {axes && (
        <g fill="#c4d4dd">
          {kind !== "trends" && (
            <text x="6" y="15" fontSize="15">
              {kind === "eeg" ? (referenceEeg ? "µV" : "µV*") : "Hz"}
            </text>
          )}
          {values.map((value) => (
            <text key={value} x="6" y={yFor(value)} dominantBaseline="middle">
              {kind === "eeg" && referenceEeg && !android
                ? value === 0.5
                  ? amplitude
                  : "-"
                : value}
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
              {kind === "eeg"
                ? `${(eegWindow * index) / 4} s`
                : formatPlotPosition(
                    range.start + ((range.end - range.start) * index) / 4,
                  )}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
}
