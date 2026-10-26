import { ExportError } from "./export.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const XHTML_NS = "http://www.w3.org/1999/xhtml";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const IMAGE_DATA = /^data:image\/(?:png|jpe?g|gif|webp|avif|svg\+xml)(?:;|,)/i;
const OMITTED_TAGS = new Set([
  "script",
  "style",
  "link",
  "iframe",
  "object",
  "embed",
]);
const assetCaches = new WeakMap();

function checkAbort(signal) {
  if (signal?.aborted) throw new ExportError("EXPORT_ABORTED");
}

function toDataUrl(bytes, mime, view) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return `data:${mime};base64,${view.btoa(binary)}`;
}

async function imageDataUrl(value, context) {
  checkAbort(context.signal);
  if (IMAGE_DATA.test(value)) return value;
  const url = new URL(value, context.document.baseURI);
  const origin = new URL(context.document.baseURI).origin;
  if (
    url.origin !== origin ||
    !["http:", "https:", "blob:"].includes(url.protocol)
  ) {
    throw new Error("Only same-origin export images are supported");
  }
  if (context.assets.has(url.href)) return context.assets.get(url.href);
  const response = await context.view.fetch(url.href, {
    credentials: "same-origin",
    mode: "same-origin",
    redirect: "error",
    signal: context.signal,
  });
  if (!response.ok) throw new Error("Could not load an export image");
  const blob = await response.blob();
  if (!IMAGE_DATA.test(`data:${blob.type},`)) {
    throw new Error("Unsupported export image type");
  }
  const data = toDataUrl(
    new Uint8Array(await blob.arrayBuffer()),
    blob.type,
    context.view,
  );
  checkAbort(context.signal);
  context.assets.set(url.href, data);
  return data;
}

async function inlineCssUrls(value, context) {
  const urls = [
    ...value.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/g),
  ];
  let result = value;
  for (const match of urls) {
    const source = (match[1] ?? match[2] ?? match[3]).trim();
    let embedded = source;
    if (!source.startsWith("#")) {
      const url = new URL(source, context.document.baseURI);
      const page = new URL(context.document.baseURI);
      if (
        url.hash &&
        url.origin === page.origin &&
        url.pathname === page.pathname &&
        url.search === page.search
      ) {
        embedded = url.hash;
      } else embedded = await imageDataUrl(source, context);
    }
    result = result.replace(match[0], `url("${embedded}")`);
  }
  return result;
}

async function copyComputedStyle(source, target, context, pseudo) {
  const signature = `${pseudo || ""}|${source.getAttribute("class")}|${source.getAttribute("style")}`;
  const cached = context.styles?.get(source)?.get(signature);
  if (cached) {
    target.style.cssText = cached;
    return;
  }
  const computed = context.view.getComputedStyle(source, pseudo);
  target.style.cssText = "";
  for (const property of computed) {
    // Standard computed properties already contain resolved variable values.
    // Avoid serializing unrelated custom properties inherited from the page.
    if (property.startsWith("--")) continue;
    // SVG geometry comes from the current frame's attributes, never a cached
    // computed path or coordinate from the first video frame.
    if (
      source.namespaceURI === SVG_NS &&
      ["d", "x", "y", "cx", "cy", "r", "rx", "ry", "transform"].includes(
        property,
      )
    )
      continue;
    if (
      source.namespaceURI === SVG_NS &&
      source.localName !== "svg" &&
      ["width", "height"].includes(property)
    )
      continue;
    let value = computed.getPropertyValue(property);
    if (value.includes("url(")) value = await inlineCssUrls(value, context);
    target.style.setProperty(property, value);
  }
  // A snapshot must stay fixed at the captured animation state.
  target.style.setProperty("animation", "none", "important");
  target.style.setProperty("transition", "none", "important");
  if (context.styles) {
    if (!context.styles.has(source)) context.styles.set(source, new Map());
    context.styles.get(source).set(signature, target.style.cssText);
  }
  return computed;
}

