import { loadRecordingCase } from "./loadCase.js";

self.onmessage = async ({ data }) => {
  try {
    const result = await loadRecordingCase(data.buffer, data.fileName, {
      referenceProfile: data.referenceProfile,
      defaultReferenceProfile: data.defaultReferenceProfile,
    });
    const { recording, eeg, filtered, spectrum } = result;
    const transfers = new Set([
      recording.samples.buffer,
      eeg.samples.buffer,
      filtered.buffer,
      recording.referenceSpectrum.groups.buffer,
      recording.referenceSpectrum.values.buffer,
      spectrum.frequencies.buffer,
      ...spectrum.columns.map((column) => (column.values || column.db).buffer),
    ]);
    self.postMessage(result, [...transfers]);
  } catch (error) {
    self.postMessage({ error: error.code || "UNKNOWN" });
  }
};
