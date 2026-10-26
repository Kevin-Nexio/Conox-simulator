export const EEG_SWEEP_GAP_FRACTION = 0.025;

/** The original monitor erases a short circular interval ahead of its cursor. */
export function isEegSweepGap(index, cursor, length) {
  if (
    !Number.isSafeInteger(index) ||
    !Number.isSafeInteger(cursor) ||
    !Number.isSafeInteger(length) ||
    length <= 0
  ) {
    return false;
  }
  const ahead =
    ((((index % length) - (cursor % length)) % length) + length) % length;
  return ahead < Math.ceil(length * EEG_SWEEP_GAP_FRACTION);
}

/**
 * Reconstruct the simulator's circular EEG buffer from a recorded sample count.
 * `seconds` is the quantized read position. Segment display fractions and source
 * ranges are half-open: their end is the next, unread sample, never future data.
 */
export function getEegSweep({
  position = 0,
  duration = 0,
  windowSeconds = 4,
  sampleRate = 1024,
} = {}) {
  const empty = { seconds: 0, cursorFraction: 0, segments: [] };
  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    !Number.isFinite(windowSeconds) ||
    windowSeconds <= 0 ||
    !Number.isFinite(sampleRate) ||
    sampleRate <= 0
  ) {
    return empty;
  }
  const length = Math.max(1, Math.round(windowSeconds * sampleRate));
  const clamped = Number.isFinite(position)
    ? Math.min(duration, Math.max(0, position))
    : 0;
  const count = Math.floor(clamped * sampleRate);
  if (!Number.isSafeInteger(length) || !Number.isSafeInteger(count))
    return empty;

  const cursor = count % length;
  const cycleStart = count - cursor;
  const gap = Math.ceil(length * EEG_SWEEP_GAP_FRACTION);
  const segments = [];
  const add = (start, end, sourceCycleStart) => {
    if (start >= end) return;
    segments.push({
      startFraction: start / length,
      endFraction: end / length,
      range: {
        start: (sourceCycleStart + start) / sampleRate,
        end: (sourceCycleStart + end) / sampleRate,
      },
    });
  };

  // New samples overwrite the left side. Near the right edge the erase gap
  // wraps around and also removes the beginning of this new pass.
  add(Math.max(0, cursor + gap - length), cursor, cycleStart);
  // The remaining right side belongs to the previous pass, when one exists.
  if (cycleStart >= length) {
    add(Math.min(length, cursor + gap), length, cycleStart - length);
  }
  return {
    seconds: count / sampleRate,
    cursorFraction: cursor / length,
    segments,
  };
}
