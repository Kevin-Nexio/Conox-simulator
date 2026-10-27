export const EEG_SAMPLE_RATE = 128;
export const EEG_DRAW_RATE = 32;
export const EEG_BATCH_SIZE = 4;

export function createEegHistory() {
  return {
    samples: new Float32Array(1152),
    count: 0,
    cursor: 0,
    totalSamples: 0,
  };
}

export function appendEegSample(history, sample) {
  history.samples[history.cursor] = sample;
  history.cursor = (history.cursor + 1) % history.samples.length;
  history.count = Math.min(history.samples.length, history.count + 1);
  history.totalSamples++;
}

export function clearEegHistory(history) {
  history.count = history.cursor = history.totalSamples = 0;
}

export function visibleEegSamples(history, windowSeconds = 4) {
  const capacity = EEG_SAMPLE_RATE * windowSeconds;
  const count = Math.min(capacity, history.count);
  const first =
    (history.cursor - count + history.samples.length) % history.samples.length;
  return Array.from(
    { length: count },
    (_, index) => history.samples[(first + index) % history.samples.length],
  );
}

/** Draw the same retained samples either at fixed sweep slots or scrolling.
 * Sweeping changes only their screen positions, never the signal sent to FFT. */
export function getEegHistoryView(
  history,
  windowSeconds = 4,
  motion = "sweep",
  alignRight = false,
) {
  const values = visibleEegSamples(history, windowSeconds);
  const capacity = Math.round(EEG_SAMPLE_RATE * windowSeconds);
  if (motion === "scroll") {
    const denominator = Math.max(1, capacity - (alignRight ? 0 : 1));
    return {
      values,
      startFraction: alignRight ? (capacity - values.length) / capacity : 0,
      stepFraction: 1 / denominator,
      cursorFraction: null,
    };
  }
  const count = history.totalSamples;
  const cursor = count % capacity;
  const slots = new Float32Array(capacity).fill(NaN);
  values.forEach((value, index) => {
    const slot = (count - values.length + index) % capacity;
    if (!isEegSweepGap(slot, cursor, capacity)) slots[slot] = value;
  });
  return {
    values: slots,
    startFraction: 0,
    stepFraction: 1 / capacity,
    cursorFraction: cursor / capacity,
  };
}

/** Accumulate active time instead of rounding fractional samples on each timer. */
export function consumeEegTicks(clock, now, running) {
  const previous = clock.previous;
  const wasRunning = clock.running;
  clock.previous = now;
  clock.running = running;
  clock.discontinuity = false;
  if (!running || !wasRunning || previous === undefined) {
    clock.remainder = 0;
    return 0;
  }
  clock.remainder = (clock.remainder || 0) + Math.max(0, now - previous) / 1000;
  const ticks = Math.floor(clock.remainder * EEG_DRAW_RATE + 1e-9);
  clock.remainder -= ticks / EEG_DRAW_RATE;
  // A background tab resumes with fresh drawing, without a long blocking loop.
  clock.discontinuity = ticks > EEG_DRAW_RATE;
  if (clock.discontinuity) clock.remainder = 0;
  return Math.min(EEG_DRAW_RATE, ticks);
}
import { isEegSweepGap } from "./eegSweep.js";
