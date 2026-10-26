import test from "node:test";
import assert from "node:assert/strict";
import {
  getPresentationSize,
  loadPresentationAssets,
} from "../src/recordings/presentation.js";

test("only the three requested layouts are supported, with the framed simulator as default", () => {
  for (const [layout, height] of [
    ["blocks", 1200],
    ["simulator-frame", 1120],
    ["simulator-screen", 900],
  ]) {
    assert.deepEqual(getPresentationSize(layout), { width: 1600, height });
  }
  assert.deepEqual(
    getPresentationSize(),
    getPresentationSize("simulator-frame"),
  );
  for (const removed of ["conox-frame", "conox-screen", "unsupported"]) {
    assert.throws(() => getPresentationSize(removed), RangeError);
  }
  const size = getPresentationSize();
  size.width = 1;
  assert.equal(getPresentationSize().width, 1600);
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
