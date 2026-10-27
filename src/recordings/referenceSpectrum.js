import { CONOX_SPECTRAL_OFFSETS } from "./conoxview.js";

/** Native setupPathSpectro's jet transfer function, including truncation. */
export function conoxviewSpectralRgb(value) {
  if (!Number.isFinite(value)) return [0, 0, 0];
  return [1, 0, -1].map((centre) =>
    Math.trunc(
      255 * Math.min(1, Math.max(0, 1.5 - Math.abs(2 * value - centre))),
    ),
  );
}

/**
 * ConoxView writes nine received bands into the current column. The packet at
 * a five-second boundary still updates the old column before advancing it.
 * Only finalized columns become visible, so seeking cannot reveal later values.
 */
export function buildReferenceSpectrogram(recording) {
  const { groups, values } = recording.referenceSpectrum;
  const columns = [];
  const columnAt = (index) => {
    if (!columns[index])
      columns[index] = {
        time: index * 5 + 2.5,
        values: new Float32Array(45).fill(NaN),
        finalizedAt: null,
        sef50: null,
        sef95: null,
      };
    return columns[index];
  };
  let column = 0;
  let nextColumn = 1;
  for (let frame = 0; frame < groups.length; frame++) {
    const time = recording.frames[frame].time;
    const elapsed = Math.floor(time);
    const group = groups[frame];
    if (elapsed >= 1 && group <= 4) {
      const target = columnAt(column);
      for (let bin = 0; bin < CONOX_SPECTRAL_OFFSETS.length; bin++)
        target.values[group * 9 + bin] = (values[frame * 9 + bin] - 128) / 128;
    }
    if (nextColumn * 5 <= elapsed) {
      columnAt(column).finalizedAt = time;
      column++;
      nextColumn++;
    }
  }
  return {
    source: "conoxview-received",
    units: "ConoxView display",
    valueScale: "conoxview-normalized",
    hasSef: false,
    frequencies: Float32Array.from({ length: 45 }, (_, index) => index + 1),
    columns,
    hopSeconds: 5,
  };
}

/** RGBA image of the received updates available at this playback position. */
export function createReferenceDsaPixels(spectrum, position = Infinity) {
  const width = Math.max(1, spectrum.columns.length);
  const height = spectrum.frequencies.length;
  const pixels = new Uint8ClampedArray(width * height * 4);
  // Missing bands remain black instead of being assigned a plausible colour.
  for (let i = 3; i < pixels.length; i += 4) pixels[i] = 255;
  spectrum.columns.forEach((column, x) => {
    if (column.finalizedAt === null || column.finalizedAt > position) return;
    for (let bin = 0; bin < height; bin++) {
      const rgb = conoxviewSpectralRgb(column.values[bin]);
      const at = ((height - bin - 1) * width + x) * 4;
      pixels.set(rgb, at);
    }
  });
  return pixels;
}
