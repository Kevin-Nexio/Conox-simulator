import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAndroidSpectrogram,
  calculateAndroidFftPower,
  createAndroidDsaPixels,
  createAndroidSpectrumCalculator,
  getAndroidSpectrogramView,
} from "../src/recordings/androidSpectrum.js";
import { conoxviewSpectralRgb } from "../src/recordings/referenceSpectrum.js";

test("native zero-power initialization becomes cyan on the second constant window, not a physical power floor", () => {
  const calculator = createAndroidSpectrumCalculator();
  const constant = new Uint16Array(128).fill(31000);
  assert.ok(calculator.calculate(constant).every((value) => value === 0));
  const second = calculator.calculate(constant);
  assert.ok(second.every((value) => value === 97));
  assert.deepEqual(conoxviewSpectralRgb((97 - 128) / 128), [3, 255, 251]);
});

function signal(frequency, amplitude = 900, count = 128, offset = 0) {
  return Uint16Array.from({ length: count }, (_, index) =>
    Math.round(
      31000 +
        amplitude *
          Math.sin((2 * Math.PI * frequency * (index + offset)) / 128),
    ),
  );
}

// Independent O(N²) direct DFT oracle, without the production FFT or its layout.
function directPower(samples) {
  const mean = samples.reduce((sum, value) => sum + value, 0) / 128;
  return Float64Array.from({ length: 44 }, (_, band) => {
    const frequency = band + 1;
    let cosine = 0;
    let sine = 0;
    for (let sample = 0; sample < 128; sample++) {
      const weighted =
        (samples[sample] - mean) *
        (0.53836 - 0.46164 * Math.cos((2 * Math.PI * sample) / 127));
      const phase = (2 * Math.PI * frequency * sample) / 128;
      cosine += weighted * Math.cos(phase);
      sine += weighted * Math.sin(phase);
    }
    return (cosine * cosine + sine * sine) / 1000000;
  });
}

function oracleEncoding(logPower) {
  const corrected = logPower - 3;
  let encoded = 4.953 * corrected + 112.3;
  if (corrected > 17.6) encoded = 4.5 * corrected + 120.8;
  if (corrected > 27.6) encoded = 0.3333 * corrected + 235.8;
  return Math.max(0, Math.min(255, Math.floor(encoded)));
}

function oracleSmoothed(first, second) {
  const previous = directPower(first);
  const current = directPower(second);
  return Uint8Array.from(previous, (power, bin) => {
    const initial = power > 0 ? 10 * Math.log10(power) : 0;
    const value =
      current[bin] > 0
        ? 0.8 * initial + 0.2 * 10 * Math.log10(current[bin])
        : initial;
    return oracleEncoding(value);
  });
}

function recording(seconds, { counter = 1, frequency = 10 } = {}) {
  const frameCount = Math.round(seconds * 4);
  return {
    frames: Array.from({ length: frameCount }, (_, index) => ({
      time: index / 4,
      counter: (counter + index) >>> 0,
      status: 0,
      spectralArtifact: false,
      rawIndices: { qcon: 45 },
    })),
    referenceEeg: { samples: signal(frequency, 900, frameCount * 32) },
  };
}

const allZero = (bytes) => bytes.every((value) => value === 0);
const zeroColumn = (column) => column.values.every((value) => value === -1);
const rgbAt = (pixels, width, column, bin, height = 44) => {
  const index = ((height - bin - 1) * width + column) * 4;
  return Array.from(pixels.subarray(index, index + 4));
};

test("128-point FFT power agrees with a direct DFT for 10-Hz and 24-Hz inputs", () => {
  for (const frequency of [10, 24]) {
    const samples = signal(frequency);
    const actual = calculateAndroidFftPower(samples);
    const expected = directPower(samples);
    for (let bin = 0; bin < 44; bin++)
      assert.ok(
        Math.abs(actual[bin] - expected[bin]) <=
          1e-9 * Math.max(1, expected[bin]),
        `Power differs at ${bin + 1} Hz for the ${frequency}-Hz signal`,
      );
    assert.equal(actual.indexOf(Math.max(...actual)) + 1, frequency);
  }
});

test("first calculation seeds history; the second matches the DFT log-power oracle", () => {
  const first = signal(10, 900);
  const second = signal(24, 650);
  const calculator = createAndroidSpectrumCalculator();
  const initial = calculator.calculate(first);
  assert.ok(allZero(initial));
  assert.deepEqual(calculator.calculate(second), oracleSmoothed(first, second));
  assert.ok(allZero(initial), "a published byte snapshot must never mutate");
  const snapshot = calculator.read();
  snapshot.fill(0);
  assert.ok(
    !allZero(calculator.read()),
    "read() must return a detached snapshot",
  );
});

