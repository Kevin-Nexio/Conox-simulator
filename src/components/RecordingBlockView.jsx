import * as React from "react";
import { dsaDbToRgb } from "../simulation/engine.js";
import { formatPosition } from "../recordings/playback.js";
import { getRecordedIndices } from "../recordings/vectorPlots.js";
import RecordingPlot from "./RecordingPlot.jsx";

const METRICS = [
  ["qCON", "qcon", "#70ec8f"],
  ["qNOX", "qnox", "#ffdb67"],
  ["BSR", "bsr", "#ff8d94"],
  ["SQI", "sqi", "#70ec8f"],
  ["EMG", "emg", "#76c9ff"],
];

function Text({
  x,
  y,
  size = 20,
  color = "#d8e7ed",
  bold,
  align = "start",
  children,
}) {
  return (
    <text
      x={x}
      y={y}
      fill={color}
      fontSize={size}
      fontWeight={bold ? 700 : 400}
      textAnchor={align}
      dominantBaseline="middle"
    >
      {children}
    </text>
  );
}

function Box({ x, y, width, height, fill = "#030a0d" }) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx="9"
      fill={fill}
      stroke="#3f5866"
      strokeWidth="1.5"
    />
  );
}

const RecordingBlockView = React.forwardRef(function RecordingBlockView(
  { data, dsaImage, position = 0, settings = {}, t },
  ref,
) {
  const gradientId = `recording-dsa-scale-${React.useId().replaceAll(":", "")}`;
  const indices = getRecordedIndices(data?.recording, position);
  const normalized = {
    eegWindow: 4,
    amplitude: 120,
    colorOffset: 0,
    guides: true,
    ...settings,
  };
  const plotProps = {
    data,
    dsaImage,
    position,
    settings: normalized,
    axes: true,
    embedded: true,
  };
  const duration = data?.recording?.durationSeconds || 0;
  const scaleTop = 635;
  const scaleHeight = 205;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      className="recording-block-view"
      width="1600"
      height="1200"
      viewBox="0 0 1600 1200"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", width: "100%", height: "100%" }}
      fontFamily="Arial, Helvetica, sans-serif"
      role="img"
      aria-label={t("recording.layout.blocks")}
    >
      <title>{t("recording.layout.blocks")}</title>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
          {Array.from({ length: 41 }, (_, step) => {
            const [red, green, blue] = dsaDbToRgb(-30 + step * 2);
            return (
              <stop
                key={step}
                offset={`${step * 2.5}%`}
                stopColor={`rgb(${red},${green},${blue})`}
              />
            );
          })}
        </linearGradient>
      </defs>
      <rect width="1600" height="1200" fill="#071118" />
      <Text x={42} y={46} size={31} color="#f1f7fa" bold>
        {t("recording.title")}
      </Text>
      <Text x={1558} y={46} size={27} color="#e7f5fc" align="end">
        {formatPosition(position, true)} / {formatPosition(duration)}
      </Text>
      <Text x={42} y={89} size={20} color="#f3c981">
        {t("recording.experimentalShort")}
      </Text>

      <Box x={42} y={124} width={1516} height={134} fill="#02090d" />
      <Text x={64} y={151} size={19} color="#b6c8d1">
        {t("recording.indices")}
      </Text>
      {METRICS.map(([label, key, color], index) => (
        <g key={key}>
          <Text x={68 + index * 301} y={205} size={25} color={color} bold>
            {label}
          </Text>
          <Text
            x={262 + index * 301}
            y={205}
            size={45}
            color={color}
            bold
            align="end"
          >
            {Number.isFinite(indices?.[key]) ? indices[key] : "--"}
          </Text>
        </g>
      ))}

      <Box x={42} y={278} width={1516} height={261} />
      <Text x={64} y={304} size={20} color="#dceaf0" bold>
        {t("recording.eeg")}
      </Text>
      <Text x={1534} y={304} size={19} color="#b6c8d1" align="end">
        {normalized.eegWindow} s · ±{normalized.amplitude} µV*
      </Text>
      <RecordingPlot
        {...plotProps}
        kind="eeg"
        x={57}
        y={329}
        width={1486}
        height={201}
      />

      <Box x={42} y={559} width={1516} height={328} />
      <Text x={64} y={586} size={20} color="#dceaf0" bold>
        {t("recording.dsa")}
      </Text>
      <Text x={1540} y={586} size={17} color="#b6c8d1" align="end">
        dB / µV²/Hz
      </Text>
      {[
        [normalized.sef50, "SEF50", "#ffffff"],
        [normalized.sef95, "SEF95", "#ffacdf"],
      ].map(
        ([enabled, label, color], index) =>
          enabled && (
            <g key={label}>
              <line
                x1={900 + index * 119}
                x2={920 + index * 119}
                y1="586"
                y2="586"
                stroke={color}
                strokeWidth="3"
              />
              <Text x={927 + index * 119} y={586} size={17} color={color}>
                {label}
              </Text>
            </g>
          ),
      )}
      <RecordingPlot
        {...plotProps}
        kind="dsa"
        x={57}
        y={613}
        width={1372}
        height={257}
      />
      <rect
        x="1444"
        y={scaleTop}
        width="31"
        height={scaleHeight}
        fill={`url(#${gradientId})`}
        stroke="#6a7a84"
      />
      {[0, 1, 2, 3, 4].map((step) => (
        <Text
          key={step}
          x={1482}
          y={scaleTop + (step * scaleHeight) / 4}
          size={17}
        >
          {50 - step * 20 - normalized.colorOffset}
        </Text>
      ))}

      <Box x={42} y={907} width={1516} height={232} />
      <Text x={64} y={934} size={20} color="#dceaf0" bold>
        {t("recording.trends")}
      </Text>
      {METRICS.filter(([, key]) => key !== "sqi").map(
        ([label, key, color], index) => (
          <g key={key}>
            <line
              x1={1030 + index * 99}
              x2={1049 + index * 99}
              y1="934"
              y2="934"
              stroke={color}
              strokeWidth="3"
            />
            <Text x={1056 + index * 99} y={934} size={17} color={color}>
              {label}
            </Text>
          </g>
        ),
      )}
      <RecordingPlot
        {...plotProps}
        kind="trends"
        x={57}
        y={958}
        width={1486}
        height={172}
      />
      <Text x={42} y={1170} size={17} color="#95acb9">
        {t("recording.dsaMethod")}
      </Text>
    </svg>
  );
});

export default RecordingBlockView;
