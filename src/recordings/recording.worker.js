import { parseCxbin } from "./cxbin.js";
import { getFilteredEeg, buildSpectrogram } from "./spectrum.js";

self.onmessage = ({ data }) => {
  try {
    const recording = parseCxbin(data.buffer, { fileName: data.fileName });
    const filtered = getFilteredEeg(recording);
    const spectrum = buildSpectrogram(recording, filtered);
    self.postMessage({ recording, filtered, spectrum }, [
      recording.samples.buffer,
      filtered.buffer,
      spectrum.frequencies.buffer,
      ...spectrum.columns.map((column) => column.db.buffer),
    ]);
  } catch (error) {
    self.postMessage({ error: error.code || "UNKNOWN" });
  }
};
