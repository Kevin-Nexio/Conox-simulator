import { EFFECT_LABELS } from "../data/index.js";
import { clamp } from "../simulation/engine.js";

export function TrendChart({ samples }) {
  const pointsFor = (metric) =>
    samples
      .map((sample, index) => {
        const x = Number.isFinite(sample.trendX)
          ? sample.trendX
          : (index / Math.max(1, samples.length - 1)) * 600;
        const y = 180 - clamp(sample[metric], 0, 100) * 1.8;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <svg
      className="sb-trend-chart"
      viewBox="0 0 600 180"
      preserveAspectRatio="none"
      role="img"
      aria-label="Zeitverlauf von qCON, qNOX, BSR und EMG"
    >
      {[0, 45, 90, 135, 180].map((y) => (
        <line key={y} x1="0" y1={y} x2="600" y2={y} />
      ))}
      <polyline points={pointsFor("qcon")} className="qcon" />
      <polyline points={pointsFor("qnox")} className="qnox" />
      <polyline points={pointsFor("bsr")} className="bsr" />
      <polyline points={pointsFor("emg")} className="emg" />
    </svg>
  );
}

export function Metric({ label, value, tone }) {
  return (
    <div className={`sb-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  disabled = false,
}) {
  return (
    <label className="sb-field">
      <span>{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DoseControl({ label, value, onChange, compact = false }) {
  return (
    <div className={`sb-dose-control ${compact ? "compact" : ""}`}>
      <div>
        <span>{label}</span>
        <strong>
          {value} · {EFFECT_LABELS[value]}
        </strong>
      </div>
      <div className="sb-dose-steps">
        {[1, 2, 3, 4].map((level) => (
          <button
            key={level}
            type="button"
            className={value === level ? "active" : ""}
            onClick={() => onChange(level)}
            title={EFFECT_LABELS[level]}
          >
            <b>{level}</b>
            {!compact && <small>{EFFECT_LABELS[level]}</small>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FactRow({ label, value }) {
  return (
    <p>
      <strong>{label}:</strong> {value}
    </p>
  );
}

// Compatibility aliases retained so the reconstructed App stays behavior-identical.
export const Bm = TrendChart;
export const Li = Metric;
export const Ja = SelectField;
export const rf = DoseControl;
export const Zi = FactRow;
