import { dsaDbToRgb } from "../simulation/engine.js";
import { formatPosition, getViewRange } from "./playback.js";
import { drawDsa, drawEeg, drawTrends } from "./rendering.js";

const SIZES = {
  blocks: { width: 1600, height: 1200 },
  "conox-frame": { width: 1600, height: 1120 },
  "conox-screen": { width: 1600, height: 900 },
  "simulator-frame": { width: 1600, height: 1120 },
  "simulator-screen": { width: 1600, height: 900 },
};
const COLORS = {
  qcon: "#70ec8f",
  qnox: "#ffdb67",
  bsr: "#ff8d94",
  sqi: "#70ec8f",
  emg: "#76c9ff",
};
const SURFACES = new WeakMap();

export function getPresentationSize(layout = "blocks") {
  if (!Object.hasOwn(SIZES, layout))
    throw new RangeError(`Unknown presentation layout: ${layout}`);
  return { ...SIZES[layout] };
}

/** Same-origin assets keep the shared preview/export canvas readable. */
export async function loadPresentationAssets(baseUrl = "./") {
  const root = new URL(baseUrl, document.baseURI);
  const load = (path) =>
    new Promise((resolve) => {
      const url = new URL(path, root);
      if (url.origin !== new URL(document.baseURI).origin) {
        resolve(null);
        return;
      }
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = url.href;
    });
  const [logo, wordmark] = await Promise.all([
    load("images/fresenius-kabi-logo.png"),
    load("images/conox-wordmark.png"),
  ]);
  return { logo, wordmark };
}

function surfaces(canvas) {
  if (!SURFACES.has(canvas)) {
    const owner = canvas.ownerDocument || document;
    const make = (height) => {
      const result = owner.createElement("canvas");
      result.width = 1200;
      result.height = height;
      return result;
    };
    SURFACES.set(canvas, {
      eeg: make(240),
      dsa: make(280),
      trends: make(190),
    });
  }
  return SURFACES.get(canvas);
}

