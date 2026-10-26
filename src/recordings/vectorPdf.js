import { ExportError } from "./export.js";

const encoder = new TextEncoder();
const n = (value) => {
  if (!Number.isFinite(value)) throw new ExportError("EXPORT_FAILED");
  return String(Math.round(value * 1000) / 1000);
};
const WINDOWS = new Map([
  [0x20ac, 128],
  [0x201a, 130],
  [0x0192, 131],
  [0x201e, 132],
  [0x2026, 133],
  [0x2020, 134],
  [0x2021, 135],
  [0x02c6, 136],
  [0x2030, 137],
  [0x0160, 138],
  [0x2039, 139],
  [0x0152, 140],
  [0x017d, 142],
  [0x2018, 145],
  [0x2019, 146],
  [0x201c, 147],
  [0x201d, 148],
  [0x2022, 149],
  [0x2013, 150],
  [0x2014, 151],
  [0x02dc, 152],
  [0x2122, 153],
  [0x0161, 154],
  [0x203a, 155],
  [0x0153, 156],
  [0x017e, 158],
  [0x0178, 159],
]);

/** Literal WinAnsi text keeps FR/DE labels, µ and ² selectable in the PDF. */
export function encodePdfText(value) {
  const normalized = String(value).replaceAll("→", "->").replaceAll("−", "-");
  let result = "(";
  for (const character of normalized) {
    const code = character.codePointAt(0);
    const byte = WINDOWS.get(code) ?? (code >= 32 && code <= 255 ? code : 63);
    if (byte === 40 || byte === 41 || byte === 92)
      result += `\\${String.fromCharCode(byte)}`;
    else if (byte > 126) result += `\\${byte.toString(8).padStart(3, "0")}`;
    else result += String.fromCharCode(byte);
  }
  return `${result})`;
}

function color(value) {
  if (!value || value === "none" || value === "transparent") return null;
  if (value === "white") value = "#ffffff";
  if (value === "black") value = "#000000";
  if (value.startsWith("#")) {
    let hex = value.slice(1);
    if (hex.length === 3 || hex.length === 4)
      hex = [...hex].map((item) => item + item).join("");
    if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex))
      throw new ExportError("EXPORT_FAILED");
    return [0, 2, 4]
      .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
      .concat(hex.length === 8 ? parseInt(hex.slice(6), 16) / 255 : 1);
  }
  const rgb = /^rgba?\(([^)]+)\)$/.exec(value);
  if (rgb) {
    const values = rgb[1].split(/[,\s]+/).map(Number);
    if (values.length < 3 || values.some((item) => !Number.isFinite(item)))
      throw new ExportError("EXPORT_FAILED");
    return values
      .slice(0, 3)
      .map((item) => item / 255)
      .concat(values[3] ?? 1);
  }
  throw new ExportError("EXPORT_FAILED");
}

const attrNumber = (element, name, fallback = 0) => {
  const raw = element.getAttribute(name);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new ExportError("EXPORT_FAILED");
  return value;
};
const children = (element) => Array.from(element.children || []);
const tag = (element) => element.localName?.toLowerCase();

function rectangle(element) {
  const x = attrNumber(element, "x");
  const y = attrNumber(element, "y");
  const width = attrNumber(element, "width");
  const height = attrNumber(element, "height");
  const rx = Math.min(Math.max(0, attrNumber(element, "rx")), width / 2);
  const ry = Math.min(Math.max(0, attrNumber(element, "ry", rx)), height / 2);
  if (!rx || !ry) return `${n(x)} ${n(y)} ${n(width)} ${n(height)} re\n`;
  const k = 0.5522847498;
  return [
    `${n(x + rx)} ${n(y)} m`,
    `${n(x + width - rx)} ${n(y)} l`,
    `${n(x + width - rx + rx * k)} ${n(y)} ${n(x + width)} ${n(y + ry - ry * k)} ${n(x + width)} ${n(y + ry)} c`,
    `${n(x + width)} ${n(y + height - ry)} l`,
    `${n(x + width)} ${n(y + height - ry + ry * k)} ${n(x + width - rx + rx * k)} ${n(y + height)} ${n(x + width - rx)} ${n(y + height)} c`,
    `${n(x + rx)} ${n(y + height)} l`,
    `${n(x + rx - rx * k)} ${n(y + height)} ${n(x)} ${n(y + height - ry + ry * k)} ${n(x)} ${n(y + height - ry)} c`,
    `${n(x)} ${n(y + ry)} l`,
    `${n(x)} ${n(y + ry - ry * k)} ${n(x + rx - rx * k)} ${n(y)} ${n(x + rx)} ${n(y)} c`,
    "h\n",
  ].join("\n");
}

