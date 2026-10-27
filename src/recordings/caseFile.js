import { clampTimelinePosition } from "./timeline.js";
import { normalizeEventMarker } from "./eventMarkers.js";
import {
  LEGACY_REFERENCE_PROFILE,
  REFERENCE_PROFILES,
  getReferenceProfile,
} from "./referenceProfiles.js";

export const MAX_SOURCE_BYTES = 64 * 1024 * 1024;
export const MAX_CASE_METADATA_BYTES = 1024 * 1024;
export const CASE_FOOTER_BYTES = 80;
export const MAX_CASE_FILE_BYTES =
  MAX_SOURCE_BYTES + MAX_CASE_METADATA_BYTES + CASE_FOOTER_BYTES;
const FORMAT = "conox-simulator-case";
const VERSION = 1;
const encoder = new TextEncoder();
const MAGIC = encoder.encode("CONOX-SIM-CASE\0\0");
const END_MAGIC = encoder.encode("CONOX-SIM-END\0\0\0");
const INDEX_KEYS = ["qcon", "qnox", "bsr", "sqi", "emg"];

export class CaseFileError extends Error {
  constructor(code) {
    super(code);
    this.name = "CaseFileError";
    this.code = code;
  }
}
const fail = (code = "CASE_STATE_INVALID") => {
  throw new CaseFileError(code);
};
const object = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const oneOf = (value, choices) => (choices.includes(value) ? value : fail());
const boolean = (value) => (typeof value === "boolean" ? value : fail());
const bytesOf = (input) => {
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input))
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  return fail("CASE_DATA_INVALID");
};
const matches = (bytes, offset, magic) =>
  offset >= 0 && magic.every((byte, index) => bytes[offset + index] === byte);

export function createDefaultCaseState(
  duration,
  locale = "fr",
  referenceProfile = LEGACY_REFERENCE_PROFILE,
) {
  const profile = getReferenceProfile(referenceProfile);
  return {
    referenceProfile: profile.id,
    locale,
    position: 0,
    speed: 1,
    selection: { start: 0, end: clampTimelinePosition(duration, duration) },
    layout: "simulator-frame",
    settings: {
      eegMotion: "sweep",
      eegWindow: profile.defaultEegWindow,
      amplitude: 120,
      dsaWindow: profile.defaultDsaWindow,
      colorOffset: 0,
      guides: true,
      sef50: false,
      sef95: false,
      monitorView: "eeg-dsa",
    },
    timeline: { showIndices: true, hiddenIndices: [] },
    markers: [],
    videoFormat: null,
  };
}

/** Explicit fields only: untrusted JSON never spreads into React state or DOM. */
export function validateCaseState(state, duration) {
  const maximum = clampTimelinePosition(duration, duration);
  if (
    !object(state) ||
    !object(state.settings) ||
    !object(state.selection) ||
    !object(state.timeline) ||
    maximum <= 0
  )
    fail();
  const time = (value) => {
    if (!Number.isFinite(value) || value < 0 || value > maximum) fail();
    return clampTimelinePosition(value, maximum);
  };
  const start = time(state.selection.start);
  const end = time(state.selection.end);
  if (end - start < Math.min(0.25, maximum) - 1e-9) fail();
  if (!Array.isArray(state.markers) || state.markers.length > 5000) fail();
  const ids = new Set();
  const markers = state.markers
    .map((event) => {
      const marker = normalizeEventMarker(event, maximum);
      if (!marker || ids.has(marker.id)) fail();
      ids.add(marker.id);
      return marker;
    })
    .sort((a, b) => a.time - b.time || a.id.localeCompare(b.id));
  const hidden = state.timeline.hiddenIndices;
  if (
    !Array.isArray(hidden) ||
    hidden.length > INDEX_KEYS.length ||
    new Set(hidden).size !== hidden.length
  )
    fail();
  const s = state.settings;
  const referenceProfile = oneOf(
    state.referenceProfile ?? LEGACY_REFERENCE_PROFILE,
    Object.keys(REFERENCE_PROFILES),
  );
  const profile = getReferenceProfile(referenceProfile);
  return {
    referenceProfile,
    locale: oneOf(state.locale, ["fr", "de", "en"]),
    position: time(state.position),
    speed: oneOf(state.speed, [0.25, 0.5, 1, 2, 3, 4]),
    selection: { start, end },
    layout: oneOf(state.layout, [
      "blocks",
      "simulator-frame",
      "simulator-screen",
    ]),
    settings: {
      eegMotion: oneOf(s.eegMotion ?? "sweep", ["sweep", "scroll"]),
      eegWindow: oneOf(s.eegWindow, profile.eegWindows),
      amplitude: oneOf(s.amplitude, profile.amplitudes),
      dsaWindow: oneOf(s.dsaWindow, profile.dsaWindows),
      colorOffset: oneOf(s.colorOffset, [-16, -12, -8, -4, 0, 4, 8, 12, 16]),
      guides: boolean(s.guides),
      sef50: boolean(s.sef50),
      sef95: boolean(s.sef95),
      monitorView: oneOf(s.monitorView, [
        "eeg-index",
        "dsa-index",
        "eeg-dsa",
        "all",
        "dsa-only",
        "eeg-only",
      ]),
    },
    timeline: {
      showIndices: boolean(state.timeline.showIndices),
      hiddenIndices: hidden.map((key) => oneOf(key, INDEX_KEYS)),
    },
    markers,
    videoFormat: oneOf(state.videoFormat ?? null, [null, "mp4", "webm"]),
  };
}