function pseudoText(content) {
  if (content === "none" || content === "normal" || !content) return null;
  if (!/^(["']).*\1$/.test(content)) {
    throw new Error("Unsupported generated export content");
  }
  return content
    .slice(1, -1)
    .replace(/\\([\da-f]{1,6})\s?|\\(.)/gi, (_, hex, char) =>
      hex ? String.fromCodePoint(parseInt(hex, 16) || 0xfffd) : char,
    );
}

async function clonePseudo(source, name, context) {
  const computed = context.view.getComputedStyle(source, name);
  const content = pseudoText(computed.content);
  if (content === null || computed.display === "none") return null;
  const clone = context.document.createElement("span");
  await copyComputedStyle(source, clone, context, name);
  clone.textContent = content;
  return clone;
}

async function cloneElement(source, context) {
  checkAbort(context.signal);
  if (source.nodeType !== 1) return source.cloneNode(false);
  const tag = source.localName.toLowerCase();
  if (OMITTED_TAGS.has(tag)) return null;
  const clone =
    tag === "canvas"
      ? context.document.createElement("img")
      : source.cloneNode(false);
  for (const attribute of [...clone.attributes]) {
    if (/^on/i.test(attribute.name)) clone.removeAttribute(attribute.name);
  }
  await copyComputedStyle(source, clone, context);
  if (tag === "img" || tag === "canvas") {
    const src =
      tag === "canvas"
        ? source.toDataURL("image/png")
        : await imageDataUrl(source.currentSrc || source.src, context);
    clone.removeAttribute("srcset");
    clone.removeAttribute("sizes");
    clone.removeAttribute("loading");
    clone.setAttribute("src", src);
    return clone;
  }
  if (tag === "image" || tag === "feimage" || tag === "use") {
    const href =
      source.getAttribute("href") || source.getAttributeNS(XLINK_NS, "href");
    if (href) {
      if (tag === "use" && !href.startsWith("#")) {
        throw new Error("External SVG references are not supported");
      }
      const embedded = tag === "use" ? href : await imageDataUrl(href, context);
      clone.removeAttributeNS(XLINK_NS, "href");
      clone.setAttribute("href", embedded);
    }
  }
  if (tag === "a") clone.removeAttribute("href");
  if (tag === "input") {
    clone.setAttribute("value", source.value);
    if (source.checked) clone.setAttribute("checked", "");
    else clone.removeAttribute("checked");
  }
  if (tag === "textarea") {
    clone.textContent = source.value;
    return clone;
  }
  if (tag === "option") {
    if (source.selected) clone.setAttribute("selected", "");
    else clone.removeAttribute("selected");
  }
  if (source.namespaceURI === XHTML_NS) {
    const before = await clonePseudo(source, "::before", context);
    if (before) clone.append(before);
  }
  const children = await Promise.all(
    [...source.childNodes].map((child) => cloneElement(child, context)),
  );
  for (const child of children) if (child) clone.append(child);
  if (source.namespaceURI === XHTML_NS) {
    const after = await clonePseudo(source, "::after", context);
    if (after) clone.append(after);
  }
  return clone;
}

function loadImage(src, context) {
  return new Promise((resolve, reject) => {
    checkAbort(context.signal);
    const image = new context.view.Image();
    const timeout = setTimeout(() => {
      clean();
      image.src = "";
      reject(new ExportError("EXPORT_FAILED"));
    }, 15000);
    const clean = () => {
      clearTimeout(timeout);
      image.onload = image.onerror = null;
      context.signal?.removeEventListener("abort", abort);
    };
    const abort = () => {
      clean();
      image.src = "";
      reject(new ExportError("EXPORT_ABORTED"));
    };
    image.onload = () => {
      clean();
      resolve(image);
    };
    image.onerror = () => {
      clean();
      reject(new ExportError("EXPORT_FAILED"));
    };
    context.signal?.addEventListener("abort", abort, { once: true });
    try {
      image.src = src;
    } catch (error) {
      clean();
      reject(error);
    }
  });
}

/**
 * Rasterize only this rendered subtree, including its resolved styles and plots.
 * Pass intrinsic dimensions when the surrounding preview is scaled. HTML capture
 * requires the browser's SVG foreignObject support; unsupported output rejects.
 */
export async function snapshotElementToCanvas(
  element,
  canvas,
  {
    width = element?.clientWidth,
    height = element?.clientHeight,
    signal,
    styleCache,
  } = {},
) {
  try {
    checkAbort(signal);
    if (
      element?.nodeType !== 1 ||
      !canvas?.getContext ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new Error("Invalid DOM export surface");
    }
    width = Math.round(width);
    height = Math.round(height);
    const document = element.ownerDocument;
    const view = document.defaultView;
    if (!assetCaches.has(document)) assetCaches.set(document, new Map());
    const context = {
      document,
      view,
      signal,
      assets: assetCaches.get(document),
      styles: styleCache,
    };
    const clone = await cloneElement(element, context);
    if (!clone) throw new Error("Unsupported DOM export root");
    clone.style.setProperty("width", `${width}px`);
    clone.style.setProperty("height", `${height}px`);
    clone.style.setProperty("position", "relative");
    clone.style.setProperty("margin", "0");
    clone.style.setProperty("inset", "auto");
    clone.style.setProperty("transform", "none");
    clone.style.setProperty("zoom", "1");
    const directSvg =
      element.namespaceURI === SVG_NS && element.localName === "svg";
    const svg = directSvg ? clone : document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    if (!svg.hasAttribute("viewBox")) {
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }
    if (!directSvg) {
      const foreignObject = document.createElementNS(SVG_NS, "foreignObject");
      foreignObject.setAttribute("width", "100%");
      foreignObject.setAttribute("height", "100%");
      foreignObject.append(clone);
      svg.append(foreignObject);
    }
    const markup = new view.XMLSerializer().serializeToString(svg);
    const image = await loadImage(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`,
      context,
    );
    checkAbort(signal);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Missing export canvas context");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    // Reading pixels also verifies that the canvas remains origin-clean for all
    // downstream image, PDF and video encoders.
    const middle = ctx.getImageData(width >> 1, height >> 1, 1, 1).data;
    if (!directSvg && !middle[3]) {
      const pixels = ctx.getImageData(0, 0, width, height).data;
      if (!pixels.some((value, index) => index % 4 === 3 && value > 0)) {
        throw new Error("This browser did not render the HTML export surface");
      }
    }
    return canvas;
  } catch (error) {
    if (signal?.aborted || error?.code === "EXPORT_ABORTED") {
      throw new ExportError("EXPORT_ABORTED", error);
    }
    if (error instanceof ExportError) throw error;
    throw new ExportError("EXPORT_FAILED", error);
  }
}
