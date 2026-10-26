import test from "node:test";
import assert from "node:assert/strict";
import {
  canvasToPdf,
  canvasToPng,
  exportVideo,
  getSupportedVideoFormats,
  saveExport,
} from "../src/recordings/export.js";

function replaceGlobal(t, name, value) {
  const original = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, name, original);
    else delete globalThis[name];
  });
}

class TrackedTarget extends EventTarget {
  listeners = new Map();
  addEventListener(type, listener, options) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
    super.addEventListener(type, listener, options);
  }
  removeEventListener(type, listener, options) {
    this.listeners.get(type)?.delete(listener);
    super.removeEventListener(type, listener, options);
  }
  get listenerCount() {
    return [...this.listeners.values()].reduce(
      (total, listeners) => total + listeners.size,
      0,
    );
  }
}

function browser(t, options = {}) {
  let clock = 0;
  let captures = 0;
  const recorders = [];
  const document = new TrackedTarget();
  document.hidden = false;
  document.visibilityState = "visible";
  const signal = new TrackedTarget();
  signal.aborted = false;
  signal.abort = () => {
    signal.aborted = true;
    signal.dispatchEvent(new Event("abort"));
  };
  const track = new TrackedTarget();
  track.stopCount = 0;
  track.frameCount = 0;
  track.stop = () => track.stopCount++;
  track.requestFrame = () => track.frameCount++;
  const stream = {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  };
  class Canvas {
    width = 1280;
    height = 720;
    captureStream() {
      captures++;
      return stream;
    }
  }
  class Recorder extends TrackedTarget {
    static isTypeSupported(type) {
      return (options.supported || ["video/webm;codecs=vp8"]).includes(type);
    }
    constructor(_stream, config) {
      super();
      if (options.constructorError) throw options.constructorError;
      this.mimeType = options.actualMimeType || config.mimeType;
      this.state = "inactive";
      this.stopCount = 0;
      recorders.push(this);
    }
    start() {
      this.state = "recording";
      queueMicrotask(() => this.dispatchEvent(new Event("start")));
    }
    stop() {
      this.stopCount++;
      this.state = "inactive";
      queueMicrotask(() => {
        const event = new Event("dataavailable");
        event.data = options.empty
          ? new Blob([])
          : new Blob([new Uint8Array([26, 69, 223, 163])], {
              type: this.mimeType,
            });
        this.dispatchEvent(event);
        this.dispatchEvent(new Event("stop"));
      });
    }
  }
  replaceGlobal(t, "HTMLCanvasElement", Canvas);
  replaceGlobal(t, "MediaRecorder", Recorder);
  replaceGlobal(t, "document", document);
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.mock.method(globalThis.performance, "now", () => clock);
  const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  };
  return {
    canvas: new Canvas(),
    document,
    signal,
    track,
    recorders,
    get captures() {
      return captures;
    },
    flush,
    async advance(ms) {
      clock += ms;
      t.mock.timers.tick(ms);
      await flush();
    },
    assertClean() {
      assert.equal(document.listenerCount, 0);
      assert.equal(signal.listenerCount, 0);
      assert.equal(track.listenerCount, 0);
      assert.ok(recorders.every((recorder) => recorder.listenerCount === 0));
    },
  };
}

const hasCode = (code) => (error) => {
  assert.equal(error.name, "ExportError");
  assert.equal(error.code, code);
  return true;
};

