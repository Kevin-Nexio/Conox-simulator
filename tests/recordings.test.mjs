import test from "node:test";
import assert from "node:assert/strict";

import { CxbinParseError, parseCxbin } from "../src/recordings/cxbin.js";
import {
  buildSpectrogram,
  getFilteredEeg,
  powerSpectrum,
} from "../src/recordings/spectrum.js";

const SAMPLE_RATE = 1024;
const BASE_TIME = Date.UTC(2026, 0, 2, 3, 4, 5);

// Synthetic protocol frames only. No patient recording is kept in test fixtures.
function frame({
  counter = 1,
  caseId = "R000001",
  time = BASE_TIME,
  indices = { qcon: 40, qnox: 30, bsr: 0, sqi: 100, emg: 45 },
  rawSamples = [0x800000],
  status = 0,
} = {}) {
  const bytes = new Uint8Array(1024);
  const view = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode("fff0050000540"));
  view.setUint32(13, counter, false);
  bytes[17] = status;
  for (const [key, offset] of Object.entries({
    qcon: 18,
    qnox: 19,
    bsr: 20,
    sqi: 21,
    emg: 25,
  })) {
    bytes[offset] = indices[key];
  }
  for (let i = 0; i < 256; i++) {
    const raw = rawSamples[i % rawSamples.length];
    bytes[26 + 3 * i] = (raw >>> 16) & 0xff;
    bytes[27 + 3 * i] = (raw >>> 8) & 0xff;
    bytes[28 + 3 * i] = raw & 0xff;
  }
  bytes.set(new TextEncoder().encode(caseId), 883);
  const clock = new Date(time);
  bytes.set(
    [
      clock.getUTCHours(),
      clock.getUTCMinutes(),
      clock.getUTCSeconds(),
      clock.getUTCDate(),
      clock.getUTCMonth() + 1,
      clock.getUTCFullYear() - 2000,
    ],
    959,
  );
  return bytes;
}

function joinFrames(...frames) {
  const bytes = new Uint8Array(frames.length * 1024);
  frames.forEach((value, index) => bytes.set(value, index * 1024));
  return bytes;
}

function hasCode(code) {
  return (error) => error instanceof CxbinParseError && error.code === code;
}

function sine(length, hz, amplitude = 1) {
  return Float32Array.from(
    { length },
    (_, i) => amplitude * Math.sin((2 * Math.PI * hz * i) / SAMPLE_RATE),
  );
}

function peakFrequency(spectrum) {
  let peak = 0;
  for (let i = 1; i < spectrum.power.length; i++) {
    if (spectrum.power[i] > spectrum.power[peak]) peak = i;
  }
  return spectrum.frequencies[peak];
}

test("decode offset-binary boundaries without losing buffer-view offsets", () => {
  const source = frame({
    rawSamples: [0, 0x7fffff, 0x800000, 0x800001, 0xffffff],
    status: 128,
  });
  const padded = new Uint8Array(1044);
  padded.set(source, 10);
  const result = parseCxbin(padded.subarray(10, 1034), {
    fileName: "demo.cxbin",
  });
  assert.equal(result.id, "R000001");
  assert.equal(result.fileName, "demo.cxbin");
  assert.equal(result.sampleRate, 1024);
  assert.equal(result.durationSeconds, 0.25);
  assert.equal(result.samples.length, 256);
  assert.equal(result.samples[2], 0);
  assert.ok(Math.abs(result.samples[0] - -0x800000 * 0.04458) < 0.02);
  assert.ok(Math.abs(result.samples[1] + 0.04458) < 1e-8);
  assert.ok(Math.abs(result.samples[3] - 0.04458) < 1e-8);
  assert.ok(Math.abs(result.samples[4] - 0x7fffff * 0.04458) < 0.02);
  assert.equal(result.frames[0].status, 128);
  assert.equal(result.experimental, true);
  assert.equal(result.calibration.verified, false);
  assert.equal(result.indicesVerified, false);
  assert.equal(result.startedAt, "2026-01-02T03:04:05");
  assert.equal(result.clockTimezone, null);
});

test("exclude a previous-case prefix and keep the dominant case contiguous", () => {
  const result = parseCxbin(
    joinFrames(
      frame({ counter: 4, caseId: "R000000" }),
      frame({ counter: 5, time: BASE_TIME + 1000 }),
      frame({ counter: 6, time: BASE_TIME + 1000 }),
      frame({ counter: 7, time: BASE_TIME + 1000 }),
    ),
  );
  assert.equal(result.sourceFrameCount, 4);
  assert.equal(result.excludedFrameCount, 1);
  assert.equal(result.frames.length, 3);
  assert.equal(result.frames[0].counter, 5);
  assert.equal(result.frames[0].time, 0);
  assert.equal(result.frames[2].time, 0.5);
  assert.equal(result.durationSeconds, 0.75);
  assert.equal(result.startedAt, "2026-01-02T03:04:06");
  assert.deepEqual(
    result.warnings.find(
      (warning) => warning.code === "previousCaseFramesExcluded",
    ),
    { code: "previousCaseFramesExcluded", count: 1 },
  );
});