test("zero-power windows hold history, and reset restores the native first-window gate", () => {
  const samples = signal(10);
  const calculator = createAndroidSpectrumCalculator();
  calculator.calculate(samples);
  const steady = calculator.calculate(samples);
  assert.deepEqual(
    calculator.calculate(new Uint16Array(128).fill(31000)),
    steady,
  );
  calculator.reset();
  assert.ok(allZero(calculator.read()));
  assert.ok(allZero(calculator.calculate(samples)));
  assert.deepEqual(calculator.calculate(samples), steady);
});

test("a zero-power first window seeds zero log power instead of a PSD floor", () => {
  const calculator = createAndroidSpectrumCalculator();
  const constant = new Uint16Array(128).fill(31000);
  const samples = signal(24);
  assert.ok(allZero(calculator.calculate(constant)));
  assert.deepEqual(
    calculator.calculate(samples),
    oracleSmoothed(constant, samples),
  );
});

test("replay samples the prior result before the boundary frame's FFT completes", () => {
  const input = recording(6);
  const spectrum = buildAndroidSpectrogram(input);
  assert.equal(spectrum.source, "conoxview-android-fft");
  assert.equal(spectrum.valueScale, "conoxview-normalized");
  assert.equal(spectrum.hopSeconds, 1);
  assert.deepEqual(
    Array.from(spectrum.frequencies),
    Array.from({ length: 44 }, (_, i) => i + 1),
  );
  assert.ok(zeroColumn(spectrum.columns[0]));
  assert.ok(zeroColumn(spectrum.columns[1]));
  assert.ok(!zeroColumn(spectrum.columns[2]));
  assert.equal(spectrum.columns[0].time, 0.5);
  assert.equal(spectrum.columns[0].endTime, 1);
  assert.ok(
    spectrum.columns.every(
      (column) => column.sef50 === null && column.sef95 === null,
    ),
  );

  // Replacing the last quarter-second cannot change that same second's prior
  // result. It can affect the next sampled output, whose availability is later.
  input.referenceEeg.samples.set(signal(24, 900, 32, 19 * 32), 19 * 32);
  const changed = buildAndroidSpectrogram(input);
  assert.deepEqual(changed.columns[4].values, spectrum.columns[4].values);
  assert.notDeepEqual(changed.columns[5].values, spectrum.columns[5].values);
});

test("frame-end availability delays a frame starting at 5 s to the 10-s batch", () => {
  const spectrum = buildAndroidSpectrogram(recording(10, { counter: 0 }));
  const afterBoundary = spectrum.columns.find(
    (column) => column.endTime === 5.25,
  );
  assert.equal(afterBoundary.time, 4.75);
  assert.equal(afterBoundary.finalizedAt, 10);
  for (const column of spectrum.columns)
    if (column.finalizedAt !== null)
      assert.ok(column.finalizedAt >= column.endTime);
  const index = spectrum.columns.indexOf(afterBoundary);
  const before = createAndroidDsaPixels(spectrum, 5);
  assert.deepEqual(
    rgbAt(before, spectrum.columns.length, index, 9),
    [0, 0, 127, 255],
  );
  const after = createAndroidDsaPixels(spectrum, 10);
  assert.notDeepEqual(
    rgbAt(after, spectrum.columns.length, index, 9),
    [0, 0, 127, 255],
  );
});

test("future samples cannot recolor finalized batches; an EOF partial batch stays hidden", () => {
  const prefix = buildAndroidSpectrogram(recording(5));
  const fullInput = recording(11.25);
  fullInput.referenceEeg.samples.set(
    signal(24, 900, 6.25 * 128, 5 * 128),
    5 * 128,
  );
  const full = buildAndroidSpectrogram(fullInput);
  assert.deepEqual(full.columns.slice(0, 5), prefix.columns);
  assert.ok(
    full.columns.slice(0, 5).every((column) => column.finalizedAt === 5),
  );
  assert.equal(full.columns.at(-1).finalizedAt, null);
  const pixels = createAndroidDsaPixels(full, Infinity);
  assert.deepEqual(
    rgbAt(pixels, full.columns.length, full.columns.length - 1, 23),
    [0, 0, 127, 255],
  );
  const short = buildAndroidSpectrogram(recording(4.75));
  assert.ok(short.columns.every((column) => column.finalizedAt === null));
  const hidden = createAndroidDsaPixels(short, Infinity);
  for (let index = 0; index < hidden.length; index += 4)
    assert.deepEqual(
      Array.from(hidden.subarray(index, index + 4)),
      [0, 0, 127, 255],
    );
});

