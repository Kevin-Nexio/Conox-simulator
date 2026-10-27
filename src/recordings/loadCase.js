import {
  decodeCaseFile,
  validateCaseState,
  caseSourceName,
} from "./caseFile.js";
import { parseCxbin } from "./cxbin.js";
import { getFilteredEeg, buildSpectrogram } from "./spectrum.js";
import { buildReferenceSpectrogram } from "./referenceSpectrum.js";
import { buildAndroidSpectrogram } from "./androidSpectrum.js";
import {
  LEGACY_REFERENCE_PROFILE,
  normalizeReferenceSettings,
} from "./referenceProfiles.js";

export async function loadRecordingCase(buffer, fileName, options = {}) {
  const { source, metadata } = await decodeCaseFile(buffer);
  // A saved file predating profiles always retains its iOS interpretation.
  const referenceProfile =
    options.referenceProfile ??
    (metadata
      ? (metadata.state.referenceProfile ?? LEGACY_REFERENCE_PROFILE)
      : (options.defaultReferenceProfile ?? LEGACY_REFERENCE_PROFILE));
  const recording = parseCxbin(source, { fileName, referenceProfile });
  let session = metadata
    ? validateCaseState(metadata.state, recording.durationSeconds)
    : null;
  if (session && referenceProfile !== session.referenceProfile)
    session = validateCaseState(
      {
        ...session,
        referenceProfile,
        settings: normalizeReferenceSettings(
          session.settings,
          referenceProfile,
        ),
      },
      recording.durationSeconds,
    );
  const filtered = getFilteredEeg(recording);
  const spectrum =
    referenceProfile === "android-2.4"
      ? buildAndroidSpectrogram(recording)
      : recording.referenceSpectrum
        ? buildReferenceSpectrogram(recording)
        : buildSpectrogram(recording, filtered);
  return {
    referenceProfile,
    recording,
    eeg: recording.referenceEeg || {
      samples: filtered,
      sampleRate: recording.sampleRate,
      source: "reconstructed-24be",
    },
    filtered,
    spectrum,
    session,
    sourceByteLength: source.byteLength,
    sourceName: caseSourceName(metadata?.sourceName || fileName),
  };
}
