const PRECISION = 100;

function units(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * PRECISION) : fallback;
}

function limits(duration, minimumSpan) {
  const maximum = Math.max(0, units(duration));
  const span = Math.min(maximum, Math.max(1, units(minimumSpan, 25)));
  return { maximum, span };
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

/** Keep timeline values on a centisecond grid and inside the full recording. */
export function clampTimelinePosition(position, duration) {
  const { maximum } = limits(duration, 0.25);
  return clamp(units(position), 0, maximum) / PRECISION;
}

/** Repair invalid passages while preserving their start whenever possible. */
export function normalizeSelection(selection, duration, minimumSpan = 0.25) {
  const { maximum, span } = limits(duration, minimumSpan);
  const start = clamp(units(selection?.start), 0, maximum - span);
  const end = clamp(units(selection?.end, maximum), start + span, maximum);
  return { start: start / PRECISION, end: end / PRECISION };
}

/** Move one edit marker without moving or crossing the opposite marker. */
export function moveSelectionBoundary(
  selection,
  boundary,
  value,
  duration,
  minimumSpan = 0.25,
) {
  const normalized = normalizeSelection(selection, duration, minimumSpan);
  const { maximum, span } = limits(duration, minimumSpan);
  const start = units(normalized.start);
  const end = units(normalized.end);
  if (boundary === "start") {
    return {
      start: clamp(units(value, start), 0, end - span) / PRECISION,
      end: end / PRECISION,
    };
  }
  if (boundary === "end") {
    return {
      start: start / PRECISION,
      end: clamp(units(value, end), start + span, maximum) / PRECISION,
    };
  }
  return normalized;
}
