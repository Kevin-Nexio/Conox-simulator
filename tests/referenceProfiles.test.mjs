import test from "node:test";
import assert from "node:assert/strict";
import { parseCxbin } from "../src/recordings/cxbin.js";
import { sealConoxFrame } from "./fixtures/conoxProtocol.mjs";
import {
  createAndroidEegPath,
  androidEegY,
  ANDROID_EEG_SCALES,
  createReferenceSweepPath,
} from "../src/recordings/referenceEeg.js";
import { decodeAndroidState } from "../src/recordings/androidReference.js";
import { buildAndroidSpectrogram } from "../src/recordings/androidSpectrum.js";
import {
  getReferenceSpectrumView,
  normalizeReferenceSettings,
  referenceDsaPeriodMinutes,
} from "../src/recordings/referenceProfiles.js";
import {
  getRecordingRange,
  formatPlotPosition,
} from "../src/recordings/vectorPlots.js";
import {
  createAndroidSimulationDsa,
  createAndroidSimulationDsaFrame,
} from "../src/simulation/androidDsa.js";

function packets(updates = {}) {
  const bytes = new Uint8Array(12 * 1024);
  const view = new DataView(bytes.buffer);
  for (let frame = 0; frame < 12; frame++) {
    const offset = frame * 1024;
    bytes.set(new TextEncoder().encode("fff"), offset);
    view.setUint32(offset + 13, frame + 1, false);
    bytes.set([45, 22, 3, 100, 11, 14, 15, 100], offset + 18);
    bytes.set(new TextEncoder().encode("R000001"), offset + 883);
    bytes.set([12, 0, Math.floor(frame / 4), 27, 10, 26], offset + 959);
    for (let sample = 0; sample < 32; sample++)
      view.setUint16(offset + 794 + 2 * sample, 31000 + sample, false);
    for (const [at, value] of Object.entries(updates[frame] || {}))
      bytes[offset + Number(at)] = value;
    sealConoxFrame(bytes, offset);
  }
  return bytes;
}

test("the same wire bytes retain distinct Android/iOS index and impedance limits", () => {
  const bytes = packets();
  const original = bytes.slice();
  const ios = parseCxbin(bytes);
  const android = parseCxbin(bytes, { referenceProfile: "android-2.4" });
  assert.equal(ios.frames[0].indices.qnox, 100);
  assert.equal(android.frames[0].indices.qnox, null);
  assert.deepEqual(ios.frames[0].impedances, [null, null, null]);
  assert.deepEqual(android.frames[0].impedances, [11, 14, null]);
  assert.equal(android.frames[0].impedanceStates[2].kind, "tooHigh");
  assert.deepEqual(android.referenceEeg.samples, ios.referenceEeg.samples);
  assert.deepEqual(bytes, original);
});

test("Android sensor overrides, retained unknown text and artifact bytes survive decoding", () => {
  for (const raw of [0, 1, 100])
    assert.equal(decodeAndroidState(raw).kind, "reading");
  assert.equal(decodeAndroidState(133).kind, "sensorEndOfUse");
  assert.equal(decodeAndroidState(128, 180).kind, "sensorExpired");
  assert.equal(decodeAndroidState(0, 124).kind, "sensorEndOfUse");
  const previous = decodeAndroidState(225);
  const unknown = decodeAndroidState(251, 0, previous);
  assert.equal(unknown.kind, "leadOff");
  assert.equal(unknown.raw, 251);
  assert.equal(unknown.retained, true);
  const parsed = parseCxbin(packets({ 0: { 927: 180, 996: 1 } }), {
    referenceProfile: "android-2.4",
  });
  assert.equal(parsed.frames[0].monitorState.kind, "sensorExpired");
  assert.equal(parsed.frames[0].spectralArtifact, true);
  assert.equal(parsed.frames[1].spectralArtifact, false);
});

test("Android trend holds are separate from blank numbers and stop on artifact", () => {
  const parsed = parseCxbin(
    packets({
      0: { 25: 51 },
      1: { 25: 51 },
      2: { 25: 51 },
      7: { 17: 128 },
    }),
    { referenceProfile: "android-2.4" },
  );
  assert.equal(parsed.frames[3].indices.qnox, null);
  assert.equal(parsed.trendFrames[0].time, 1);
  assert.equal(parsed.trendFrames[0].indices.qnox, 51);
  assert.equal(parsed.trendFrames[1].indices.qnox, null);
  assert.equal(parsed.trendFrames[2].indices.qnox, 51);
});

