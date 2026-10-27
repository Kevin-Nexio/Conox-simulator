import { createAndroidSpectrumCalculator } from "../recordings/androidSpectrum.js";
import { conoxviewSpectralRgb } from "../recordings/referenceSpectrum.js";
import { androidDsaTimeRange } from "../recordings/referenceProfiles.js";

/** Feed the same generated EEG to the Android FFT. The nominal counts/µV
 * mapping below is a teaching convention, not an electrode calibration. */
export function createAndroidSimulationDsa() {
  const calculator = createAndroidSpectrumCalculator();
  const buffer = new Uint16Array(128);
  let samples = 0;
  let elapsed = 0;
  let publishedAt = 0;
  let columns = [];
  return {
    append(microvolts) {
      buffer[samples++] = Math.max(
        1,
        Math.min(65535, Math.round(31000 + (microvolts * 3449) / 50)),
      );
      if (samples !== 128) return;
      elapsed++;
      const bytes = calculator.read();
      calculator.calculate(buffer);
      samples = 0;
      columns.push({ time: elapsed - 0.5, bytes });
      if (columns.length > 3600) columns.shift();
      if (elapsed % 5 === 0) publishedAt = elapsed;
    },
    reset() {
      samples = elapsed = publishedAt = 0;
      columns = [];
      calculator.reset();
    },
    snapshot() {
      return {
        position: publishedAt,
        columns: columns.filter((column) => column.time < publishedAt),
      };
    },
  };
}

/** Build one logical pixel per native time cell, without overlapping columns. */
export function createAndroidSimulationDsaFrame(history, periodSeconds) {
  const { position, columns } = history.snapshot();
  const hop = periodSeconds === 3600 ? 2 : 1;
  const width = Math.max(1, Math.round(periodSeconds / hop));
  const height = 44;
  const range = androidDsaTimeRange(position, periodSeconds);
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < pixels.length; index += 4)
    pixels.set([0, 0, 127, 255], index);
  for (const column of columns) {
    if (column.time >= position || (hop === 2 && (column.time + 0.5) % 2 !== 0))
      continue;
    const x = Math.round((column.time + 0.5 - hop - range.start) / hop);
    if (x < 0 || x >= width) continue;
    for (let bin = 0; bin < 44; bin++) {
      const rgb = conoxviewSpectralRgb((column.bytes[bin] - 128) / 128);
      pixels.set([...rgb, 255], ((43 - bin) * width + x) * 4);
    }
  }
  return { width, height, pixels, range, hopSeconds: hop };
}

const surfaces = new WeakMap();

/** Native bitmap projection; a single scale preserves the one-second grid.
 * Android explicitly filters the 5-minute crop when scaling its bitmap. */
export function paintAndroidSimulationDsa(context, history, periodSeconds) {
  const frame = createAndroidSimulationDsaFrame(history, periodSeconds);
  let surface = surfaces.get(context);
  if (!surface) {
    surface = document.createElement("canvas");
    surfaces.set(context, surface);
  }
  if (surface.width !== frame.width) surface.width = frame.width;
  if (surface.height !== frame.height) surface.height = frame.height;
  const source = surface.getContext("2d");
  const data = source.createImageData(frame.width, frame.height);
  data.data.set(frame.pixels);
  source.putImageData(data, 0, 0);
  context.imageSmoothingEnabled = true;
  context.drawImage(surface, 0, 0, context.canvas.width, context.canvas.height);
}
