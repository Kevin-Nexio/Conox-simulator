import {
  CONOXVIEW_REFERENCE,
  CONOX_EEG_SAMPLE_RATE,
  CONOX_EEG_SAMPLES_PER_FRAME,
  CONOX_SPECTRAL_OFFSETS,
  decodeConoxImpedance,
  decodeConoxState,
  hasValidConoxCrc,
} from "./conoxview.js";
import { applyReferenceProfile } from "./androidReference.js";
import { LEGACY_REFERENCE_PROFILE } from "./referenceProfiles.js";

// Field reads and frame integrity follow the inspected ConoxView iOS decoder.
// The raw 24-bit calibration and CXBIN case metadata remain separate assumptions.
const FRAME_BYTES = 1024;
const SAMPLES_PER_FRAME = 256;
const SAMPLE_RATE = 1024;
const SIGNATURE = "fff";
const MICROVOLTS_PER_COUNT = 0.04458;
// qNOX follows the three electrode fields; byte 19 is EMG (0..100).
// Confirmed by ConoxView's extractDataBy3BProtocol: implementation.
const INDEX_OFFSETS = { qcon: 18, qnox: 25, bsr: 20, sqi: 21, emg: 19 };
const IMPEDANCE_OFFSETS = [22, 23, 24];

export class CxbinParseError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "CxbinParseError";
    this.code = code;
    this.details = details;
  }
}

function fail(code, details) {
  throw new CxbinParseError(code, details);
}

function readAscii(bytes, offset, length) {
  let value = "";
  for (let i = 0; i < length; i++) {
    value += String.fromCharCode(bytes[offset + i]);
  }
  return value;
}

function readClock(bytes, offset, frame) {
  const hour = bytes[offset + 959];
  const minute = bytes[offset + 960];
  const second = bytes[offset + 961];
  const day = bytes[offset + 962];
  const month = bytes[offset + 963];
  const year = 2000 + bytes[offset + 964];
  // UTC is only used for calendar arithmetic. The file does not encode a zone.
  const milliseconds = Date.UTC(year, month - 1, day, hour, minute, second);
  const date = new Date(milliseconds);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    fail("INVALID_TIMESTAMP", { frame });
  }
  const two = (value) => String(value).padStart(2, "0");
  return {
    milliseconds,
    wallClock: `${year}-${two(month)}-${two(day)}T${two(hour)}:${two(minute)}:${two(second)}`,
  };
}

function asBytes(buffer) {
  if (buffer instanceof ArrayBuffer) return new Uint8Array(buffer);
  if (ArrayBuffer.isView(buffer)) {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }
  fail("UNSUPPORTED_FORMAT");
}

/**
 * Decode the supported, inferred 1024-byte CXBIN layout in memory only.
 * Frame time follows the continuous counter (0.25 seconds per frame), never
 * the rounded device clock. startedAt has no timezone suffix for that reason.
 */
