// ConoxView's received 16-bit display channel. This transform reproduces the
// inspected float32 arithmetic; it does not calibrate the separate 24-bit ADC.
export const CONOXVIEW_EEG_SCALES = Object.freeze({
  25: { offset: 531, maximum: 1121 },
  50: { offset: 1061, maximum: 2243 },
  120: { offset: 2552, maximum: 5394 },
  475: { offset: 10079, maximum: 21307 },
});
const DIVISOR = Math.fround(3.0757);

/** Original monitor sweep with each reference profile's vertical projection. */
export function createReferenceSweepPath({
  samples,
  position = 0,
  windowSeconds = 4,
  amplitude = 120,
  width,
  height,
  left = 0,
  top = 0,
  profile = "ios-1.1",
}) {
  if (!samples?.length || !(width > 0) || !(height > 0))
    return { path: "", cursorFraction: 0 };
  const android = profile === "android-2.4";
  const sampleCount = Math.max(
    0,
    android
      ? Math.floor((Number(position) || 0) * 128 + 1e-9)
      : Math.floor((Number(position) || 0) * 32 + 1e-9) * 4,
  );
  const sweep = getEegSweep({
    position: Math.min(samples.length, sampleCount) / 128,
    duration: samples.length / 128,
    windowSeconds,
    sampleRate: 128,
  });
  const number = (value) => Math.round(value * 1000) / 1000;
  const parts = [];
  const yFor = android ? androidEegY : conoxviewEegY;
  for (const segment of sweep.segments) {
    let connected = false;
    const start = Math.round(segment.range.start * 128);
    const end = Math.min(samples.length, Math.round(segment.range.end * 128));
    for (let index = start; index < end; index++) {
      const y = yFor(samples[index], amplitude);
      if (!Number.isFinite(y)) {
        connected = false;
        continue;
      }
      const x =
        left +
        (segment.startFraction + (index - start) / (windowSeconds * 128)) *
          width;
      parts.push(
        `${connected ? "L" : "M"}${number(x)},${number(top + height * y)}`,
      );
      connected = true;
    }
  }
  return { path: parts.join(" "), cursorFraction: sweep.cursorFraction };
}

export const ANDROID_EEG_SCALES = Object.freeze({
  25: { minimum: 29276, maximum: 32724 },
  50: { minimum: 27551, maximum: 34449 },
  120: { minimum: 22723, maximum: 39277 },
  250: { minimum: 13755, maximum: 48245 },
  475: { minimum: -1767, maximum: 63767 },
});

export function androidEegY(raw, amplitude = 120) {
  if (!Number.isFinite(raw)) return NaN;
  const { minimum, maximum } =
    ANDROID_EEG_SCALES[amplitude] || ANDROID_EEG_SCALES[120];
  return Math.max(0, Math.min(1, (maximum - raw) / (maximum - minimum)));
}

/** Nominal 128 Hz replay; native FIFO/thread jitter is not in a CXBIN file. */
export function createAndroidEegPath({
  samples,
  position = 0,
  windowSeconds = 9,
  amplitude = 120,
  width,
  height,
  left = 0,
  top = 0,
}) {
  if (!samples?.length || !(width > 0) || !(height > 0))
    return { path: "", cursorFraction: 1 };
  const capacity =
    128 * ([3, 6, 9].includes(windowSeconds) ? windowSeconds : 9);
  const count = Math.min(
    samples.length,
    Math.max(0, Math.floor((Number(position) || 0) * 128 + 1e-9)),
  );
  const start = Math.max(0, count - capacity);
  const visible = count - start;
  const number = (value) => Math.round(value * 1000) / 1000;
  const parts = [];
  let connected = false;
  for (let index = start; index < count; index++) {
    const y = androidEegY(samples[index], amplitude);
    if (!Number.isFinite(y)) {
      connected = false;
      continue;
    }
    const x = left + ((capacity - visible + index - start) * width) / capacity;
    parts.push(
      `${connected ? "L" : "M"}${number(x)},${number(top + height * y)}`,
    );
    connected = true;
  }
  return {
    path: parts.join(" "),
    cursorFraction: (capacity - 1) / capacity,
    firstSample: start,
    sampleCount: visible,
  };
}

export function conoxviewEegY(raw, amplitude = 120) {
  if (!Number.isFinite(raw)) return NaN;
  const { offset, maximum } =
    CONOXVIEW_EEG_SCALES[amplitude] || CONOXVIEW_EEG_SCALES[120];
  const integer = Math.trunc(
    Math.fround(offset + Math.fround((raw - 31000) / DIVISOR)),
  );
  const value = Math.min(maximum, Math.max(0, integer));
  return (120 - (100 * value) / maximum) / 150;
}

/** A 32 Hz drawing tick adds four samples, then slides a full 2/4/8 s buffer. */
export function createReferenceEegPath({
  samples,
  position = 0,
  windowSeconds = 4,
  amplitude = 120,
  width,
  height,
  left = 0,
  top = 0,
}) {
  if (!samples?.length || !(width > 0) || !(height > 0))
    return { path: "", cursorFraction: 0 };
  const capacity =
    128 * ([2, 4, 8].includes(windowSeconds) ? windowSeconds : 4);
  const count = Math.min(
    samples.length,
    Math.max(0, Math.floor((Number(position) || 0) * 32 + 1e-9) * 4),
  );
  const start = Math.max(0, count - capacity);
  const visible = count - start;
  const number = (value) => Math.round(value * 1000) / 1000;
  const parts = [];
  let connected = false;
  for (let index = start; index < count; index++) {
    const y = conoxviewEegY(samples[index], amplitude);
    if (!Number.isFinite(y)) {
      connected = false;
      continue;
    }
    const x = left + ((index - start) * width) / (capacity - 1);
    parts.push(
      `${connected ? "L" : "M"}${number(x)},${number(top + height * y)}`,
    );
    connected = true;
  }
  return {
    path: parts.join(" "),
    cursorFraction: Math.max(0, visible - 1) / (capacity - 1),
    firstSample: start,
    sampleCount: visible,
  };
}
import { getEegSweep } from "../simulation/eegSweep.js";