test("do not display unsupported index values and preserve the original bytes", () => {
  const result = parseCxbin(
    frame({ indices: { qcon: 99, qnox: 100, bsr: 100, sqi: 101, emg: 128 } }),
  );
  assert.deepEqual(result.frames[0].indices, {
    qcon: 99,
    qnox: null,
    bsr: 100,
    sqi: null,
    emg: null,
  });
  assert.deepEqual(result.frames[0].rawIndices, {
    qcon: 99,
    qnox: 100,
    bsr: 100,
    sqi: 101,
    emg: 128,
  });
  assert.deepEqual(
    result.warnings.find((warning) => warning.code === "invalidIndices"),
    { code: "invalidIndices", count: 3 },
  );
});

test("device-clock jumps warn without stretching the sample timeline", () => {
  const result = parseCxbin(
    joinFrames(
      frame(),
      frame({ counter: 2 }),
      frame({ counter: 3, time: BASE_TIME + 2000 }),
      frame({ counter: 4, time: BASE_TIME + 2000 }),
    ),
  );
  assert.equal(result.durationSeconds, 1);
  assert.deepEqual(
    result.frames.map((value) => value.time),
    [0, 0.25, 0.5, 0.75],
  );
  assert.ok(
    result.warnings.some((warning) => warning.code === "clockDiscontinuity"),
  );
});

test("the normal second-resolution device clock needs no jump warning", () => {
  const bytes = joinFrames(
    ...Array.from({ length: 12 }, (_, i) =>
      frame({ counter: i + 1, time: BASE_TIME + Math.floor(i / 4) * 1000 }),
    ),
  );
  assert.ok(
    !parseCxbin(bytes).warnings.some(
      (warning) => warning.code === "clockDiscontinuity",
    ),
  );
});

test("reject incomplete, unsupported, and damaged frames", () => {
  assert.throws(() => parseCxbin(new ArrayBuffer(0)), hasCode("EMPTY_FILE"));
  assert.throws(
    () => parseCxbin(frame().subarray(0, 1023)),
    hasCode("TRUNCATED_FILE"),
  );
  assert.throws(
    () => parseCxbin(new Uint8Array(1024)),
    hasCode("UNSUPPORTED_FORMAT"),
  );
  const damaged = joinFrames(frame(), frame({ counter: 2 }));
  damaged[1024 + 4] = 0;
  assert.throws(() => parseCxbin(damaged), hasCode("CORRUPT_FRAME"));
  const wrongCase = frame();
  wrongCase[883] = 0;
  assert.throws(() => parseCxbin(wrongCase), hasCode("INVALID_CASE_ID"));
  const wrongDate = frame();
  wrongDate[962] = 30;
  wrongDate[963] = 2;
  assert.throws(() => parseCxbin(wrongDate), hasCode("INVALID_TIMESTAMP"));
});

test("reject missing, duplicated, and reordered counters; allow uint32 wrap", () => {
  for (const second of [1, 0, 3]) {
    assert.throws(
      () => parseCxbin(joinFrames(frame(), frame({ counter: second }))),
      hasCode("COUNTER_GAP"),
    );
  }
  const wrapped = parseCxbin(
    joinFrames(frame({ counter: 0xffffffff }), frame({ counter: 0 })),
  );
  assert.equal(wrapped.frames.length, 2);
});

test("reject ambiguous recordings or a case switch within retained data", () => {
  assert.throws(
    () =>
      parseCxbin(joinFrames(frame(), frame({ counter: 2, caseId: "R000002" }))),
    hasCode("AMBIGUOUS_CASE"),
  );
  assert.throws(
    () =>
      parseCxbin(
        joinFrames(
          frame(),
          frame({ counter: 2, caseId: "R000002" }),
          frame({ counter: 3 }),
        ),
      ),
    hasCode("MIXED_CASES"),
  );
});

test("reject a substantial previous-case prefix instead of selecting by majority", () => {
  assert.throws(
    () =>
      parseCxbin(
        joinFrames(
          ...Array.from({ length: 11 }, (_, i) =>
            frame({ counter: i + 1, caseId: i < 5 ? "R000000" : "R000001" }),
          ),
        ),
      ),
    hasCode("MIXED_CASES"),
  );
  const boundary = parseCxbin(
    joinFrames(
      ...Array.from({ length: 9 }, (_, i) =>
        frame({ counter: i + 1, caseId: i < 4 ? "R000000" : "R000001" }),
      ),
    ),
  );
  assert.equal(boundary.excludedFrameCount, 4);
  assert.equal(boundary.frames.length, 5);
});

