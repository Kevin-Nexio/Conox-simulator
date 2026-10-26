import test from "node:test";
import assert from "node:assert/strict";
import { snapshotElementToCanvas } from "../src/recordings/domExport.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const HTML_NS = "http://www.w3.org/1999/xhtml";
const hasCode = (code) => (error) => {
  assert.equal(error.name, "ExportError");
  assert.equal(error.code, code);
  return true;
};

class Style {
  values = new Map();
  get cssText() {
    return [...this.values]
      .map(([name, value]) => `${name}: ${value};`)
      .join(" ");
  }
  set cssText(text) {
    this.values.clear();
    for (const declaration of String(text).split(";")) {
      const separator = declaration.indexOf(":");
      if (separator < 0) continue;
      this.values.set(
        declaration.slice(0, separator).trim(),
        declaration.slice(separator + 1).trim(),
      );
    }
  }
  setProperty(name, value) {
    this.values.set(name, String(value));
  }
}

class TextNode {
  nodeType = 3;
  constructor(text) {
    this.textContent = text;
  }
  cloneNode() {
    return new TextNode(this.textContent);
  }
}

class Element {
  nodeType = 1;
  attributes = [];
  childNodes = [];
  style = new Style();
  clientWidth = 1600;
  clientHeight = 900;
  constructor(document, tag, namespace = HTML_NS) {
    this.ownerDocument = document;
    this.localName = tag;
    this.namespaceURI = namespace;
  }
  cloneNode() {
    const clone = new Element(
      this.ownerDocument,
      this.localName,
      this.namespaceURI,
    );
    clone.attributes = this.attributes.map((attribute) => ({ ...attribute }));
    return clone;
  }
  append(...children) {
    this.childNodes.push(...children);
  }
  setAttribute(name, value) {
    this.removeAttribute(name);
    this.attributes.push({ name, value: String(value) });
  }
  getAttribute(name) {
    return this.attributes.find((attribute) => attribute.name === name)?.value;
  }
  getAttributeNS(_, name) {
    return this.getAttribute(name);
  }
  removeAttribute(name) {
    this.attributes = this.attributes.filter(
      (attribute) => attribute.name !== name,
    );
  }
  removeAttributeNS(_, name) {
    this.removeAttribute(name);
  }
  hasAttribute(name) {
    return this.getAttribute(name) !== undefined;
  }
}

function environment({
  deferredImage = false,
  transparent = false,
  tainted = false,
} = {}) {
  const createdImages = [];
  const serialized = [];
  const fetches = [];
  const styleReads = [];
  let draws = 0;
  const document = {
    baseURI: "https://example.test/Conox-simulator/",
    createElement: (name) => new Element(document, name),
    createElementNS: (namespace, name) =>
      new Element(document, name, namespace),
  };
  class Image {
    constructor() {
      createdImages.push(this);
    }
    set src(value) {
      this.url = value;
      if (!deferredImage && value) queueMicrotask(() => this.onload?.());
    }
  }
  document.defaultView = {
    Image,
    btoa,
    fetch: async (url, options) => {
      fetches.push({ url, options });
      return {
        ok: true,
        blob: async () => new Blob(["local-image"], { type: "image/png" }),
      };
    },
    getComputedStyle(source, pseudo) {
      styleReads.push({ source, pseudo });
      const values = pseudo
        ? { content: "none", display: "inline" }
        : { display: "block", color: "rgb(1, 2, 3)", ...source.computed };
      return {
        ...values,
        getPropertyValue: (name) => values[name],
        *[Symbol.iterator]() {
          yield* Object.keys(values);
        },
      };
    },
    XMLSerializer: class {
      serializeToString(root) {
        serialized.push(root);
        return "<svg xmlns='http://www.w3.org/2000/svg'/>";
      }
    },
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      setTransform() {},
      clearRect() {},
      drawImage() {
        draws++;
      },
      getImageData: () => {
        if (tainted) throw new DOMException("Tainted", "SecurityError");
        return {
          data: new Uint8ClampedArray([0, 0, 0, transparent ? 0 : 255]),
        };
      },
    }),
  };
  return {
    document,
    canvas,
    createdImages,
    serialized,
    fetches,
    styleReads,
    get draws() {
      return draws;
    },
  };
}

test("invalid surfaces and pre-cancelled exports reject before accessing the DOM", async () => {
  await assert.rejects(
    snapshotElementToCanvas(null, {}),
    hasCode("EXPORT_FAILED"),
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    snapshotElementToCanvas(null, {}, { signal: controller.signal }),
    hasCode("EXPORT_ABORTED"),
  );
});

