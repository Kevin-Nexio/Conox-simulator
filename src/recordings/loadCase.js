import {
  decodeCaseFile,
  validateCaseState,
  caseSourceName,
} from "./caseFile.js";
import { parseCxbin } from "./cxbin.js";
import { getFilteredEeg, buildSpectrogram } from "./spectrum.js";

export async function loadRecordingCase(buffer, fileName) {
  const { source, metadata } = await decodeCaseFile(buffer);
  const recording = parseCxbin(source, { fileName });
  const session = metadata
    ? validateCaseState(metadata.state, recording.durationSeconds)
    : null;
  const filtered = getFilteredEeg(recording);
  const spectrum = buildSpectrogram(recording, filtered);
  return {
    recording,
    filtered,
    spectrum,
    session,
    sourceByteLength: source.byteLength,
    sourceName: caseSourceName(metadata?.sourceName || fileName),
  };
}
