import test from "node:test";
import assert from "node:assert/strict";
import {
  encodeCaseFile,
  decodeCaseFile,
  validateCaseState,
  createDefaultCaseState,
  caseDownloadName,
  caseSourceName,
  CASE_FOOTER_BYTES,
  MAX_CASE_METADATA_BYTES,
} from "../src/recordings/caseFile.js";
import { loadRecordingCase } from "../src/recordings/loadCase.js";

const encoder = new TextEncoder();
function fixture(prefix = 0) {
  const bytes = new Uint8Array((64 + prefix) * 1024);
  const view = new DataView(bytes.buffer);
  for (let frame = 0; frame < 64 + prefix; frame++) {
    const o = frame * 1024;
    bytes.set(encoder.encode("fff0050000540"), o);
    view.setUint32(o + 13, frame + 1, false);
    bytes[o + 17] = 128;
    [18, 19, 20, 21, 25].forEach(
      (offset, i) => (bytes[o + offset] = [40, 200, 0, 100, 20][i]),
    );
    for (let i = 0; i < 256; i++) {
      const sample =
        0x800000 + Math.round(100 * Math.sin((frame * 256 + i) / 16));
      bytes[o + 26 + 3 * i] = sample >>> 16;
      bytes[o + 27 + 3 * i] = sample >>> 8;
      bytes[o + 28 + 3 * i] = sample;
    }
    bytes[o + 800] = frame; // Unknown bytes must survive, too.
    bytes.set(encoder.encode(frame < prefix ? "R999999" : "R000001"), o + 883);
    bytes.set([3, 4, Math.floor(frame / 4), 2, 1, 26], o + 959);
  }
  return bytes;
}
function richState() {
  const state = createDefaultCaseState(16, "de");
  return {
    ...state,
    position: 6.25,
    speed: 2,
    selection: { start: 2, end: 12 },
    layout: "simulator-screen",
    settings: {
      eegWindow: 8,
      amplitude: 50,
      dsaWindow: 60,
      colorOffset: -4,
      guides: false,
      sef50: true,
      sef95: true,
      monitorView: "all",
    },
    timeline: { showIndices: false, hiddenIndices: ["bsr", "sqi"] },
    markers: [
      { id: "event-1", label: "Début · éveil / Übergang", time: 3.25 },
      { id: "event-2", label: "同時 🎯", time: 3.25 },
    ],
    videoFormat: "webm",
  };
}
const encode = async (source = fixture(), state = richState()) =>
  new Uint8Array(
    await (
      await encodeCaseFile(source, state, {
        duration: 16,
        sourceName: "original.cxbin",
      })
    ).arrayBuffer(),
  );
const hasCode = (code) => (error) => error.code === code;

// Build independently signed metadata to exercise the reader beyond writer validation.
async function replaceMetadata(valid, metadataBytes) {
  const footer = valid.slice(-CASE_FOOTER_BYTES);
  const view = new DataView(footer.buffer);
  const sourceLength = view.getUint32(20, true);
  const payload = new Uint8Array(sourceLength + metadataBytes.length);
  payload.set(valid.subarray(0, sourceLength));
  payload.set(metadataBytes, sourceLength);
  view.setUint32(24, metadataBytes.length, true);
  footer.set(
    new Uint8Array(await crypto.subtle.digest("SHA-256", payload)),
    32,
  );
  const result = new Uint8Array(payload.length + footer.length);
  result.set(payload);
  result.set(footer, payload.length);
  return result;
}

test("plain CXBIN import still decodes with no session or altered source bytes", async () => {
  const raw = fixture();
  const decoded = await decodeCaseFile(raw);
  assert.equal(decoded.metadata, null);
  assert.deepEqual(decoded.source, raw);
  const result = await loadRecordingCase(raw, "plain.cxbin");
  assert.equal(result.session, null);
  assert.equal(result.recording.durationSeconds, 16);
  assert.equal(result.sourceByteLength, raw.length);
  assert.equal(result.sourceName, "plain.cxbin");
});

test("the retained Blob snapshot survives worker transfer and excludes an old extension", async () => {
  const saved = await encode();
  const buffer = saved.buffer.slice(0);
  const snapshot = new Blob([buffer]);
  const transferred = structuredClone(buffer, { transfer: [buffer] });
  assert.equal(buffer.byteLength, 0);
  const loaded = await loadRecordingCase(transferred, "saved.cxbin");
  const retained = new Uint8Array(
    await snapshot.slice(0, loaded.sourceByteLength).arrayBuffer(),
  );
  assert.deepEqual(retained, fixture());
});

test("complete session round-trips while every original byte and decoded EEG value survives", async () => {
  const raw = fixture(3);
  const original = raw.slice();
  const saved = await encode(raw);
  assert.deepEqual(saved.subarray(0, raw.length), original);
  assert.deepEqual(raw, original);
  const decoded = await decodeCaseFile(saved);
  assert.deepEqual(decoded.source, original);
  const plain = await loadRecordingCase(raw, "original.cxbin");
  const restored = await loadRecordingCase(saved, "original-simulateur.cxbin");
  assert.deepEqual(restored.session, richState());
  assert.equal(restored.sourceByteLength, raw.length);
  assert.equal(restored.sourceName, "original.cxbin");
  assert.equal(restored.recording.excludedFrameCount, 3);
  assert.deepEqual(restored.recording.samples, plain.recording.samples);
  assert.deepEqual(restored.recording.frames, plain.recording.frames);
  assert.deepEqual(restored.filtered, plain.filtered);
  assert.deepEqual(restored.spectrum, plain.spectrum);
});