test("SVG roots keep a direct vector source and requested intrinsic dimensions", async () => {
  const env = environment();
  const source = new Element(env.document, "svg", SVG_NS);
  source.setAttribute("viewBox", "0 0 800 600");
  const result = await snapshotElementToCanvas(source, env.canvas, {
    width: 1600,
    height: 1200,
  });
  assert.equal(result, env.canvas);
  assert.equal(env.canvas.width, 1600);
  assert.equal(env.canvas.height, 1200);
  assert.equal(env.serialized[0].localName, "svg");
  assert.equal(env.serialized[0].getAttribute("viewBox"), "0 0 800 600");
  assert.equal(env.serialized[0].childNodes.length, 0);
  assert.equal(env.draws, 1);
  assert.equal(source.attributes.length, 1);
});

test("HTML snapshots clone only their subtree and inline same-origin images once", async () => {
  const env = environment();
  const source = new Element(env.document, "div");
  const logo = new Element(env.document, "img");
  logo.src = "./images/logo.png";
  logo.setAttribute("srcset", "https://external.test/unwanted.png 2x");
  const script = new Element(env.document, "script");
  source.append(logo, script);
  await snapshotElementToCanvas(source, env.canvas);
  await snapshotElementToCanvas(source, env.canvas);
  assert.equal(env.fetches.length, 1);
  assert.equal(
    env.fetches[0].url,
    "https://example.test/Conox-simulator/images/logo.png",
  );
  assert.equal(env.fetches[0].options.redirect, "error");
  assert.equal(env.fetches[0].options.mode, "same-origin");
  const foreignObject = env.serialized[0].childNodes[0];
  assert.equal(foreignObject.localName, "foreignObject");
  const clone = foreignObject.childNodes[0];
  assert.equal(clone.childNodes.length, 1);
  assert.equal(clone.style.values.get("color"), "rgb(1, 2, 3)");
  assert.match(
    clone.childNodes[0].getAttribute("src"),
    /^data:image\/png;base64,/,
  );
  assert.equal(clone.childNodes[0].getAttribute("srcset"), undefined);
  assert.equal(source.childNodes.length, 2);
  assert.equal(source.style.values.size, 0);
});

test("cross-origin image and CSS resources reject without sending a request", async () => {
  for (const kind of ["img", "background"]) {
    const env = environment();
    const source = new Element(env.document, kind === "img" ? "img" : "div");
    if (kind === "img") source.src = "https://external.test/private.png";
    else
      source.computed = {
        "background-image": 'url("https://external.test/x.png")',
      };
    await assert.rejects(
      snapshotElementToCanvas(source, env.canvas),
      hasCode("EXPORT_FAILED"),
    );
    assert.equal(env.fetches.length, 0);
    assert.equal(env.createdImages.length, 0);
  }
});

test("cancelling image decoding releases handlers and never writes the output", async () => {
  const env = environment({ deferredImage: true });
  const controller = new AbortController();
  const source = new Element(env.document, "svg", SVG_NS);
  const pending = snapshotElementToCanvas(source, env.canvas, {
    signal: controller.signal,
  });
  const rejected = assert.rejects(pending, hasCode("EXPORT_ABORTED"));
  while (!env.createdImages.length) await Promise.resolve();
  controller.abort();
  await rejected;
  assert.equal(env.createdImages[0].onload, null);
  assert.equal(env.createdImages[0].onerror, null);
  assert.equal(env.createdImages[0].url, "");
  assert.equal(env.draws, 0);
});

test("tainted canvases and unsupported blank HTML captures fail explicitly", async () => {
  for (const options of [{ tainted: true }, { transparent: true }]) {
    const env = environment(options);
    await assert.rejects(
      snapshotElementToCanvas(new Element(env.document, "div"), env.canvas),
      hasCode("EXPORT_FAILED"),
    );
  }
});

