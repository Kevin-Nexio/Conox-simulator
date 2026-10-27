import { dsaDbToRgb } from "../simulation/engine.js";
import { formatPosition } from "./playback.js";
import { createReferenceDsaPixels } from "./referenceSpectrum.js";
import { createAndroidDsaPixels } from "./androidSpectrum.js";
import { isNativeSpectrum } from "./referenceProfiles.js";

const WIDTH = 1200;
const LEFT = 56;
const RIGHT = WIDTH - 12;
const TOP = 26;

function base(canvas, height) {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#030a0d";
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.font = "13px sans-serif";
  ctx.fillStyle = "#c4d4dd";
  ctx.strokeStyle = "#38515e";
  ctx.lineWidth = 1;
  return ctx;
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function timeAxis(ctx, range, bottom, guides, divisions = 4) {
  for (let index = 0; index <= divisions; index++) {
    const x = LEFT + ((RIGHT - LEFT) * index) / divisions;
    const value = range.start + ((range.end - range.start) * index) / divisions;
    ctx.textAlign =
      index === 0 ? "left" : index === divisions ? "right" : "center";
    ctx.fillText(formatPosition(value), x, bottom + 22);
    if (guides && index > 0 && index < divisions) {
      ctx.save();
      ctx.strokeStyle = "#91a9b34d";
      ctx.setLineDash([4, 5]);
      line(ctx, x, TOP, x, bottom);
      ctx.restore();
    }
  }
  ctx.textAlign = "left";
}

function cursor(ctx, position, range, bottom) {
  const x =
    LEFT +
    ((position - range.start) / (range.end - range.start)) * (RIGHT - LEFT);
  if (x < LEFT || x > RIGHT) return;
  ctx.strokeStyle = "#f7f9fabb";
  ctx.lineWidth = 1.5;
  line(ctx, x, TOP, x, bottom);
}

export function drawEeg(
  canvas,
  samples,
  sampleRate,
  position,
  range,
  amplitude,
  guides,
) {
  const height = 240;
  const bottom = height - 32;
  const ctx = base(canvas, height);
  const middle = (TOP + bottom) / 2;
  const scale = (bottom - TOP) / 2 / amplitude;
  ctx.fillText("µV*", 8, 14);
  for (const fraction of [-1, -0.5, 0, 0.5, 1]) {
    const y = middle - fraction * amplitude * scale;
    ctx.fillText(String(Math.round(fraction * amplitude)), 6, y + 4);
    if (guides || fraction === 0) {
      ctx.save();
      ctx.strokeStyle = "#91a9b34d";
      ctx.setLineDash(guides ? [4, 5] : []);
      line(ctx, LEFT, y, RIGHT, y);
      ctx.restore();
    }
  }
  timeAxis(ctx, range, bottom, false);
  if (guides) {
    ctx.save();
    ctx.strokeStyle = "#91a9b34d";
    ctx.setLineDash([4, 5]);
    for (let sec = Math.ceil(range.start); sec < range.end; sec++) {
      const x =
        LEFT +
        ((sec - range.start) / (range.end - range.start)) * (RIGHT - LEFT);
      line(ctx, x, TOP, x, bottom);
    }
    ctx.restore();
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(LEFT, TOP, RIGHT - LEFT, bottom - TOP);
  ctx.clip();
  ctx.strokeStyle = "#edfff6";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  let connected = false;
  // Min/max per display pixel preserves peaks while viewing 1,024-Hz data.
  for (let x = LEFT; x < RIGHT; x++) {
    const first = Math.floor(
      (range.start +
        ((x - LEFT) / (RIGHT - LEFT)) * (range.end - range.start)) *
        sampleRate,
    );
    const last = Math.max(
      first + 1,
      Math.floor(
        (range.start +
          ((x + 1 - LEFT) / (RIGHT - LEFT)) * (range.end - range.start)) *
          sampleRate,
      ),
    );
    let min = Infinity;
    let max = -Infinity;
    for (let index = first; index < Math.min(last, samples.length); index++) {
      min = Math.min(min, samples[index]);
      max = Math.max(max, samples[index]);
    }
    if (!Number.isFinite(min)) continue;
    const firstY = middle - samples[first] * scale;
    if (connected) ctx.lineTo(x, firstY);
    else ctx.moveTo(x, firstY);
    ctx.lineTo(x, middle - min * scale);
    ctx.lineTo(x, middle - max * scale);
    ctx.lineTo(x, middle - samples[Math.min(last, samples.length) - 1] * scale);
    connected = true;
  }
  ctx.stroke();
  ctx.restore();
  cursor(ctx, position, range, bottom);
}

export function createDsaImage(spectrum, offset, position = Infinity) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, spectrum.columns.length);
  canvas.height = spectrum.frequencies.length;
  const ctx = canvas.getContext("2d");
  const pixels = ctx.createImageData(canvas.width, canvas.height);
  if (isNativeSpectrum(spectrum)) {
    pixels.data.set(
      spectrum.source === "conoxview-android-fft"
        ? createAndroidDsaPixels(spectrum, position)
        : createReferenceDsaPixels(spectrum, position),
    );
    ctx.putImageData(pixels, 0, 0);
    return canvas;
  }
  spectrum.columns.forEach((column, x) => {
    for (let bin = 0; bin < canvas.height; bin++) {
      const [r, g, b] = Number.isFinite(column.db[bin])
        ? dsaDbToRgb(column.db[bin], offset)
        : [0, 0, 0];
      const index = ((canvas.height - bin - 1) * canvas.width + x) * 4;
      pixels.data.set([r, g, b, 255], index);
    }
  });
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

export function drawDsa(
  canvas,
  image,
  spectrum,
  position,
  range,
  guides,
  sef50,
  sef95,
) {
  const height = 280;
  const bottom = height - 32;
  const ctx = base(canvas, height);
  const yFor = (frequency) => bottom - (frequency / 45) * (bottom - TOP);
  if (spectrum.columns.length) {
    const first = spectrum.columns[0].time;
    const hop =
      spectrum.columns.length > 1 ? spectrum.columns[1].time - first : 1;
    // Each column describes its window centre; do not stretch it across missing edges.
    const x =
      LEFT +
      ((first - hop / 2 - range.start) / (range.end - range.start)) *
        (RIGHT - LEFT);
    const width =
      ((image.width * hop) / (range.end - range.start)) * (RIGHT - LEFT);
    ctx.save();
    ctx.beginPath();
    ctx.rect(LEFT, TOP, RIGHT - LEFT, bottom - TOP);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, x, TOP, width, bottom - TOP);
    for (const [enabled, metric, color] of [
      [sef50, "sef50", "#ffffff"],
      [sef95, "sef95", "#ffacdf"],
    ]) {
      if (!enabled) continue;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      let connected = false;
      for (const column of spectrum.columns) {
        const value = column[metric];
        if (!Number.isFinite(value)) {
          connected = false;
          continue;
        }
        const px =
          LEFT +
          ((column.time - range.start) / (range.end - range.start)) *
            (RIGHT - LEFT);
        connected ? ctx.lineTo(px, yFor(value)) : ctx.moveTo(px, yFor(value));
        connected = true;
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.fillText("Hz", 8, 14);
  for (const frequency of [0, 4, 8, 13, 30, 45]) {
    const y = yFor(frequency);
    ctx.fillStyle = "#c4d4dd";
    ctx.fillText(String(frequency), 12, y + 4);
    if (guides && frequency > 0 && frequency < 45) {
      ctx.save();
      ctx.strokeStyle = "#ffffff8c";
      ctx.setLineDash([5, 6]);
      line(ctx, LEFT, y, RIGHT, y);
      ctx.restore();
    }
  }
  timeAxis(ctx, range, bottom, guides);
  cursor(ctx, position, range, bottom);
}

export function drawTrends(canvas, recording, position, range, guides) {
  const height = 190;
  const bottom = height - 32;
  const ctx = base(canvas, height);
  for (const value of [0, 50, 100]) {
    const y = bottom - (value / 100) * (bottom - TOP);
    ctx.fillText(String(value), 12, y + 4);
    if (guides) line(ctx, LEFT, y, RIGHT, y);
  }
  timeAxis(ctx, range, bottom, guides);
  const first = Math.max(0, Math.floor(range.start * 4));
  const last = Math.min(recording.frames.length, Math.ceil(range.end * 4));
  for (const [metric, color] of [
    ["qcon", "#70ec8f"],
    ["qnox", "#ffdb67"],
    ["bsr", "#ff8d94"],
    ["emg", "#76c9ff"],
  ]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    let connected = false;
    for (let index = first; index < last; index++) {
      const frame = recording.frames[index];
      const value = frame.indices[metric];
      if (!Number.isFinite(value)) {
        connected = false;
        continue;
      }
      const x =
        LEFT +
        ((frame.time - range.start) / (range.end - range.start)) *
          (RIGHT - LEFT);
      const y = bottom - (value / 100) * (bottom - TOP);
      connected ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      connected = true;
    }
    ctx.stroke();
  }
  cursor(ctx, position, range, bottom);
}