test("PDF has valid byte offsets, exact JPEG length and an undistorted landscape image", async () => {
  const jpeg = new Uint8Array([255, 216, 0, 1, 254, 255, 217]);
  const canvas = {
    width: 1600,
    height: 900,
    toBlob(callback, type, quality) {
      assert.equal(type, "image/jpeg");
      assert.ok(quality > 0.9);
      callback(new Blob([jpeg], { type }));
    },
  };
  const pdf = await canvasToPdf(canvas);
  assert.equal(pdf.type, "application/pdf");
  const bytes = Buffer.from(await pdf.arrayBuffer());
  const text = bytes.toString("latin1");
  assert.match(text, /^%PDF-1\.4/);
  assert.match(text, /\/MediaBox \[0 0 841\.89 595\.28\]/);
  assert.match(text, /\/Count 1\b/);
  assert.match(text, /\/Width 1600 \/Height 900/);
  const image = text.indexOf("stream\n", text.indexOf("4 0 obj")) + 7;
  assert.deepEqual(
    bytes.subarray(image, image + jpeg.length),
    Buffer.from(jpeg),
  );
  assert.match(text, new RegExp(`/DCTDecode /Length ${jpeg.length} >>`));
  const matrix = /([\d.]+) 0 0 ([\d.]+) ([\d.]+) ([\d.]+) cm/.exec(text);
  const [width, height, x, y] = matrix.slice(1).map(Number);
  assert.ok(Math.abs(width / height - 1600 / 900) < 0.00001);
  assert.ok(width <= 841.89 - 36 && height <= 595.28 - 36);
  assert.ok(Math.abs(x * 2 + width - 841.89) < 0.002);
  assert.ok(Math.abs(y * 2 + height - 595.28) < 0.002);
  const xrefOffset = Number(/startxref\n(\d+)/.exec(text)[1]);
  assert.equal(text.slice(xrefOffset, xrefOffset + 4), "xref");
  const entries = text.slice(xrefOffset).split("\n").slice(3, 8);
  entries.forEach((entry, index) => {
    const offset = Number(entry.slice(0, 10));
    assert.equal(text.slice(offset, offset + 7), `${index + 1} 0 obj`);
  });
  const contentObject = text.slice(text.indexOf("5 0 obj"));
  const contentLength = Number(/\/Length (\d+)/.exec(contentObject)[1]);
  const content = contentObject.slice(
    contentObject.indexOf("stream\n") + 7,
    contentObject.indexOf("endstream"),
  );
  assert.equal(Buffer.byteLength(content, "latin1"), contentLength);
});

test("PNG keeps its actual image type and rejects empty or tainted canvases", async () => {
  const png = new Blob(["png-content"], { type: "image/png" });
  assert.equal(
    await canvasToPng({
      width: 4,
      height: 4,
      toBlob: (callback) => callback(png),
    }),
    png,
  );
  for (const toBlob of [
    (callback) => callback(null),
    (callback) => callback(new Blob(["fallback"], { type: "image/jpeg" })),
    () => {
      throw new DOMException("Tainted canvas", "SecurityError");
    },
  ]) {
    await assert.rejects(
      canvasToPng({ width: 4, height: 4, toBlob }),
      hasCode("EXPORT_FAILED"),
    );
  }
  await assert.rejects(canvasToPdf({ width: 0 }), hasCode("EXPORT_FAILED"));
});

test("format negotiation offers native MP4 and WebM without changing their containers", (t) => {
  browser(t, { supported: ["video/mp4", "video/webm;codecs=vp8"] });
  assert.deepEqual(getSupportedVideoFormats(), [
    { label: "MP4", extension: "mp4", mimeType: "video/mp4" },
    { label: "WebM", extension: "webm", mimeType: "video/webm;codecs=vp8" },
  ]);
  replaceGlobal(t, "MediaRecorder", undefined);
  assert.deepEqual(getSupportedVideoFormats(), []);
});

test("unsupported recording and invalid passages reject before creating a stream", async (t) => {
  const env = browser(t);
  const request = {
    canvas: env.canvas,
    renderFrame() {},
    start: 0,
    end: 1,
  };
  await assert.rejects(
    exportVideo({ ...request, mimeType: "video/mp4" }),
    hasCode("UNSUPPORTED_VIDEO"),
  );
  await assert.rejects(
    exportVideo({ ...request, end: 0 }),
    hasCode("EXPORT_FAILED"),
  );
  assert.equal(env.captures, 0);
});

test("video timing follows elapsed time and speed, includes both boundaries and releases resources", async (t) => {
  const env = browser(t);
  const positions = [];
  const progress = [];
  const pending = exportVideo({
    canvas: env.canvas,
    renderFrame: (position) => positions.push(position),
    start: 10,
    end: 11,
    speed: 2,
    onProgress: (value) => progress.push(value),
    signal: env.signal,
  });
  await env.flush();
  assert.deepEqual(positions, [10]);
  // Missing some render ticks must not slow down the recorded passage.
  await env.advance(200);
  await env.advance(300);
  await env.advance(40);
  const video = await pending;
  assert.equal(video.type, "video/webm;codecs=vp8");
  assert.equal(video.size, 4);
  assert.deepEqual(positions, [10, 10.4, 11]);
  assert.equal(progress[0], 0);
  assert.equal(progress.at(-1), 1);
  assert.equal(env.track.stopCount, 1);
  assert.equal(env.recorders[0].stopCount, 1);
  env.assertClean();
  await env.advance(20000);
  assert.deepEqual(positions, [10, 10.4, 11]);
});