function pathCommands(raw) {
  const tokens =
    raw.match(/[MLZmlz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi) || [];
  if (
    raw.replace(
      /[MLZmlz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?|[\s,]/gi,
      "",
    )
  )
    throw new ExportError("EXPORT_FAILED");
  let result = "";
  let command = null;
  let x = 0;
  let y = 0;
  for (let index = 0; index < tokens.length; ) {
    if (/^[MLZ]$/i.test(tokens[index])) {
      command = tokens[index++];
      if (command.toUpperCase() === "Z") {
        result += "h\n";
        command = null;
        continue;
      }
    }
    if (
      !command ||
      index + 1 >= tokens.length ||
      /^[MLZ]$/i.test(tokens[index]) ||
      /^[MLZ]$/i.test(tokens[index + 1])
    )
      throw new ExportError("EXPORT_FAILED");
    const relative = command === command.toLowerCase();
    x = Number(tokens[index++]) + (relative ? x : 0);
    y = Number(tokens[index++]) + (relative ? y : 0);
    result += `${n(x)} ${n(y)} ${command.toUpperCase() === "M" ? "m" : "l"}\n`;
    if (command.toUpperCase() === "M") command = relative ? "l" : "L";
  }
  return result;
}

function shape(element) {
  if (tag(element) === "rect") return rectangle(element);
  if (tag(element) === "line")
    return `${n(attrNumber(element, "x1"))} ${n(attrNumber(element, "y1"))} m\n${n(attrNumber(element, "x2"))} ${n(attrNumber(element, "y2"))} l\n`;
  if (tag(element) === "path")
    return pathCommands(element.getAttribute("d") || "");
  throw new ExportError("EXPORT_FAILED");
}

async function jpegImage(element, document) {
  const source =
    element.getAttribute("href") || element.getAttribute("xlink:href");
  if (!/^data:image\/(png|jpeg);base64,/i.test(source || ""))
    throw new ExportError("EXPORT_FAILED");
  const ImageConstructor = document?.defaultView?.Image || globalThis.Image;
  if (!ImageConstructor || !document?.createElement)
    throw new ExportError("EXPORT_FAILED");
  const image = new ImageConstructor();
  if (typeof image.decode === "function") {
    image.src = source;
    await image.decode();
  } else
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = source;
    });
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  if (!canvas.width || !canvas.height) throw new ExportError("EXPORT_FAILED");
  const context = canvas.getContext("2d");
  context.fillStyle = "#030a0d";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.98),
  );
  if (!blob || blob.type !== "image/jpeg")
    throw new ExportError("EXPORT_FAILED");
  return {
    width: canvas.width,
    height: canvas.height,
    bytes: new Uint8Array(await blob.arrayBuffer()),
  };
}

