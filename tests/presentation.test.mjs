import test from "node:test";
import assert from "node:assert/strict";
import {
  getPresentationSize,
  loadPresentationAssets,
  renderPresentation,
} from "../src/recordings/presentation.js";

function canvasFixture() {
  const texts = [];
  const created = [];
  const gradient = { addColorStop() {} };
  const create = (ownerDocument) => {
    const context = {
      fillText(value) {
        texts.push(String(value));
      },
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient,
    };
    for (const method of [
      "beginPath",
      "rect",
      "roundRect",
      "fill",
      "stroke",
      "save",
      "restore",
      "translate",
      "scale",
      "setTransform",
      "clearRect",
      "fillRect",
      "moveTo",
      "lineTo",
      "clip",
      "setLineDash",
      "drawImage",
      "arc",
    ]) {
      context[method] = () => {};
    }
    return { width: 0, height: 0, ownerDocument, getContext: () => context };
  };
  const ownerDocument = {
    createElement(tag) {
      assert.equal(tag, "canvas");
      const canvas = create(ownerDocument);
      created.push(canvas);
      return canvas;
    },
  };
  return { canvas: create(ownerDocument), texts, created };
}

function dataFixture() {
  return {
    recording: {
      fileName: "private-file.cxbin",
      id: "PRIVATE-CASE-ID",
      clock: "2026-10-26T12:34:56",
      sampleRate: 4,
      durationSeconds: 2,
      frames: Array.from({ length: 8 }, (_, index) => ({
        time: index / 4,
        indices: {
          qcon: index === 5 ? 77 : 42,
          qnox: null,
          bsr: null,
          sqi: null,
          emg: null,
        },
      })),
    },
    filtered: new Float32Array(8),
    spectrum: { columns: [], frequencies: [] },
  };
}

const t = (key) =>
  ({
    "recording.title": "Recorded case",
    "recording.experimentalShort": "Experimental · provisional values",
  })[key] || key;

test("presentation layouts have fixed export dimensions and reject unknown layouts", () => {
  assert.deepEqual(getPresentationSize("blocks"), {
    width: 1600,
    height: 1200,
  });
  assert.deepEqual(getPresentationSize("conox-frame"), {
    width: 1600,
    height: 1120,
  });
  assert.deepEqual(getPresentationSize("conox-screen"), {
    width: 1600,
    height: 900,
  });
  assert.throws(() => getPresentationSize("unsupported"), RangeError);
  const size = getPresentationSize();
  size.width = 1;
  assert.equal(getPresentationSize().width, 1600);
});

test("all layouts draw recorded indices, provisional label and relative time without private metadata", () => {
  for (const layout of ["blocks", "conox-frame", "conox-screen"]) {
    const { canvas, texts } = canvasFixture();
    renderPresentation(canvas, {
      data: dataFixture(),
      layout,
      position: 1.3,
      t,
    });
    assert.ok(
      texts.includes("77"),
      `${layout}: reads the current recorded frame`,
    );
    assert.ok(texts.filter((value) => value === "--").length >= 4);
    assert.ok(texts.includes("Experimental · provisional values"));
    assert.ok(texts.some((value) => value.includes("0:01.30")));
    assert.ok(texts.includes("Recorded case"));
    assert.ok(!texts.some((value) => /private|PRIVATE|2026-10-26/.test(value)));
    assert.deepEqual(
      { width: canvas.width, height: canvas.height },
      getPresentationSize(layout),
    );
  }
});

test("rendering subsequent video frames reuses its three scratch canvases", () => {
  const { canvas, created } = canvasFixture();
  const data = dataFixture();
  for (const position of [0, 0.25, 1, 2]) {
    renderPresentation(canvas, { data, position, layout: "blocks", t });
  }
  assert.equal(created.length, 3);
  assert.deepEqual(
    created.map((surface) => [surface.width, surface.height]),
    [
      [1200, 240],
      [1200, 280],
      [1200, 190],
    ],
  );
});

test("the exported dB scale compensates for the selected colour offset", () => {
  const { canvas, texts } = canvasFixture();
  renderPresentation(canvas, {
    data: dataFixture(),
    position: 0,
    settings: { colorOffset: 16 },
    t,
  });
  assert.ok(texts.includes("34"));
  assert.ok(texts.includes("-46"));
});

test("presentation assets respect the app base path and reject cross-origin sources", async () => {
  const previousDocument = globalThis.document;
  const previousImage = globalThis.Image;
  const urls = [];
  globalThis.document = { baseURI: "https://example.test/Conox-simulator/" };
  globalThis.Image = class {
    set src(value) {
      urls.push(value);
      queueMicrotask(() => this.onload());
    }
  };
  try {
    const assets = await loadPresentationAssets("/Conox-simulator/");
    assert.ok(assets.logo);
    assert.ok(assets.wordmark);
    assert.deepEqual(urls, [
      "https://example.test/Conox-simulator/images/fresenius-kabi-logo.png",
      "https://example.test/Conox-simulator/images/conox-wordmark.png",
    ]);
    assert.deepEqual(await loadPresentationAssets("https://other.test/"), {
      logo: null,
      wordmark: null,
    });
    assert.equal(urls.length, 2);
  } finally {
    globalThis.document = previousDocument;
    globalThis.Image = previousImage;
  }
});