export function caseSourceName(fileName) {
  const name =
    typeof fileName === "string"
      ? fileName
          .split(/[\\/]/)
          .pop()
          .replace(/[\u0000-\u001f\u007f]/g, "")
          .slice(0, 180)
      : "";
  return name || "CONOX.cxbin";
}
export function caseDownloadName(sourceName) {
  return `${caseSourceName(sourceName).replace(/\.cxbin$/i, "")}-simulateur.cxbin`;
}

/** Footer is a simulator extension, not part of the manufacturer's CXBIN spec. */
export async function encodeCaseFile(
  source,
  state,
  { duration, sourceName } = {},
) {
  const raw = bytesOf(source);
  if (raw.byteLength > MAX_SOURCE_BYTES) fail("TOO_LARGE");
  if (!raw.byteLength || raw.byteLength % 1024) fail("CASE_DATA_INVALID");
  const canonical = validateCaseState(state, duration);
  const metadata = encoder.encode(
    JSON.stringify({
      format: FORMAT,
      version: VERSION,
      sourceName: caseSourceName(sourceName),
      state: canonical,
    }),
  );
  if (metadata.byteLength > MAX_CASE_METADATA_BYTES) fail("CASE_DATA_INVALID");
  const payload = new Uint8Array(raw.byteLength + metadata.byteLength);
  payload.set(raw);
  payload.set(metadata, raw.byteLength);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", payload));
  const footer = new Uint8Array(CASE_FOOTER_BYTES);
  const view = new DataView(footer.buffer);
  footer.set(MAGIC);
  view.setUint32(16, VERSION, true);
  view.setUint32(20, raw.byteLength, true);
  view.setUint32(24, metadata.byteLength, true);
  footer.set(digest, 32);
  footer.set(END_MAGIC, 64);
  return new Blob([payload, footer], { type: "application/octet-stream" });
}

/** Returns a bounded view of the exact original bytes, never reconstructed EEG. */
export async function decodeCaseFile(input) {
  const bytes = bytesOf(input);
  if (bytes.byteLength > MAX_CASE_FILE_BYTES) fail("TOO_LARGE");
  const offset = bytes.byteLength - CASE_FOOTER_BYTES;
  if (
    !matches(bytes, offset, MAGIC) &&
    !matches(bytes, bytes.byteLength - END_MAGIC.length, END_MAGIC)
  ) {
    if (bytes.byteLength > MAX_SOURCE_BYTES) fail("TOO_LARGE");
    return { source: bytes, metadata: null };
  }
  if (!matches(bytes, offset, MAGIC) || !matches(bytes, offset + 64, END_MAGIC))
    fail("CASE_DATA_INVALID");
  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset + offset,
    CASE_FOOTER_BYTES,
  );
  if (view.getUint32(16, true) !== VERSION) fail("CASE_VERSION_UNSUPPORTED");
  const sourceLength = view.getUint32(20, true);
  const metadataLength = view.getUint32(24, true);
  if (
    !sourceLength ||
    sourceLength % 1024 ||
    sourceLength > MAX_SOURCE_BYTES ||
    !metadataLength ||
    metadataLength > MAX_CASE_METADATA_BYTES ||
    sourceLength + metadataLength !== offset ||
    view.getUint32(28, true) !== 0
  )
    fail("CASE_DATA_INVALID");
  const actual = new Uint8Array(
    await crypto.subtle.digest("SHA-256", bytes.subarray(0, offset)),
  );
  if (!actual.every((value, index) => value === bytes[offset + 32 + index]))
    fail("CASE_INTEGRITY_FAILED");
  let metadata;
  try {
    metadata = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        bytes.subarray(sourceLength, offset),
      ),
    );
  } catch {
    fail("CASE_DATA_INVALID");
  }
  if (
    !object(metadata) ||
    metadata.format !== FORMAT ||
    !object(metadata.state) ||
    typeof metadata.sourceName !== "string" ||
    metadata.sourceName.length > 180
  )
    fail("CASE_DATA_INVALID");
  if (metadata.version !== VERSION) fail("CASE_VERSION_UNSUPPORTED");
  return { source: bytes.subarray(0, sourceLength), metadata };
}