test("reject multiple previous cases even within a short prefix", () => {
  assert.throws(
    () =>
      parseCxbin(
        joinFrames(
          frame({ caseId: "R000000" }),
          frame({ counter: 2, caseId: "R000002" }),
          frame({ counter: 3 }),
          frame({ counter: 4 }),
          frame({ counter: 5 }),
        ),
      ),
    hasCode("MIXED_CASES"),
  );
});

test("Hann PSD locates a known tone and integrates to its mean-square power", () => {
  const spectrum = powerSpectrum(sine(2048, 10, 10));
  assert.equal(peakFrequency(spectrum), 10);
  const integratedPower =
    spectrum.power.reduce((total, value) => total + value, 0) *
    spectrum.binWidth;
  assert.ok(Math.abs(integratedPower - 50) < 0.001);
  const peak = spectrum.frequencies.indexOf(10);
  assert.ok(
    Math.abs(spectrum.db[peak] - 10 * Math.log10(spectrum.power[peak])) < 1e-5,
  );
});

test("zero-padding preserves the integrated PSD power", () => {
  const input = sine(1024, 10, 4);
  const normal = powerSpectrum(input);
  const padded = powerSpectrum(input, SAMPLE_RATE, 2048);
  const integrate = (value) =>
    value.power.reduce((total, power) => total + power, 0) * value.binWidth;
  assert.equal(peakFrequency(padded), 10);
  assert.ok(Math.abs(integrate(normal) - 8) < 0.001);
  assert.ok(Math.abs(integrate(normal) - integrate(padded)) < 1e-10);
});

test("filter removes DC and attenuates frequencies outside 0.5..45 Hz", () => {
  const constant = new Float32Array(4096).fill(500);
  const dc = getFilteredEeg({ samples: constant, sampleRate: SAMPLE_RATE });
  assert.ok(dc.every((value) => Math.abs(value) < 1e-7));
  const samples = Float32Array.from(
    { length: 30 * SAMPLE_RATE },
    (_, i) =>
      500 +
      10 * Math.sin((2 * Math.PI * 0.125 * i) / SAMPLE_RATE) +
      10 * Math.sin((2 * Math.PI * 10 * i) / SAMPLE_RATE) +
      10 * Math.sin((2 * Math.PI * 128 * i) / SAMPLE_RATE),
  );
  const filtered = getFilteredEeg({ samples, sampleRate: SAMPLE_RATE });
  assert.equal(filtered.length, samples.length);
  const spectrum = powerSpectrum(filtered.slice(-8192));
  const at = (hz) => spectrum.power[Math.round(hz / spectrum.binWidth)];
  assert.equal(peakFrequency(spectrum), 10);
  assert.ok(at(0.125) / at(10) < 0.01);
  assert.ok(at(128) / at(10) < 0.02);
});

test("spectrogram has real FFT frequencies, fixed hops, and measured spectral edges", () => {
  const samples = sine(4 * SAMPLE_RATE, 10, 10);
  const result = buildSpectrogram(
    { samples, sampleRate: SAMPLE_RATE },
    samples,
  );
  assert.deepEqual(
    result.columns.map((column) => column.time),
    [1, 2, 3],
  );
  assert.equal(result.frequencies.length, 91);
  assert.equal(result.frequencies[0], 0);
  assert.equal(result.frequencies[90], 45);
  assert.equal(result.frequencies[1], 0.5);
  assert.equal(result.minDb, -30);
  assert.equal(result.maxDb, 50);
  for (const column of result.columns) {
    const maximum = Math.max(...column.db);
    assert.equal(result.frequencies[column.db.indexOf(maximum)], 10);
    assert.equal(column.sef50, 10);
    assert.ok(column.sef95 >= 10 && column.sef95 <= 10.5);
  }
});

test("short or silent cases produce finite spectral data without invented SEF", () => {
  const samples = new Float32Array(256);
  const result = buildSpectrogram({ samples, sampleRate: SAMPLE_RATE });
  assert.equal(result.columns.length, 1);
  assert.equal(result.columns[0].time, 0.125);
  assert.ok(result.columns[0].db.every((value) => value === -120));
  assert.equal(result.columns[0].sef50, null);
  assert.equal(result.columns[0].sef95, null);
});

test("reject invalid spectrum and filtered-signal sizes", () => {
  assert.throws(() => powerSpectrum(new Float32Array(0)), RangeError);
  assert.throws(() => powerSpectrum(sine(10, 1), SAMPLE_RATE, 9), RangeError);
  assert.throws(() => powerSpectrum(sine(10, 1), SAMPLE_RATE, 8), RangeError);
  const recording = { samples: sine(2048, 10), sampleRate: SAMPLE_RATE };
  assert.throws(
    () => buildSpectrogram(recording, new Float32Array(1024)),
    RangeError,
  );
});