test("cancelling while the first frame loads never starts a recorder", async (t) => {
  const env = browser(t);
  let finishFrame;
  const pending = exportVideo({
    canvas: env.canvas,
    renderFrame: () =>
      new Promise((resolve) => {
        finishFrame = resolve;
      }),
    start: 0,
    end: 1,
    signal: env.signal,
  });
  const rejected = assert.rejects(pending, hasCode("EXPORT_ABORTED"));
  env.signal.abort();
  await rejected;
  finishFrame();
  await env.flush();
  assert.equal(env.captures, 0);
  env.assertClean();
});

test("cancelling an active recorder discards partial video and cleans every listener", async (t) => {
  const env = browser(t);
  const pending = exportVideo({
    canvas: env.canvas,
    renderFrame() {},
    start: 0,
    end: 10,
    signal: env.signal,
  });
  await env.flush();
  const rejected = assert.rejects(pending, hasCode("EXPORT_ABORTED"));
  env.signal.abort();
  await rejected;
  await env.flush();
  assert.equal(env.recorders[0].stopCount, 1);
  assert.equal(env.track.stopCount, 1);
  env.assertClean();
});

test("hiding the page aborts capture instead of returning a stalled partial video", async (t) => {
  const env = browser(t);
  const pending = exportVideo({
    canvas: env.canvas,
    renderFrame() {},
    start: 0,
    end: 10,
  });
  await env.flush();
  const rejected = assert.rejects(pending, hasCode("EXPORT_HIDDEN"));
  env.document.hidden = true;
  env.document.visibilityState = "hidden";
  env.document.dispatchEvent(new Event("visibilitychange"));
  await rejected;
  assert.equal(env.track.stopCount, 1);
  env.assertClean();
});

test("a render error releases the active encoder and stream", async (t) => {
  const env = browser(t);
  const pending = exportVideo({
    canvas: env.canvas,
    renderFrame(position) {
      if (position > 0) throw new Error("Could not draw frame");
    },
    start: 0,
    end: 1,
  });
  const rejected = assert.rejects(pending, hasCode("EXPORT_FAILED"));
  await env.flush();
  await env.advance(40);
  await rejected;
  assert.equal(env.track.stopCount, 1);
  assert.equal(env.recorders[0].stopCount, 1);
  env.assertClean();
});

test("a recorder construction failure still releases the already created stream", async (t) => {
  const env = browser(t, { constructorError: new Error("No encoder") });
  await assert.rejects(
    exportVideo({
      canvas: env.canvas,
      renderFrame() {},
      start: 0,
      end: 1,
    }),
    hasCode("EXPORT_FAILED"),
  );
  assert.equal(env.track.stopCount, 1);
  env.assertClean();
});

test("the recorder cannot return an MP4 label for WebM data", async (t) => {
  const env = browser(t, {
    supported: ["video/mp4"],
    actualMimeType: "video/webm",
  });
  const pending = exportVideo({
    canvas: env.canvas,
    renderFrame() {},
    start: 0,
    end: 0.1,
    mimeType: "video/mp4",
  });
  const rejected = assert.rejects(pending, hasCode("EXPORT_FAILED"));
  await env.flush();
  await env.advance(100);
  await env.advance(40);
  await rejected;
  assert.equal(env.track.stopCount, 1);
  env.assertClean();
});

test("empty encoder output is rejected instead of downloading an unusable file", async (t) => {
  const env = browser(t, { empty: true });
  const pending = exportVideo({
    canvas: env.canvas,
    renderFrame() {},
    start: 0,
    end: 0.1,
  });
  const rejected = assert.rejects(pending, hasCode("EXPORT_FAILED"));
  await env.flush();
  await env.advance(100);
  await env.advance(40);
  await rejected;
  env.assertClean();
});

test("downloads keep their URL alive long enough to start and then revoke it", (t) => {
  const env = browser(t);
  let clicked = false;
  let removed = false;
  const revoked = [];
  const anchor = {
    click() {
      clicked = true;
    },
    remove() {
      removed = true;
    },
  };
  env.document.createElement = () => anchor;
  env.document.body = { append() {} };
  t.mock.method(URL, "createObjectURL", () => "blob:export-test");
  t.mock.method(URL, "revokeObjectURL", (url) => revoked.push(url));
  saveExport(new Blob(["image"]), "case-image.png");
  assert.equal(anchor.download, "case-image.png");
  assert.equal(clicked, true);
  assert.equal(removed, true);
  assert.deepEqual(revoked, []);
  t.mock.timers.tick(60000);
  assert.deepEqual(revoked, ["blob:export-test"]);
});
