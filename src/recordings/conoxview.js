// Reference: ConoxView iOS 1.1 (bundle 1.1.1, build 2), inspected with REA.
// The app's display rules are a software reference, not a clinical calibration.
export const CONOXVIEW_REFERENCE = Object.freeze({
  name: "ConoxView iOS",
  version: "1.1",
  executableSha256:
    "46173a925df37fdcd22551158dbe3187b028eaccc8efcd7b30b0cb89465d89cb",
});

export const CONOX_FRAME_BYTES = 1024;
export const CONOX_EEG_SAMPLE_RATE = 128;
export const CONOX_EEG_SAMPLES_PER_FRAME = 32;
export const CONOX_SPECTRAL_OFFSETS = Object.freeze([
  882, 928, 929, 930, 931, 932, 933, 941, 942,
]);

const CRC_TABLE = Uint16Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++)
    value = value & 1 ? (value >>> 1) ^ 0xa001 : value >>> 1;
  return value;
});

/** CRC-16/ARC recurrence; the CONOX frame stores its result big endian. */
export function crc16Arc(bytes, start = 0, end = bytes.length) {
  let crc = 0;
  for (let index = start; index < end; index++)
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[index]) & 0xff];
  return crc;
}

export function hasValidConoxCrc(bytes, offset = 0) {
  if (offset < 0 || offset + CONOX_FRAME_BYTES > bytes.length) return false;
  return (
    crc16Arc(bytes, offset, offset + 1022) ===
    bytes[offset + 1022] * 256 + bytes[offset + 1023]
  );
}

const STATES = {
  0: ["reading", "normal"],
  128: ["artifact", "warning"],
  200: ["impedanceTest", "checking"],
  225: ["leadOff", "warning"],
  210: ["sensorInvalid", "warning"],
  132: ["sensorEndOfUse", "warning"],
};

export function decodeConoxState(raw) {
  const [kind, severity] = STATES[raw] || ["unknown", "unknown"];
  return { raw, kind, severity };
}

export function decodeConoxImpedance(raw) {
  if (raw >= 1 && raw <= 10) return { raw, value: raw, kind: "value" };
  if (raw === 15) return { raw, value: null, kind: "tooHigh" };
  if (raw === 128) return { raw, value: null, kind: "unavailable" };
  return { raw, value: null, kind: "unknown" };
}