test("resaving replaces the previous extension rather than stacking trailers", async () => {
  const first = await encode();
  const { source, metadata } = await decodeCaseFile(first);
  const nextState = {
    ...metadata.state,
    markers: [
      ...metadata.state.markers,
      { id: "event-3", label: "Fin", time: 16 },
    ],
  };
  const resaved = await encode(source, nextState);
  const direct = await encode(fixture(), nextState);
  assert.deepEqual(resaved, direct);
  assert.equal(
    (await loadRecordingCase(resaved, "copy.cxbin")).session.markers.length,
    3,
  );
});

test("typed-array offsets do not accidentally include padding or private neighbouring bytes", async () => {
  const raw = fixture();
  const padded = new Uint8Array(raw.length + 40).fill(77);
  padded.set(raw, 17);
  const encoded = await encode(padded.subarray(17, 17 + raw.length));
  const wrapped = new Uint8Array(encoded.length + 50).fill(99);
  wrapped.set(encoded, 21);
  assert.deepEqual(
    (await decodeCaseFile(wrapped.subarray(21, 21 + encoded.length))).source,
    raw,
  );
});

test("source or metadata corruption fails the combined integrity check", async () => {
  const valid = await encode();
  for (const offset of [800, fixture().length + 20]) {
    const changed = valid.slice();
    changed[offset] ^= 1;
    await assert.rejects(
      () => decodeCaseFile(changed),
      hasCode("CASE_INTEGRITY_FAILED"),
    );
  }
});

test("malformed lengths, footer flags, unknown versions and broken footer are rejected", async () => {
  const valid = await encode();
  for (const [offset, value, code] of [
    [16, 2, "CASE_VERSION_UNSUPPORTED"],
    [20, 0xffffffff, "CASE_DATA_INVALID"],
    [24, MAX_CASE_METADATA_BYTES + 1, "CASE_DATA_INVALID"],
    [28, 1, "CASE_DATA_INVALID"],
  ]) {
    const changed = valid.slice();
    new DataView(changed.buffer).setUint32(
      changed.length - CASE_FOOTER_BYTES + offset,
      value,
      true,
    );
    await assert.rejects(() => decodeCaseFile(changed), hasCode(code));
  }
  const broken = valid.slice();
  broken[broken.length - 1] ^= 1;
  await assert.rejects(
    () => decodeCaseFile(broken),
    hasCode("CASE_DATA_INVALID"),
  );
  await assert.rejects(() =>
    loadRecordingCase(valid.subarray(0, valid.length - 9), "truncated.cxbin"),
  );
});

test("invalid UTF-8, invalid JSON and unsupported metadata versions do not become raw CXBIN", async () => {
  const valid = await encode();
  for (const data of [
    new Uint8Array([255, 254]),
    encoder.encode("{"),
    encoder.encode("null"),
  ]) {
    const changed = await replaceMetadata(valid, data);
    await assert.rejects(
      () => decodeCaseFile(changed),
      hasCode("CASE_DATA_INVALID"),
    );
  }
  const { metadata } = await decodeCaseFile(valid);
  const future = await replaceMetadata(
    valid,
    encoder.encode(JSON.stringify({ ...metadata, version: 2 })),
  );
  await assert.rejects(
    () => decodeCaseFile(future),
    hasCode("CASE_VERSION_UNSUPPORTED"),
  );
});

test("re-import validates session values against the actual recording, not metadata duration", async () => {
  const valid = await encode();
  const { metadata } = await decodeCaseFile(valid);
  const changed = await replaceMetadata(
    valid,
    encoder.encode(
      JSON.stringify({
        ...metadata,
        state: { ...metadata.state, position: 1000, duration: 2000 },
      }),
    ),
  );
  await assert.rejects(
    () => loadRecordingCase(changed, "wrong.cxbin"),
    hasCode("CASE_STATE_INVALID"),
  );
});

test("invalid UI settings, duplicate marker IDs and unusable ranges cannot be restored", () => {
  const state = richState();
  const invalid = [
    { position: NaN },
    { position: 16.01 },
    { speed: 0 },
    { layout: "conox-frame" },
    { settings: { ...state.settings, guides: "false" } },
    { settings: { ...state.settings, amplitude: -50 } },
    { selection: { start: 5, end: 4 } },
    { selection: { start: 5, end: 5.1 } },
    { timeline: { showIndices: true, hiddenIndices: ["unknown"] } },
    { timeline: { showIndices: true, hiddenIndices: ["bsr", "bsr"] } },
    { markers: [...state.markers, state.markers[0]] },
    { markers: [{ id: "x", label: "bad", time: 17 }] },
    { markers: [{ id: "x".repeat(129), label: "bad", time: 1 }] },
  ];
  for (const patch of invalid)
    assert.throws(
      () => validateCaseState({ ...state, ...patch }, 16),
      hasCode("CASE_STATE_INVALID"),
    );
  assert.deepEqual(
    validateCaseState(createDefaultCaseState(0.1), 0.1).selection,
    { start: 0, end: 0.1 },
  );
});

test("unknown JSON keys do not flow into state or pollute prototypes", () => {
  const state = JSON.parse(
    JSON.stringify(richState()).slice(0, -1) +
      ',"__proto__":{"polluted":true},"unknown":123}',
  );
  const clean = validateCaseState(state, 16);
  assert.equal(Object.hasOwn(clean, "__proto__"), false);
  assert.equal(Object.hasOwn(clean, "unknown"), false);
  assert.equal({}.polluted, undefined);
});

test("download names are safe and preserve the original base name across saves", () => {
  assert.equal(caseSourceName("../../original.cxbin"), "original.cxbin");
  assert.equal(caseSourceName("C:\\private\\original.cxbin"), "original.cxbin");
  assert.equal(caseDownloadName("original.cxbin"), "original-simulateur.cxbin");
  assert.equal(caseDownloadName(""), "CONOX-simulateur.cxbin");
});
