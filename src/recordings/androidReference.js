import {
  CONOXVIEW_REFERENCE,
  decodeConoxImpedance,
  decodeConoxState,
} from "./conoxview.js";
import { getReferenceProfile } from "./referenceProfiles.js";

export const ANDROID_REFERENCE = Object.freeze({
  name: "ConoxView Android",
  version: "2.4",
  apkSha256: "f7576a552ed77c96655baf4188f6f20390bfa5dcccb2c73b2bb4059898881b7b",
});

export function decodeAndroidState(raw, sensorStatus = 0, previous) {
  let state;
  if (raw <= 100) state = { raw, kind: "reading", severity: "normal" };
  else if (raw === 133)
    state = { raw, kind: "sensorEndOfUse", severity: "warning" };
  else state = decodeConoxState(raw);
  if ((raw <= 100 || raw === 128) && sensorStatus >= 124 && sensorStatus <= 131)
    state = { raw, kind: "sensorEndOfUse", severity: "warning" };
  if ((raw <= 100 || raw === 128) && sensorStatus === 180)
    state = { raw, kind: "sensorExpired", severity: "warning" };
  // This native branch leaves its old status text in place. Retain that fact
  // alongside the new raw code rather than inventing a clinical default.
  if (state.kind === "unknown" && previous)
    state = { ...previous, raw, retained: true };
  return { ...state, sensorStatus };
}

/** Interpret wire fields without changing the source bytes or raw values. */
export function applyReferenceProfile(recording, profileId) {
  const profile = getReferenceProfile(profileId);
  const android = profile.id === "android-2.4";
  const held = {};
  let invalidIndexCount = 0;
  let previousState;
  let impedanceVisible = true;
  let indicesVisible = true;
  let sqiVisible = true;
  const trendFrames = [];
  const frames = recording.frames.map((frame) => {
    const indices = {};
    for (const [key, raw] of Object.entries(frame.rawIndices)) {
      const maximum = key === "qcon" || (android && key === "qnox") ? 99 : 100;
      indices[key] = raw <= maximum ? raw : null;
      if (indices[key] === null) invalidIndexCount++;
    }
    const impedanceStates = frame.rawImpedances.map((raw) =>
      android && raw >= 1 && raw <= 14
        ? { raw, value: raw, kind: "value" }
        : decodeConoxImpedance(raw),
    );
    const monitorState = android
      ? decodeAndroidState(frame.status, frame.sensorStatus, previousState)
      : decodeConoxState(frame.status);
    previousState = monitorState;
    if (android) {
      // Impedance widgets use the flag from the preceding packet; qCON is
      // decoded next and can re-enable both impedance and SQI before SQI draws.
      if (!impedanceVisible)
        impedanceStates.forEach((value) => {
          value.value = null;
          value.kind = "unavailable";
        });
      if (indices.qcon !== null) {
        impedanceVisible = true;
        indicesVisible = true;
        sqiVisible = true;
      } else indicesVisible = false;
      if (!sqiVisible) indices.sqi = null;
      for (const [key, raw] of Object.entries(frame.rawIndices)) {
        const maximum = key === "qcon" || key === "qnox" ? 99 : 100;
        if (raw <= maximum) held[key] = raw;
        else if (key === "sqi") held[key] = null;
      }
      if (frame.status <= 100) {
        impedanceVisible = indicesVisible = sqiVisible = true;
      } else if (frame.status === 128) {
        impedanceVisible = sqiVisible = true;
        indicesVisible = false;
      } else if (frame.status === 200) {
        impedanceVisible = true;
        sqiVisible = false;
      } else if ([210, 132, 133, 225].includes(frame.status)) {
        impedanceVisible = indicesVisible = sqiVisible = false;
      }
      // One-second trend clock, anchored deterministically to the counter.
      // Unknown initial values stay absent; native internal zeroes are not data.
      if (frame.counter % 4 === 0)
        trendFrames.push({
          time: frame.time + 0.25,
          indices: Object.fromEntries(
            Object.keys(frame.rawIndices).map((key) => [
              key,
              (key === "sqi" ? sqiVisible : indicesVisible)
                ? (held[key] ?? null)
                : null,
            ]),
          ),
        });
    }
    return {
      ...frame,
      indices,
      impedanceStates,
      impedances: impedanceStates.map(({ value }) => value),
      monitorState,
    };
  });
  const warnings = recording.warnings.filter(
    (warning) => warning.code !== "invalidIndices",
  );
  if (invalidIndexCount)
    warnings.push({ code: "invalidIndices", count: invalidIndexCount });
  return {
    ...recording,
    frames,
    ...(android ? { trendFrames } : { trendFrames: null }),
    warnings,
    referenceProfile: profile.id,
    reference: android ? ANDROID_REFERENCE : CONOXVIEW_REFERENCE,
    referenceEeg: { ...recording.referenceEeg, profile: profile.id },
  };
}