function box(ctx, x, y, width, height, fill, border, radius = 0) {
  ctx.beginPath();
  if (radius) ctx.roundRect(x, y, width, height, radius);
  else ctx.rect(x, y, width, height);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function text(ctx, value, x, y, size = 20, color = "#d8e7ed", options = {}) {
  ctx.font = `${options.bold ? "700" : "400"} ${size}px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = options.align || "left";
  ctx.textBaseline = "middle";
  if (options.width) ctx.fillText(String(value), x, y, options.width);
  else ctx.fillText(String(value), x, y);
}

function fitImage(ctx, image, x, y, width, height) {
  if (!image) return false;
  const scale = Math.min(
    width / (image.naturalWidth || image.width),
    height / (image.naturalHeight || image.height),
  );
  const w = (image.naturalWidth || image.width) * scale;
  const h = (image.naturalHeight || image.height) * scale;
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
  return true;
}

function indexValue(indices, key) {
  return Number.isFinite(indices?.[key]) ? String(indices[key]) : "--";
}

function currentIndices(recording, position) {
  // The last sample belongs to the preceding 250-ms frame, including at EOF.
  let low = 0;
  let high = recording.frames.length - 1;
  while (low <= high) {
    const middle = (low + high) >>> 1;
    if (recording.frames[middle].time <= position) low = middle + 1;
    else high = middle - 1;
  }
  return recording.frames[Math.max(0, high)]?.indices;
}

function legend(ctx, x, y, size = 17) {
  for (const [index, key] of ["qcon", "qnox", "bsr", "emg"].entries()) {
    const label = { qcon: "qCON", qnox: "qNOX", bsr: "BSR", emg: "EMG" }[key];
    const left = x + index * size * 5.8;
    box(ctx, left, y - 2, size * 1.1, 3, COLORS[key]);
    text(ctx, label, left + size * 1.5, y, size, COLORS[key]);
  }
}

function colorScale(ctx, x, y, width, height, offset, fontSize = 17) {
  const barWidth = width * 0.34;
  const gradient = ctx.createLinearGradient(0, y + height, 0, y);
  for (let step = 0; step <= 40; step++) {
    const [r, g, b] = dsaDbToRgb(-30 + step * 2);
    gradient.addColorStop(step / 40, `rgb(${r},${g},${b})`);
  }
  box(ctx, x, y, barWidth, height, gradient, "#6a7a84");
  for (let step = 0; step <= 4; step++) {
    const value = 50 - step * 20 - offset;
    text(ctx, value, x + barWidth + 7, y + (step / 4) * height, fontSize);
  }
}

function chart(ctx, image, x, y, width, height) {
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(image, x, y, width, height);
  ctx.restore();
}

function blockView(ctx, state) {
  const { t, position, recording, indices, images, settings } = state;
  text(ctx, t("recording.title"), 42, 46, 31, "#f1f7fa", { bold: true });
  text(
    ctx,
    `${formatPosition(position, true)} / ${formatPosition(recording.durationSeconds)}`,
    1558,
    46,
    27,
    "#e7f5fc",
    { align: "right" },
  );
  text(ctx, t("recording.experimentalShort"), 42, 89, 20, "#f3c981", {
    width: 1516,
  });

  box(ctx, 42, 124, 1516, 134, "#02090d", "#3f5866", 9);
  text(ctx, t("recording.indices"), 64, 151, 19, "#b6c8d1");
  for (const [index, [label, key]] of [
    ["qCON", "qcon"],
    ["qNOX", "qnox"],
    ["BSR", "bsr"],
    ["SQI", "sqi"],
    ["EMG", "emg"],
  ].entries()) {
    const x = 68 + index * 301;
    text(ctx, label, x, 205, 25, COLORS[key], { bold: true });
    text(ctx, indexValue(indices, key), x + 194, 205, 45, COLORS[key], {
      bold: true,
      align: "right",
    });
  }

  box(ctx, 42, 278, 1516, 261, "#030a0d", "#3f5866", 9);
  text(ctx, t("recording.eeg"), 64, 304, 20, "#dceaf0", { bold: true });
  text(
    ctx,
    `${settings.eegWindow} s · ±${settings.amplitude} µV*`,
    1534,
    304,
    19,
    "#b6c8d1",
    {
      align: "right",
    },
  );
  chart(ctx, images.eeg, 57, 329, 1486, 201);

  box(ctx, 42, 559, 1516, 328, "#030a0d", "#3f5866", 9);
  text(ctx, t("recording.dsa"), 64, 586, 20, "#dceaf0", { bold: true });
  text(ctx, "dB / µV²/Hz", 1540, 586, 17, "#b6c8d1", { align: "right" });
  chart(ctx, images.dsa, 57, 613, 1372, 257);
  colorScale(
    ctx,
    1444,
    613 + (257 * 26) / 280,
    92,
    (257 * 222) / 280,
    settings.colorOffset,
    17,
  );
  sefLegend(ctx, settings, 900, 586, 17);

  box(ctx, 42, 907, 1516, 232, "#030a0d", "#3f5866", 9);
  text(ctx, t("recording.trends"), 64, 934, 20, "#dceaf0", { bold: true });
  legend(ctx, 1030, 934, 17);
  chart(ctx, images.trends, 57, 958, 1486, 172);
  text(ctx, t("recording.dsaMethod"), 42, 1170, 17, "#95acb9", { width: 1516 });
}

function sefLegend(ctx, settings, x, y, size) {
  for (const [index, [enabled, label, color]] of [
    [settings.sef50, "SEF50", "#ffffff"],
    [settings.sef95, "SEF95", "#ffacdf"],
  ].entries()) {
    if (!enabled) continue;
    const left = x + index * size * 7;
    box(ctx, left, y - 2, size * 1.2, 3, color);
    text(ctx, label, left + size * 1.6, y, size, color);
  }
}

function monitorFace(ctx, state, x, y, width, height) {
  const { t, recording, position, indices, images, settings } = state;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(width / 1600, height / 900);
  box(ctx, 0, 0, 1600, 900, "#071118", "#69767c");

  // The same upper metric strip and right-hand qCON panel as the simulator.
  for (const [index, [label, key]] of [
    ["SQI", "sqi"],
    ["EMG", "emg"],
    ["BSR", "bsr"],
    ["qNOX", "qnox"],
  ].entries()) {
    const left = index * 280;
    box(ctx, left, 0, 280, 137, "#010506", "#829098");
    box(ctx, left, 0, 280, 46, COLORS[key]);
    text(ctx, label, left + 140, 25, 29, "#071015", {
      bold: true,
      align: "center",
    });
    text(ctx, indexValue(indices, key), left + 140, 94, 66, COLORS[key], {
      bold: true,
      align: "center",
    });
  }

  box(ctx, 1130, 0, 470, 465, "#010506", "#829098");
  text(ctx, "qCON", 1365, 65, 53, "#dce6ed", { bold: true, align: "center" });
  text(ctx, indexValue(indices, "qcon"), 1365, 225, 206, "#f6f8f8", {
    bold: true,
    align: "center",
  });
  text(ctx, t("recording.position"), 1365, 362, 24, "#92acbb", {
    align: "center",
    width: 430,
  });
  text(ctx, formatPosition(position, true), 1365, 412, 42, "#f1f7fa", {
    align: "center",
  });
  box(ctx, 1130, 477, 470, 339, "#061017", "#69767c");
  text(ctx, t("recording.title"), 1365, 516, 27, "#eef6fa", {
    bold: true,
    align: "center",
    width: 426,
  });
  text(
    ctx,
    `${t("recording.duration")} ${formatPosition(recording.durationSeconds)}`,
    1365,
    563,
    24,
    "#a9c1ce",
    {
      align: "center",
      width: 426,
    },
  );
  text(
    ctx,
    `${settings.eegWindow} s · ±${settings.amplitude} µV*`,
    1365,
    614,
    26,
    "#d4e5ee",
    { align: "center" },
  );
  text(ctx, "0.5 - 45 Hz", 1365, 652, 24, "#a9c1ce", { align: "center" });
  sefLegend(ctx, settings, 1188, 712, 22);
  legend(ctx, 1172, 767, 17);

  for (const [top, height, caption, image] of [
    [146, 193, "EEG", images.eeg],
    [347, 248, "DSA", images.dsa],
    [603, 213, t("recording.trends"), images.trends],
  ]) {
    box(ctx, 0, top, 1120, height, "#030a0d", "#7d8a91");
    const gradient = ctx.createLinearGradient(0, top, 0, top + 35);
    gradient.addColorStop(0, "#425b68");
    gradient.addColorStop(1, "#20323c");
    box(ctx, 1, top + 1, 1118, 35, gradient);
    text(ctx, caption, 16, top + 19, 23, "#f2f7fa", { bold: true });
    if (caption === "EEG") {
      text(
        ctx,
        `${settings.eegWindow} s · ±${settings.amplitude} µV*`,
        1098,
        top + 19,
        19,
        "#d0dce3",
        { align: "right" },
      );
    }
    if (caption === "DSA") {
      text(ctx, "dB / µV²/Hz", 1098, top + 19, 19, "#d0dce3", {
        align: "right",
      });
      chart(ctx, image, 3, top + 39, 1012, height - 43);
      // Source DSA chart plot runs from y=26 to y=248 on its 280px surface.
      const plotTop = top + 39 + ((height - 43) * 26) / 280;
      const plotHeight = ((height - 43) * 222) / 280;
      colorScale(ctx, 1033, plotTop, 70, plotHeight, settings.colorOffset, 16);
    } else {
      chart(ctx, image, 3, top + 39, 1114, height - 43);
    }
  }

  const footer = ctx.createLinearGradient(0, 828, 0, 900);
  footer.addColorStop(0, "#5c717e");
  footer.addColorStop(1, "#2c414f");
  box(ctx, 0, 828, 1600, 72, footer, "#718693");
  text(ctx, t("recording.experimentalShort"), 22, 865, 25, "#ffe2af", {
    width: 1548,
  });
  ctx.restore();
}

function deviceFrame(ctx, state) {
  const { assets, t } = state;
  // Proportions follow .sb-monitor-wrap and .sb-monitor-scroll in the simulator.
  const gradient = ctx.createRadialGradient(760, 330, 30, 800, 560, 950);
  gradient.addColorStop(0, "#101719");
  gradient.addColorStop(0.5, "#030607");
  gradient.addColorStop(1, "#000000");
  box(ctx, 6, 6, 1588, 1108, gradient, "#d8dcde", 140);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#60686c";
  ctx.stroke();
  box(ctx, 16, 16, 1568, 1088, null, "#050708", 131);

  if (!fitImage(ctx, assets?.logo, 1208, 63, 248, 99)) {
    text(ctx, "FRESENIUS", 1456, 94, 26, "#ffffff", {
      bold: true,
      align: "right",
    });
    text(ctx, "KABI", 1456, 126, 26, "#ffffff", { bold: true, align: "right" });
  }
  box(ctx, 142, 65, 284, 99, "#0e171d", "#66757d", 10);
  text(ctx, t("recording.title"), 284, 100, 22, "#e4eef4", {
    bold: true,
    align: "center",
    width: 252,
  });
  text(ctx, formatPosition(state.position, true), 284, 136, 25, "#8fd5f3", {
    align: "center",
  });

  // A static power symbol and blue LED mirror the device shell.
  ctx.strokeStyle = "#8ca2ad";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(77, 102, 19, -Math.PI * 0.32, Math.PI * 1.32);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(77, 78);
  ctx.lineTo(77, 101);
  ctx.stroke();
  ctx.save();
  ctx.shadowColor = "#1088df";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#19aaff";
  ctx.beginPath();
  ctx.arc(55, 672, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  box(ctx, 190, 189, 1218, 714, "#000000", "#69767c", 6);
  monitorFace(ctx, state, 196, 195, 1206, 702);
  if (!fitImage(ctx, assets?.wordmark, 648, 980, 304, 75)) {
    text(ctx, "CONOX", 800, 1017, 65, "#f1f3f4", { align: "center" });
  }
}

/** Draws the exact same composition for the player, images, PDF and video. */
export function renderPresentation(
  canvas,
  {
    data,
    dsaImage,
    position = 0,
    settings = {},
    layout = "blocks",
    t,
    assets = {},
  },
) {
  const size = getPresentationSize(layout);
  if (canvas.width !== size.width) canvas.width = size.width;
  if (canvas.height !== size.height) canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, size.width, size.height);
  box(ctx, 0, 0, size.width, size.height, "#071118");
  if (!data) return;
  const normalized = {
    eegWindow: 8,
    amplitude: 120,
    dsaWindow: 0,
    guides: true,
    sef50: false,
    sef95: false,
    colorOffset: 0,
    ...settings,
  };
  const { recording, filtered, spectrum } = data;
  const time = Math.min(recording.durationSeconds, Math.max(0, position));
  const images = surfaces(canvas);
  const overview = getViewRange(
    time,
    recording.durationSeconds,
    normalized.dsaWindow || recording.durationSeconds,
  );
  drawEeg(
    images.eeg,
    filtered,
    recording.sampleRate,
    time,
    getViewRange(time, recording.durationSeconds, normalized.eegWindow),
    normalized.amplitude,
    normalized.guides,
  );
  drawDsa(
    images.dsa,
    dsaImage,
    spectrum,
    time,
    overview,
    normalized.guides,
    normalized.sef50,
    normalized.sef95,
  );
  drawTrends(images.trends, recording, time, overview, normalized.guides);
  const translate = (key) => {
    const value = t?.(key);
    if (value && value !== key) return value;
    return key === "recording.experimentalShort"
      ? "Experimental replay · indices and µV provisional"
      : key;
  };
  const state = {
    t: translate,
    position: time,
    recording,
    indices: currentIndices(recording, time),
    images,
    settings: normalized,
    assets,
  };
  if (layout === "blocks") blockView(ctx, state);
  else if (layout === "conox-frame") deviceFrame(ctx, state);
  else monitorFace(ctx, state, 0, 0, size.width, size.height);
}