test("Android qCON re-enables SQI before its display and impedances for the next packet", () => {
  const parsed = parseCxbin(
    packets({ 0: { 17: 225 }, 1: { 17: 251 }, 2: { 17: 251 } }),
    { referenceProfile: "android-2.4" },
  );
  assert.equal(parsed.frames[1].indices.sqi, 100);
  assert.deepEqual(parsed.frames[1].impedances, [null, null, null]);
  assert.deepEqual(parsed.frames[2].impedances, [11, 14, null]);
  const invalid = parseCxbin(
    packets({ 0: { 17: 225 }, 1: { 17: 251, 18: 128 } }),
    { referenceProfile: "android-2.4" },
  );
  assert.equal(invalid.frames[1].indices.sqi, null);
});

test("Android voltage presets are symmetric, linear and preserve the 120 preset's actual bounds", () => {
  for (const [amplitude, { minimum, maximum }] of Object.entries(
    ANDROID_EEG_SCALES,
  )) {
    assert.equal(androidEegY(minimum, amplitude), 1);
    assert.equal(androidEegY(maximum, amplitude), 0);
    assert.equal(androidEegY(31000, amplitude), 0.5);
  }
  assert.equal(androidEegY(31000 + 3449, 50), 0);
  assert.equal(androidEegY(31000 - 3449, 50), 1);
  assert.equal(androidEegY(39277, 120), 0);
});

test("Android 3/6/9-second windows fill on the right, slide and exclude future samples", () => {
  const samples = new Uint16Array(2000).fill(31000);
  for (const seconds of [3, 6, 9]) {
    const capacity = seconds * 128;
    const first = createAndroidEegPath({
      samples,
      position: 1 / 128,
      windowSeconds: seconds,
      width: capacity,
      height: 100,
    });
    assert.equal(first.path, `M${capacity - 1},50`);
    const full = createAndroidEegPath({
      samples,
      position: seconds,
      windowSeconds: seconds,
      width: capacity,
      height: 100,
    });
    assert.ok(full.path.startsWith("M0,50 L1,50"));
    assert.ok(full.path.endsWith(`L${capacity - 1},50`));
    assert.equal(full.sampleCount, capacity);
    const shifted = createAndroidEegPath({
      samples,
      position: seconds + 0.25,
      windowSeconds: seconds,
      width: capacity,
      height: 100,
    });
    assert.equal(shifted.firstSample, 32);
    const changed = samples.slice();
    changed.fill(65535, 128);
    const options = {
      position: 1,
      windowSeconds: seconds,
      width: capacity,
      height: 100,
    };
    assert.equal(
      createAndroidEegPath({ ...options, samples }).path,
      createAndroidEegPath({ ...options, samples: changed }).path,
    );
  }
});

test("reference sweeps preserve raw-channel projection and overwrite without exposing future samples", () => {
  for (const profile of ["android-2.4", "ios-1.1"]) {
    const samples = new Uint16Array(12 * 128).fill(31000);
    const options = {
      samples,
      profile,
      windowSeconds: 3,
      width: 384,
      height: 100,
      amplitude: 50,
      position: 3.125,
    };
    const path = createReferenceSweepPath(options);
    assert.equal(path.cursorFraction, 16 / 384);
    assert.equal((path.path.match(/M/g) || []).length, 2);
    assert.ok(
      path.path.startsWith(
        profile === "android-2.4" ? "M0,50 L1,50" : "M0,48.465 L1,48.465",
      ),
    );
    const changed = samples.slice();
    changed.fill(65535, 400);
    assert.equal(
      createReferenceSweepPath({ ...options, samples: changed }).path,
      path.path,
    );
    assert.equal(
      createReferenceSweepPath({ ...options, position: 0 }).path,
      "",
    );
  }
});

test("switching profiles repairs only incompatible scales and preserves other settings", () => {
  const settings = {
    eegWindow: 8,
    amplitude: 50,
    dsaWindow: 21600,
    guides: false,
    colorOffset: -4,
    sef50: true,
  };
  const android = normalizeReferenceSettings(settings, "android-2.4");
  assert.deepEqual(android, { ...settings, eegWindow: 9, dsaWindow: 1800 });
  assert.equal(
    normalizeReferenceSettings({ ...android, amplitude: 250 }, "ios-1.1")
      .amplitude,
    120,
  );
  const spectrum = buildAndroidSpectrogram(
    parseCxbin(packets(), { referenceProfile: "android-2.4" }),
  );
  const hour = getReferenceSpectrumView(spectrum, 3600);
  assert.equal(hour.hopSeconds, 2);
  assert.equal(hour.columns[0].time, 1);
  assert.equal(hour.columns[0].packetCounter % 8, 0);
  assert.equal(getReferenceSpectrumView(spectrum, 1800), spectrum);
});

