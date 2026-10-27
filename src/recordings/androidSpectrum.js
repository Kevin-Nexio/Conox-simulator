import { conoxviewSpectralRgb } from "./referenceSpectrum.js";

const SAMPLE_COUNT = 128;
const SAMPLES_PER_FRAME = 32;
const FRAME_SECONDS = 0.25;
const BAND_COUNT = 44;
const PUBLISH_SECONDS = 5;
const BACKGROUND = [0, 0, 127, 255];
const HAMMING = Float64Array.from(
  { length: SAMPLE_COUNT },
  (_, index) =>
    0.53836 - 0.46164 * Math.cos((2 * Math.PI * index) / (SAMPLE_COUNT - 1)),
);

function fft(real, imaginary) {
  for (let index = 1, reversed = 0; index < SAMPLE_COUNT; index++) {
    let bit = SAMPLE_COUNT >> 1;
    for (; reversed & bit; bit >>= 1) reversed ^= bit;
    reversed ^= bit;
    if (index < reversed) {
      [real[index], real[reversed]] = [real[reversed], real[index]];
      [imaginary[index], imaginary[reversed]] = [
        imaginary[reversed],
        imaginary[index],
      ];
    }
  }
  for (let size = 2; size <= SAMPLE_COUNT; size *= 2) {
    const angle = (-2 * Math.PI) / size;
    const stepReal = Math.cos(angle);
    const stepImaginary = Math.sin(angle);
    for (let start = 0; start < SAMPLE_COUNT; start += size) {
      let factorReal = 1;
      let factorImaginary = 0;
      for (let index = 0; index < size / 2; index++) {
        const even = start + index;
        const odd = even + size / 2;
        const oddReal =
          real[odd] * factorReal - imaginary[odd] * factorImaginary;
        const oddImaginary =
          real[odd] * factorImaginary + imaginary[odd] * factorReal;
        real[odd] = real[even] - oddReal;
        imaginary[odd] = imaginary[even] - oddImaginary;
        real[even] += oddReal;
        imaginary[even] += oddImaginary;
        const nextReal =
          factorReal * stepReal - factorImaginary * stepImaginary;
        factorImaginary =
          factorReal * stepImaginary + factorImaginary * stepReal;
        factorReal = nextReal;
      }
    }
  }
}

/**
 * Android's 128-point, mean-removed Hamming FFT power for bins 1..44.
 * This is the unnormalized Fourier magnitude squared / 1e6, not a calibrated PSD.
 */
export function calculateAndroidFftPower(samples128) {
  if (
    samples128?.length !== SAMPLE_COUNT ||
    !Array.prototype.every.call(samples128, Number.isFinite)
  )
    throw new RangeError("INVALID_ANDROID_FFT_WINDOW");
  let mean = 0;
  for (const sample of samples128) mean += sample;
  mean /= SAMPLE_COUNT;
  const real = Float64Array.from(
    samples128,
    (sample, index) => (sample - mean) * HAMMING[index],
  );
  const imaginary = new Float64Array(SAMPLE_COUNT);
  fft(real, imaginary);
  return Float64Array.from(
    { length: BAND_COUNT },
    (_, index) => (real[index + 1] ** 2 + imaginary[index + 1] ** 2) / 1e6,
  );
}

function encode(logPower) {
  const value = logPower - 3;
  const encoded =
    value > 27.6
      ? 0.3333 * value + 235.8
      : value > 17.6
        ? 4.5 * value + 120.8
        : 4.953 * value + 112.3;
  return Math.trunc(Math.min(255, Math.max(0, encoded)));
}

/**
 * Stateful window calculator matching FFTCalculationThread (REA ev_90264152...).
 * Each call consumes one complete 128-sample window and returns a copied byte
 * snapshot. The first calculation only seeds the log-power history, leaving
 * the output at byte zero. reset() has the native effect: clear output and mark
 * the next calculation as first, without inventing new log-power values.
 */
export function createAndroidSpectrumCalculator() {
  const logPower = new Float64Array(BAND_COUNT);
  const bytes = new Uint8Array(BAND_COUNT);
  let first = true;
  return {
    calculate(samples128) {
      const power = calculateAndroidFftPower(samples128);
      if (first) {
        for (let bin = 0; bin < BAND_COUNT; bin++)
          logPower[bin] = power[bin] > 0 ? 10 * Math.log10(power[bin]) : 0;
        first = false;
      } else {
        for (let bin = 0; bin < BAND_COUNT; bin++) {
          if (power[bin] > 0)
            logPower[bin] = 0.8 * logPower[bin] + 2 * Math.log10(power[bin]);
          bytes[bin] = encode(logPower[bin]);
        }
      }
      return bytes.slice();
    },
    reset() {
      first = true;
      bytes.fill(0);
    },
    read() {
      return bytes.slice();
    },
  };
}

function normalized(bytes) {
  return Float32Array.from(bytes, (value) => (value - 128) / 128);
}