test("a video style cache reuses paint styles while paths, positions, images and text advance", async () => {
  const env = environment();
  const source = new Element(env.document, "svg", SVG_NS);
  const path = new Element(env.document, "path", SVG_NS);
  path.setAttribute("d", "M1,2 L3,4");
  path.computed = {
    d: 'path("M1,2 L3,4")',
    transform: "matrix(1, 0, 0, 1, 3, 4)",
    stroke: "#70ec8f",
  };
  const cursor = new Element(env.document, "rect", SVG_NS);
  for (const [key, value] of Object.entries({
    x: 10,
    y: 20,
    width: 1,
    height: 170,
  })) {
    cursor.setAttribute(key, value);
  }
  cursor.computed = {
    x: "10px",
    y: "20px",
    width: "1px",
    height: "170px",
    fill: "#ffffff",
  };
  const image = new Element(env.document, "image", SVG_NS);
  image.setAttribute("href", "data:image/png;base64,AA==");
  const text = new Element(env.document, "text", SVG_NS);
  text.setAttribute("x", 100);
  text.setAttribute("y", 50);
  text.computed = { x: "100px", y: "50px" };
  const readout = new TextNode("0:00");
  text.append(readout);
  source.append(path, cursor, image, text);
  const styleCache = new WeakMap();
  await snapshotElementToCanvas(source, env.canvas, { styleCache });
  const firstReads = env.styleReads.length;
  assert.equal(firstReads, 5);

  path.setAttribute("d", "M7,8 L9,10");
  path.computed.d = 'path("M7,8 L9,10")';
  cursor.setAttribute("x", 450);
  cursor.setAttribute("y", 35);
  cursor.setAttribute("width", 2);
  cursor.setAttribute("height", 180);
  image.setAttribute("href", "data:image/png;base64,AQ==");
  text.setAttribute("x", 250);
  text.setAttribute("y", 65);
  readout.textContent = "0:01";
  await snapshotElementToCanvas(source, env.canvas, { styleCache });

  assert.equal(env.styleReads.length, firstReads);
  const [nextPath, nextCursor, nextImage, nextText] =
    env.serialized[1].childNodes;
  assert.equal(nextPath.getAttribute("d"), "M7,8 L9,10");
  assert.equal(nextPath.style.values.get("stroke"), "#70ec8f");
  assert.equal(nextPath.style.values.has("d"), false);
  assert.equal(nextPath.style.values.has("transform"), false);
  for (const [key, value] of Object.entries({
    x: 450,
    y: 35,
    width: 2,
    height: 180,
  })) {
    assert.equal(nextCursor.getAttribute(key), String(value));
    assert.equal(nextCursor.style.values.has(key), false);
  }
  assert.equal(nextImage.getAttribute("href"), "data:image/png;base64,AQ==");
  assert.equal(nextText.getAttribute("x"), "250");
  assert.equal(nextText.getAttribute("y"), "65");
  assert.equal(nextText.style.values.has("x"), false);
  assert.equal(nextText.style.values.has("y"), false);
  assert.equal(nextText.childNodes[0].textContent, "0:01");
  assert.equal(env.serialized[0].childNodes[0].getAttribute("d"), "M1,2 L3,4");
});

test("class and inline-style changes invalidate only that source element's cached styles", async () => {
  const env = environment();
  const source = new Element(env.document, "svg", SVG_NS);
  const path = new Element(env.document, "path", SVG_NS);
  path.setAttribute("class", "qcon");
  path.setAttribute("style", "stroke: #112233");
  path.computed = { stroke: "#112233", "stroke-width": "1" };
  source.append(path);
  const styleCache = new WeakMap();
  const readsFor = (element) =>
    env.styleReads.filter((read) => read.source === element).length;
  await snapshotElementToCanvas(source, env.canvas, { styleCache });
  await snapshotElementToCanvas(source, env.canvas, { styleCache });
  assert.equal(readsFor(source), 1);
  assert.equal(readsFor(path), 1);

  path.setAttribute("class", "qcon active");
  path.computed.stroke = "#ff0000";
  await snapshotElementToCanvas(source, env.canvas, { styleCache });
  assert.equal(readsFor(source), 1);
  assert.equal(readsFor(path), 2);
  assert.equal(
    env.serialized[2].childNodes[0].style.values.get("stroke"),
    "#ff0000",
  );

  path.setAttribute("style", "stroke: #00ff00; stroke-width: 3");
  path.computed.stroke = "#00ff00";
  path.computed["stroke-width"] = "3";
  await snapshotElementToCanvas(source, env.canvas, { styleCache });
  await snapshotElementToCanvas(source, env.canvas, { styleCache });
  assert.equal(readsFor(source), 1);
  assert.equal(readsFor(path), 3);
  assert.equal(
    env.serialized[4].childNodes[0].style.values.get("stroke"),
    "#00ff00",
  );
  assert.equal(
    env.serialized[4].childNodes[0].style.values.get("stroke-width"),
    "3",
  );
});