test("fixed Android DSA periods retain native startup space and normalize the Live return period", () => {
  assert.deepEqual(
    getRecordingRange(
      { durationSeconds: 32, referenceProfile: "android-2.4" },
      10,
      300,
    ),
    { start: 0, end: 300 },
  );
  assert.deepEqual(
    getRecordingRange(
      { durationSeconds: 32, referenceProfile: "android-2.4" },
      10,
      0,
    ),
    { start: 0, end: 32 },
  );
  assert.equal(formatPlotPosition(-290), "−4:50");
  assert.equal(referenceDsaPeriodMinutes(120, "android-2.4"), 30);
  assert.equal(referenceDsaPeriodMinutes(60, "android-2.4"), 60);
  assert.equal(referenceDsaPeriodMinutes(120, "ios-1.1"), 120);
  const recording = { durationSeconds: 400, referenceProfile: "android-2.4" };
  assert.deepEqual(
    getRecordingRange(recording, 302.5, 300, { batchSeconds: 5 }),
    { start: 0, end: 300 },
  );
  assert.deepEqual(
    getRecordingRange(recording, 305, 300, { batchSeconds: 5 }),
    { start: 5, end: 305 },
  );
  assert.deepEqual(getRecordingRange(recording, 302.5, 300), {
    start: 2.5,
    end: 302.5,
  });
});

test("Android logical DSA pixels start on the left and keep distinct one-second cells at 30 minutes", () => {
  const history = {
    snapshot: () => ({
      position: 5,
      columns: [
        { time: 0.5, bytes: new Uint8Array(44).fill(224) },
        { time: 1.5, bytes: new Uint8Array(44).fill(0) },
      ],
    }),
  };
  const rgb = (frame, x) => Array.from(frame.pixels.slice(x * 4, x * 4 + 4));
  const frame = createAndroidSimulationDsaFrame(history, 1800);
  assert.equal(frame.width, 1800);
  assert.equal(frame.height, 44);
  assert.deepEqual(frame.range, { start: 0, end: 1800 });
  assert.deepEqual(rgb(frame, 0), [255, 0, 0, 255]);
  assert.deepEqual(rgb(frame, 1), [0, 0, 127, 255]);
  assert.deepEqual(rgb(frame, 1799), [0, 0, 127, 255]);
  const hour = createAndroidSimulationDsaFrame(history, 3600);
  assert.equal(hour.width, 1800);
  assert.equal(hour.hopSeconds, 2);
  assert.deepEqual(rgb(hour, 0), [0, 0, 127, 255]);
  const later = createAndroidSimulationDsaFrame(
    {
      snapshot: () => ({
        position: 305,
        columns: [
          { time: 4.5, bytes: new Uint8Array(44).fill(224) },
          { time: 5.5, bytes: new Uint8Array(44).fill(128) },
        ],
      }),
    },
    300,
  );
  assert.deepEqual(later.range, { start: 5, end: 305 });
  assert.deepEqual(rgb(later, 0), [127, 255, 127, 255]);
});

test("synthetic Android DSA consumes active EEG and exposes only completed five-second batches", () => {
  const history = createAndroidSimulationDsa();
  const append = (start, count) => {
    for (let index = start; index < start + count; index++)
      history.append(12 * Math.sin((2 * Math.PI * 10 * index) / 128));
  };
  append(0, 4 * 128);
  assert.deepEqual(history.snapshot(), { position: 0, columns: [] });
  append(4 * 128, 128);
  const first = history.snapshot();
  assert.equal(first.position, 5);
  assert.equal(first.columns.length, 5);
  assert.ok(first.columns[0].bytes.every((byte) => byte === 0));
  assert.ok(first.columns[3].bytes[9] > first.columns[3].bytes[23]);
  append(5 * 128, 128);
  assert.deepEqual(history.snapshot(), first);
  history.reset();
  assert.deepEqual(history.snapshot(), { position: 0, columns: [] });
});