function validateRecording(recording) {
  const samples = recording?.referenceEeg?.samples;
  const frames = recording?.frames;
  if (
    !(samples instanceof Uint16Array) ||
    !Array.isArray(frames) ||
    samples.length !== frames.length * SAMPLES_PER_FRAME
  )
    throw new RangeError("INVALID_ANDROID_SPECTROGRAM_INPUT");
  let previousEnd = 0;
  for (const frame of frames) {
    if (
      !Number.isFinite(frame.time) ||
      frame.time < previousEnd ||
      !Number.isInteger(frame.counter) ||
      frame.counter < 0 ||
      frame.counter > 0xffffffff ||
      !Number.isInteger(frame.status) ||
      frame.status < 0 ||
      frame.status > 255
    )
      throw new RangeError("INVALID_ANDROID_SPECTROGRAM_INPUT");
    previousEnd = frame.time + FRAME_SECONDS;
  }
  return { samples, frames };
}

/**
 * Reconstruct the Android calculation from the received 128-Hz EEG channel.
 *
 * Deterministic replay phase, not observed native thread timing: on counter%4=0
 * sample the calculator's prior result, before ingesting this frame. This event
 * is available only at frame.time+0.25, then published at the next multiple of
 * five seconds. A file ending before that boundary cannot finalize the batch.
 * Initial zero columns are retained; Android's UI-dependent startup gate is not
 * reproduced. The parser is expected to reject discontinuous recordings.
 */
export function buildAndroidSpectrogram(recording) {
  const { samples, frames } = validateRecording(recording);
  const calculator = createAndroidSpectrumCalculator();
  const window = new Float64Array(SAMPLE_COUNT);
  const columns = [];
  let pending = 0;
  let previousCounter = null;
  for (let index = 0; index < frames.length; index++) {
    const frame = frames[index];
    const prior = calculator.read();
    const continuous =
      previousCounter === null || frame.counter === (previousCounter + 1) >>> 0;
    previousCounter = frame.counter;
    const valid = frame.status === 0 && !frame.spectralArtifact && continuous;
    if (!valid) pending = 0;
    else {
      for (let sample = 0; sample < SAMPLES_PER_FRAME; sample++) {
        const value = samples[index * SAMPLES_PER_FRAME + sample];
        if (value <= 0) {
          pending = 0;
          continue;
        }
        window[pending++] = value;
        if (pending === SAMPLE_COUNT) {
          calculator.calculate(window);
          pending = 0;
        }
      }
    }
    if (frame.counter % 4 !== 0) continue;
    // Native reset affects the FFT output/history gate, not the caller's EEG
    // accumulation buffer. It runs only at the packet-number publication gate.
    if (frame.rawIndices?.qcon === 128) {
      calculator.reset();
      prior.fill(0);
    }
    const endTime = frame.time + FRAME_SECONDS;
    columns.push({
      time: endTime - 0.5,
      endTime,
      values: normalized(prior),
      finalizedAt: Math.ceil(endTime / PUBLISH_SECONDS) * PUBLISH_SECONDS,
      secondary: frame.counter % 8 === 0,
      packetCounter: frame.counter,
      sef50: null,
      sef95: null,
    });
  }
  const endTime = frames.length
    ? frames[frames.length - 1].time + FRAME_SECONDS
    : 0;
  for (const column of columns)
    if (column.finalizedAt > endTime) column.finalizedAt = null;
  return {
    source: "conoxview-android-fft",
    units: "ConoxView Android FFT (dB)",
    valueScale: "conoxview-normalized",
    hasSef: false,
    frequencies: Float32Array.from(
      { length: BAND_COUNT },
      (_, index) => index + 1,
    ),
    columns,
    // These share value buffers with the primary columns. Centre a two-second
    // display cell on its own interval; never select by the array's x parity.
    secondaryColumns: columns
      .filter((column) => column.secondary)
      .map((column) => ({ ...column, time: column.endTime - 1 })),
    hopSeconds: 1,
    timingModel:
      "prior-frame-result; frame-end availability; five-second batches",
  };
}

/** Select the native every-other-second phase for the 60-minute bitmap. */
export function getAndroidSpectrogramView(spectrum, secondary = false) {
  return secondary
    ? { ...spectrum, columns: spectrum.secondaryColumns, hopSeconds: 2 }
    : spectrum;
}

/** Opaque native-blue background, including unavailable batches and NaN bins. */
export function createAndroidDsaPixels(
  spectrum,
  position = Infinity,
  { secondary = false } = {},
) {
  const view = getAndroidSpectrogramView(spectrum, secondary);
  const width = Math.max(1, view.columns.length);
  const height = view.frequencies.length;
  const pixels = new Uint8ClampedArray(width * height * 4);
  const availableAt =
    Number.isFinite(position) || position === Infinity ? position : -Infinity;
  for (let index = 0; index < pixels.length; index += 4)
    pixels.set(BACKGROUND, index);
  view.columns.forEach((column, x) => {
    if (
      column.finalizedAt === null ||
      !Number.isFinite(column.finalizedAt) ||
      column.finalizedAt > availableAt
    )
      return;
    for (let bin = 0; bin < height; bin++) {
      if (!Number.isFinite(column.values[bin])) continue;
      const at = ((height - bin - 1) * width + x) * 4;
      pixels.set(conoxviewSpectralRgb(column.values[bin]), at);
    }
  });
  return pixels;
}