test("invalid status, spectral artifacts and zero samples discard accumulation and hold the old FFT", () => {
  for (const invalid of ["status", "artifact", "zero"]) {
    const input = recording(10);
    input.referenceEeg.samples.set(signal(24, 900, 6 * 128, 4 * 128), 4 * 128);
    if (invalid === "status") input.frames[16].status = 225;
    if (invalid === "artifact") input.frames[16].spectralArtifact = true;
    if (invalid === "zero") input.referenceEeg.samples[16 * 32] = 0;
    const spectrum = buildAndroidSpectrogram(input);
    assert.deepEqual(
      spectrum.columns[4].values,
      spectrum.columns[3].values,
      invalid,
    );
    assert.notDeepEqual(
      spectrum.columns[5].values,
      spectrum.columns[4].values,
      invalid,
    );
  }
});

test("qCON 128 at the packet gate clears output and reseeds before encoding again", () => {
  const input = recording(10);
  input.frames[19].rawIndices.qcon = 128;
  const spectrum = buildAndroidSpectrogram(input);
  assert.ok(!zeroColumn(spectrum.columns[3]));
  for (const index of [4, 5, 6]) assert.ok(zeroColumn(spectrum.columns[index]));
  assert.ok(!zeroColumn(spectrum.columns[7]));
});

test("the 60-minute phase follows counter modulo eight, including uint32 wrap", () => {
  const spectrum = buildAndroidSpectrogram(
    recording(10, { counter: 0xfffffffc }),
  );
  assert.equal(spectrum.columns[0].secondary, false);
  assert.equal(spectrum.columns[1].packetCounter, 0);
  assert.equal(spectrum.columns[1].secondary, true);
  assert.deepEqual(
    spectrum.secondaryColumns.map((column) => column.packetCounter),
    spectrum.columns
      .filter((column) => column.packetCounter % 8 === 0)
      .map((column) => column.packetCounter),
  );
  assert.equal(spectrum.secondaryColumns[0].values, spectrum.columns[1].values);
  assert.equal(
    spectrum.secondaryColumns[0].time,
    spectrum.columns[1].endTime - 1,
  );
  const view = getAndroidSpectrogramView(spectrum, true);
  assert.equal(view.hopSeconds, 2);
  assert.equal(view.columns, spectrum.secondaryColumns);
  assert.equal(
    createAndroidDsaPixels(spectrum, 10, { secondary: true }).length,
    Math.max(1, view.columns.length) * 44 * 4,
  );
});

test("native jet pixels are opaque and future, missing and byte-zero bands use dark blue", () => {
  const values = new Float32Array(44).fill(NaN);
  values[0] = -1; // byte 0
  values[1] = 0; // byte 128
  values[43] = 127 / 128; // byte 255
  const spectrum = {
    frequencies: Float32Array.from({ length: 44 }, (_, index) => index + 1),
    columns: [
      { values, finalizedAt: 5 },
      { values, finalizedAt: null },
      { values, finalizedAt: 10 },
    ],
  };
  const pixels = createAndroidDsaPixels(spectrum, 5);
  assert.deepEqual(rgbAt(pixels, 3, 0, 0), [0, 0, 127, 255]);
  assert.deepEqual(rgbAt(pixels, 3, 0, 1), [127, 255, 127, 255]);
  assert.deepEqual(rgbAt(pixels, 3, 0, 2), [0, 0, 127, 255]);
  assert.deepEqual(rgbAt(pixels, 3, 0, 43), [131, 0, 0, 255]);
  assert.deepEqual(rgbAt(pixels, 3, 1, 43), [0, 0, 127, 255]);
  assert.deepEqual(rgbAt(pixels, 3, 2, 43), [0, 0, 127, 255]);
  assert.deepEqual(
    rgbAt(createAndroidDsaPixels(spectrum, NaN), 3, 0, 43),
    [0, 0, 127, 255],
  );
});

test("malformed recording geometry and nonfinite calculation inputs are rejected", () => {
  const input = recording(1);
  input.referenceEeg.samples = input.referenceEeg.samples.subarray(1);
  assert.throws(
    () => buildAndroidSpectrogram(input),
    /INVALID_ANDROID_SPECTROGRAM_INPUT/,
  );
  const invalid = new Float64Array(128);
  invalid[45] = NaN;
  assert.throws(
    () => calculateAndroidFftPower(invalid),
    /INVALID_ANDROID_FFT_WINDOW/,
  );
  assert.throws(
    () => calculateAndroidFftPower([1, 2]),
    /INVALID_ANDROID_FFT_WINDOW/,
  );
});