function assemblePdf(content, images, states) {
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const contentBytes = encoder.encode(content);
  const parts = [
    encoder.encode("%PDF-1.4\n"),
    new Uint8Array([37, 226, 227, 207, 211, 10]),
  ];
  const offsets = [0];
  let size = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const append = (part) => {
    const bytes = typeof part === "string" ? encoder.encode(part) : part;
    parts.push(bytes);
    size += bytes.byteLength;
  };
  const object = (id, values) => {
    offsets[id] = size;
    append(`${id} 0 obj\n`);
    values.forEach(append);
    append("\nendobj\n");
  };
  const imageStart = 7;
  const stateStart = imageStart + images.length;
  object(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  object(2, ["<< /Type /Pages /Kids [3 0 R] /Count 1 >>"]);
  const imageResources = images
    .map((_, index) => `/Im${index} ${imageStart + index} 0 R`)
    .join(" ");
  const stateResources = states
    .map((_, index) => `/GS${index} ${stateStart + index} 0 R`)
    .join(" ");
  object(3, [
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> /XObject << ${imageResources} >> /ExtGState << ${stateResources} >> >> /Contents 6 0 R >>`,
  ]);
  object(4, [
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ]);
  object(5, [
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ]);
  object(6, [
    `<< /Length ${contentBytes.byteLength} >>\nstream\n`,
    contentBytes,
    "endstream",
  ]);
  images.forEach((image, index) =>
    object(imageStart + index, [
      `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.byteLength} >>\nstream\n`,
      image.bytes,
      "\nendstream",
    ]),
  );
  states.forEach(([fill, stroke], index) =>
    object(stateStart + index, [
      `<< /Type /ExtGState /ca ${n(fill)} /CA ${n(stroke)} >>`,
    ]),
  );
  const xref = size;
  const count = offsets.length;
  append(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let id = 1; id < count; id++)
    append(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  append(
    `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`,
  );
  return new Blob(parts, { type: "application/pdf" });
}

/** Vector writer for RecordingBlockView's deliberately limited SVG vocabulary. */
export async function svgToPdf(svgElement) {
  if (tag(svgElement) !== "svg") throw new ExportError("EXPORT_FAILED");
  const viewBox = (svgElement.getAttribute("viewBox") || "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const width = viewBox[2] || attrNumber(svgElement, "width");
  const height = viewBox[3] || attrNumber(svgElement, "height");
  if (![width, height].every((value) => Number.isFinite(value) && value > 0))
    throw new ExportError("EXPORT_FAILED");
  const ids = new Map(
    Array.from(svgElement.querySelectorAll("[id]")).map((element) => [
      element.getAttribute("id"),
      element,
    ]),
  );
  const document = svgElement.ownerDocument || globalThis.document;
  const measure = document?.createElement?.("canvas")?.getContext?.("2d");
  const images = [];
  const states = [];
  const scale = Math.min((841.89 - 36) / width, (595.28 - 36) / height);
  const output = [
    `q\n${n(scale)} 0 0 ${n(-scale)} ${n((841.89 - width * scale) / 2)} ${n((595.28 + height * scale) / 2)} cm\n`,
  ];
  const emit = (text) => output.push(text);
  const alpha = (fill, stroke) => {
    const key = `${fill}:${stroke}`;
    let index = states.findIndex((item) => `${item[0]}:${item[1]}` === key);
    if (index < 0) {
      index = states.length;
      states.push([fill, stroke]);
    }
    emit(`/GS${index} gs\n`);
  };
  const setPaint = (style) => {
    const fill = style.fill?.startsWith("url(") ? null : color(style.fill);
    const stroke = color(style.stroke);
    if (fill) emit(`${fill.slice(0, 3).map(n).join(" ")} rg\n`);
    if (stroke)
      emit(
        `${stroke.slice(0, 3).map(n).join(" ")} RG\n${n(Number(style["stroke-width"]))} w\n`,
      );
    alpha((fill?.[3] ?? 1) * style.opacity, (stroke?.[3] ?? 1) * style.opacity);
    const dash = style["stroke-dasharray"];
    if (dash && dash !== "none")
      emit(
        `[${dash
          .split(/[,\s]+/)
          .filter(Boolean)
          .map(Number)
          .map(n)
          .join(" ")}] 0 d\n`,
      );
    return { fill, stroke };
  };
  const drawGradient = (element, reference, style) => {
    const gradient = ids.get(reference);
    if (tag(gradient) !== "lineargradient" || tag(element) !== "rect")
      throw new ExportError("EXPORT_FAILED");
    const stops = children(gradient)
      .map((stop) => {
        const offset = stop.getAttribute("offset") || "0";
        return {
          at:
            Number(offset.replace("%", "")) / (offset.includes("%") ? 100 : 1),
          color: color(stop.getAttribute("stop-color")),
        };
      })
      .sort((a, b) => a.at - b.at);
    if (
      !stops.length ||
      stops.some((stop) => !stop.color || !Number.isFinite(stop.at))
    )
      throw new ExportError("EXPORT_FAILED");
    const x = attrNumber(element, "x"),
      y = attrNumber(element, "y"),
      w = attrNumber(element, "width"),
      h = attrNumber(element, "height");
    const reversed =
      attrNumber(gradient, "y1", 0) > attrNumber(gradient, "y2", 1);
    emit("q\n" + rectangle(element) + "W n\n");
    for (let step = 0; step < 128; step++) {
      const fraction = (step + 0.5) / 128;
      const at = reversed ? 1 - fraction : fraction;
      let right = stops.findIndex((stop) => stop.at >= at);
      if (right < 0) right = stops.length - 1;
      const a = stops[Math.max(0, right - 1)],
        b = stops[right];
      const mix =
        a.at === b.at
          ? 0
          : Math.max(0, Math.min(1, (at - a.at) / (b.at - a.at)));
      const rgb = a.color
        .slice(0, 3)
        .map((item, index) => item + (b.color[index] - item) * mix);
      emit(
        `${rgb.map(n).join(" ")} rg\n${n(x)} ${n(y + (h * step) / 128)} ${n(w)} ${n(h / 128 + 0.01)} re f\n`,
      );
    }
    emit("Q\n");
    if (style.stroke !== "none") {
      setPaint({ ...style, fill: "none" });
      emit(rectangle(element) + "S\n");
    }
  };
  const inheritedKeys = [
    "fill",
    "stroke",
    "stroke-width",
    "stroke-dasharray",
    "font-size",
    "font-weight",
    "text-anchor",
    "dominant-baseline",
  ];
  const visit = async (element, parent, root = false) => {
    const name = tag(element);
    if (["defs", "title", "desc"].includes(name)) return;
    if (!["svg", "g", "rect", "line", "path", "text", "image"].includes(name))
      throw new ExportError("EXPORT_FAILED");
    if (element.getAttribute("transform"))
      throw new ExportError("EXPORT_FAILED");
    const style = { ...parent };
    for (const key of inheritedKeys)
      style[key] = element.getAttribute(key) ?? parent[key];
    style.opacity = parent.opacity * attrNumber(element, "opacity", 1);
    emit("q\n");
    if (name === "svg") {
      const box = (element.getAttribute("viewBox") || "")
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      const w = root ? width : attrNumber(element, "width"),
        h = root ? height : attrNumber(element, "height");
      const x = root ? 0 : attrNumber(element, "x"),
        y = root ? 0 : attrNumber(element, "y");
      emit(`${n(x)} ${n(y)} ${n(w)} ${n(h)} re W n\n`);
      if (box.length === 4 && box[2] > 0 && box[3] > 0) {
        const preserve =
          element.getAttribute("preserveAspectRatio") || "xMidYMid meet";
        let sx = w / box[2],
          sy = h / box[3];
        if (preserve !== "none") {
          if (preserve !== "xMidYMid meet")
            throw new ExportError("EXPORT_FAILED");
          sx = sy = Math.min(sx, sy);
        }
        emit(
          `${n(sx)} 0 0 ${n(sy)} ${n(x + (w - box[2] * sx) / 2 - box[0] * sx)} ${n(y + (h - box[3] * sy) / 2 - box[1] * sy)} cm\n`,
        );
      } else emit(`1 0 0 1 ${n(x)} ${n(y)} cm\n`);
    }
    const clip = /url\(#([^)]+)\)/.exec(
      element.getAttribute("clip-path") || "",
    );
    if (clip) {
      const definition = ids.get(clip[1]);
      if (tag(definition) !== "clippath")
        throw new ExportError("EXPORT_FAILED");
      for (const item of children(definition)) emit(shape(item));
      emit("W n\n");
    }
    if (name === "svg" || name === "g") {
      for (const child of children(element)) await visit(child, style);
    } else if (name === "image") {
      const image = await jpegImage(element, document);
      const index = images.length;
      images.push(image);
      alpha(style.opacity, style.opacity);
      emit(
        `${n(attrNumber(element, "width"))} 0 0 ${n(-attrNumber(element, "height"))} ${n(attrNumber(element, "x"))} ${n(attrNumber(element, "y") + attrNumber(element, "height"))} cm\n/Im${index} Do\n`,
      );
    } else if (name === "text") {
      const text = element.textContent || "";
      const size = Number(style["font-size"]);
      const bold =
        Number(style["font-weight"]) >= 600 || style["font-weight"] === "bold";
      let x = attrNumber(element, "x"),
        y = attrNumber(element, "y");
      if (measure) measure.font = `${bold ? "bold " : ""}${size}px Arial`;
      const textWidth =
        measure?.measureText(text).width ?? text.length * size * 0.5;
      if (style["text-anchor"] === "middle") x -= textWidth / 2;
      if (style["text-anchor"] === "end") x -= textWidth;
      if (style["dominant-baseline"] === "middle") y += size * 0.35;
      const { fill } = setPaint(style);
      if (fill && text)
        emit(
          `BT\n/${bold ? "F2" : "F1"} ${n(size)} Tf\n1 0 0 -1 ${n(x)} ${n(y)} Tm\n${encodePdfText(text)} Tj\nET\n`,
        );
    } else {
      const gradient = /url\(#([^)]+)\)/.exec(style.fill || "");
      if (gradient) drawGradient(element, gradient[1], style);
      else {
        const { fill, stroke } = setPaint(style);
        emit(shape(element));
        emit(fill && stroke ? "B\n" : fill ? "f\n" : stroke ? "S\n" : "n\n");
      }
    }
    emit("Q\n");
  };
  await visit(
    svgElement,
    {
      fill: "#000000",
      stroke: "none",
      "stroke-width": "1",
      "font-size": "16",
      "font-weight": "400",
      "text-anchor": "start",
      "dominant-baseline": "auto",
      opacity: 1,
    },
    true,
  );
  emit("Q\n");
  return assemblePdf(output.join(""), images, states);
}
