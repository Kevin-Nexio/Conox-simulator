import { loadRecordingCase } from "./loadCase.js";

self.onmessage = async ({ data }) => {
  try {
    const result = await loadRecordingCase(data.buffer, data.fileName);
    const { recording, filtered, spectrum } = result;
    self.postMessage(result, [
      recording.samples.buffer,
      filtered.buffer,
      spectrum.frequencies.buffer,
      ...spectrum.columns.map((column) => column.db.buffer),
    ]);
  } catch (error) {
    self.postMessage({ error: error.code || "UNKNOWN" });
  }
};