export function parseCxbin(
  buffer,
  { fileName = "", referenceProfile = LEGACY_REFERENCE_PROFILE } = {},
) {
  const bytes = asBytes(buffer);
  if (!bytes.byteLength) fail("EMPTY_FILE");
  if (bytes.byteLength % FRAME_BYTES !== 0) fail("TRUNCATED_FILE");

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const frameCount = bytes.byteLength / FRAME_BYTES;
  const caseCounts = new Map();
  const rawFrames = [];
  let previousCounter = null;

  for (let frame = 0; frame < frameCount; frame++) {
    const offset = frame * FRAME_BYTES;
    if (readAscii(bytes, offset, SIGNATURE.length) !== SIGNATURE) {
      fail(frame === 0 ? "UNSUPPORTED_FORMAT" : "CORRUPT_FRAME", { frame });
    }
    if (!hasValidConoxCrc(bytes, offset)) fail("FRAME_CRC_MISMATCH", { frame });
    const counter = view.getUint32(offset + 13, false);
    if (previousCounter !== null && counter !== (previousCounter + 1) >>> 0) {
      fail("COUNTER_GAP", { frame, previousCounter, counter });
    }
    previousCounter = counter;
    const caseId = readAscii(bytes, offset + 883, 7);
    if (!/^R\d{6}$/.test(caseId)) fail("INVALID_CASE_ID", { frame });
    const clock = readClock(bytes, offset, frame);
    caseCounts.set(caseId, (caseCounts.get(caseId) || 0) + 1);
    rawFrames.push({ caseId, counter, clock, offset });
  }

  const rankedCases = [...caseCounts].sort((a, b) => b[1] - a[1]);
  if (rankedCases.length > 1 && rankedCases[0][1] === rankedCases[1][1]) {
    fail("AMBIGUOUS_CASE");
  }
  const id = rankedCases[0][0];
  const firstFrame = rawFrames.findIndex((frame) => frame.caseId === id);
  // The observed file has three stale startup frames from one previous case.
  // Only allow this short prefix; a substantial preceding case must not be
  // silently discarded merely because another case has more frames.
  const previousCases = new Set(
    rawFrames.slice(0, firstFrame).map((frame) => frame.caseId),
  );
  if (firstFrame > 4 || previousCases.size > 1) fail("MIXED_CASES");
  const selectedFrames = rawFrames.slice(firstFrame);
  if (selectedFrames.some((frame) => frame.caseId !== id)) fail("MIXED_CASES");

  const samples = new Float32Array(selectedFrames.length * SAMPLES_PER_FRAME);
  const displaySamples = new Uint16Array(
    selectedFrames.length * CONOX_EEG_SAMPLES_PER_FRAME,
  );
  const spectralGroups = new Uint8Array(selectedFrames.length);
  const spectralValues = new Uint8Array(selectedFrames.length * 9);
  const frames = [];
  let invalidIndexCount = 0;
  let clockJumpCount = 0;
  let minClockDrift = 0;
  let maxClockDrift = 0;
  let previousClock = selectedFrames[0].clock.milliseconds;
  const initialClock = previousClock;

  for (let frame = 0; frame < selectedFrames.length; frame++) {
    const { offset, counter, clock } = selectedFrames[frame];
    const rawIndices = {};
    const indices = {};
    for (const [key, indexOffset] of Object.entries(INDEX_OFFSETS)) {
      const raw = bytes[offset + indexOffset];
      rawIndices[key] = raw;
      // ConoxView accepts qNOX=100, whereas qCON stops at 99.
      const maximum = key === "qcon" ? 99 : 100;
      indices[key] = raw <= maximum ? raw : null;
      if (indices[key] === null) invalidIndexCount++;
    }

    const time = (frame * SAMPLES_PER_FRAME) / SAMPLE_RATE;
    const rawImpedances = IMPEDANCE_OFFSETS.map((at) => bytes[offset + at]);
    const impedanceStates = rawImpedances.map(decodeConoxImpedance);
    const impedances = impedanceStates.map(({ value }) => value);
    frames.push({
      time,
      indices,
      rawIndices,
      impedances,
      rawImpedances,
      impedanceStates,
      status: bytes[offset + 17],
      sensorStatus: bytes[offset + 927],
      spectralArtifact: bytes
        .subarray(offset + 992, offset + 997)
        .some((value) => value !== 0),
      monitorState: decodeConoxState(bytes[offset + 17]),
      counter,
      clock: clock.wallClock,
    });
    const clockStep = (clock.milliseconds - previousClock) / 1000;
    if (frame > 0 && (clockStep < 0 || clockStep > 1)) clockJumpCount++;
    const drift = (clock.milliseconds - initialClock) / 1000 - time;
    minClockDrift = Math.min(minClockDrift, drift);
    maxClockDrift = Math.max(maxClockDrift, drift);
    previousClock = clock.milliseconds;

    const sampleStart = frame * SAMPLES_PER_FRAME;
    for (let sample = 0; sample < SAMPLES_PER_FRAME; sample++) {
      const position = offset + 26 + sample * 3;
      const raw =
        bytes[position] * 65536 +
        bytes[position + 1] * 256 +
        bytes[position + 2];
      samples[sampleStart + sample] = (raw - 0x800000) * MICROVOLTS_PER_COUNT;
    }
    for (let sample = 0; sample < CONOX_EEG_SAMPLES_PER_FRAME; sample++)
      displaySamples[frame * CONOX_EEG_SAMPLES_PER_FRAME + sample] =
        view.getUint16(offset + 794 + sample * 2, false);
    spectralGroups[frame] = bytes[offset + 881];
    for (let bin = 0; bin < CONOX_SPECTRAL_OFFSETS.length; bin++)
      spectralValues[frame * 9 + bin] =
        bytes[offset + CONOX_SPECTRAL_OFFSETS[bin]];
  }

  const warnings = [{ code: "experimentalDecoding" }];
  if (firstFrame > 0) {
    warnings.push({ code: "previousCaseFramesExcluded", count: firstFrame });
  }
  // A second-resolution clock naturally varies by up to 0.75 seconds against
  // the four frames per second. Larger spread indicates a discontinuity.
  const clockDriftSpread = maxClockDrift - minClockDrift;
  if (clockJumpCount > 0 || clockDriftSpread > 1) {
    warnings.push({
      code: "clockDiscontinuity",
      count: clockJumpCount || 1,
      maxDriftSeconds: clockDriftSpread,
    });
  }
  if (invalidIndexCount > 0) {
    warnings.push({ code: "invalidIndices", count: invalidIndexCount });
  }

  return applyReferenceProfile(
    {
      id,
      fileName,
      sampleRate: SAMPLE_RATE,
      samples,
      frames,
      durationSeconds: samples.length / SAMPLE_RATE,
      startedAt: selectedFrames[0].clock.wallClock,
      warnings,
      experimental: true,
      calibration: {
        encoding: "offset-binary-24be",
        microvoltsPerCount: MICROVOLTS_PER_COUNT,
        verified: false,
      },
      reference: CONOXVIEW_REFERENCE,
      referenceEeg: {
        samples: displaySamples,
        sampleRate: CONOX_EEG_SAMPLE_RATE,
        source: "conoxview-16be",
        encoding: "uint16be",
        center: 31000,
        units: "ConoxView display",
        geometryVerified: true,
        clinicalCalibrationVerified: false,
      },
      referenceSpectrum: {
        groups: spectralGroups,
        values: spectralValues,
        source: "conoxview-received",
      },
      integrity: {
        algorithm: "CRC-16/ARC",
        verified: true,
        checkedFrames: frameCount,
      },
      indicesVerified: true,
      impedancesVerified: true,
      clockTimezone: null,
      sourceFrameCount: frameCount,
      excludedFrameCount: firstFrame,
    },
    referenceProfile,
  );
}
