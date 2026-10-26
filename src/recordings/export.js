export class ExportError extends Error {
  constructor(code, cause) {
    super(code, cause ? { cause } : undefined);
    this.name = "ExportError";
    this.code = code;
  }
}

const VIDEO_FORMATS = [
  {
    label: "MP4",
    extension: "mp4",
    candidates: ["video/mp4;codecs=avc1.42E01E", "video/mp4"],
  },
  {
    label: "WebM",
    extension: "webm",
    candidates: [
      "video/webm;codecs=vp8",
      "video/webm;codecs=vp9",
      "video/webm",
    ],
  },
];

function supportsMimeType(mimeType) {
  try {
    return (
      typeof globalThis.MediaRecorder?.isTypeSupported === "function" &&
      globalThis.MediaRecorder.isTypeSupported(mimeType)
    );
  } catch {
    return false;
  }
}

export function getSupportedVideoFormats() {
  if (
    typeof globalThis.HTMLCanvasElement?.prototype?.captureStream !== "function"
  )
    return [];
  return VIDEO_FORMATS.flatMap(({ candidates, ...format }) => {
    const mimeType = candidates.find(supportsMimeType);
    return mimeType ? [{ ...format, mimeType }] : [];
  });
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    if (!canvas?.width || !canvas?.height || !canvas.toBlob) {
      reject(new ExportError("EXPORT_FAILED"));
      return;
    }
    try {
      canvas.toBlob(
        (blob) =>
          blob?.size && blob.type === type
            ? resolve(blob)
            : reject(new ExportError("EXPORT_FAILED")),
        type,
        quality,
      );
    } catch (error) {
      reject(new ExportError("EXPORT_FAILED", error));
    }
  });
}

export function canvasToPng(canvas) {
  return canvasBlob(canvas, "image/png");
}

// The PDF contains the same opaque canvas as the image/video exports. Keep the
// original image pixels and fit them on a single landscape A4 page.
export async function canvasToPdf(canvas) {
  const jpeg = await canvasBlob(canvas, "image/jpeg", 0.96);
  const jpegBytes = new Uint8Array(await jpeg.arrayBuffer());
  const encode = (text) => new TextEncoder().encode(text);
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const margin = 18;
  const scale = Math.min(
    (pageWidth - margin * 2) / canvas.width,
    (pageHeight - margin * 2) / canvas.height,
  );
  const width = canvas.width * scale;
  const height = canvas.height * scale;
  const number = (value) => value.toFixed(3);
  const content = encode(
    `q\n${number(width)} 0 0 ${number(height)} ${number((pageWidth - width) / 2)} ${number((pageHeight - height) / 2)} cm\n/Im0 Do\nQ\n`,
  );
  const parts = [
    encode("%PDF-1.4\n"),
    new Uint8Array([37, 226, 227, 207, 211, 10]),
  ];
  const offsets = [0];
  let byteLength = parts.reduce((total, part) => total + part.byteLength, 0);
  const append = (part) => {
    const bytes = typeof part === "string" ? encode(part) : part;
    parts.push(bytes);
    byteLength += bytes.byteLength;
  };
  const object = (id, entries) => {
    offsets[id] = byteLength;
    append(`${id} 0 obj\n`);
    entries.forEach(append);
    append("\nendobj\n");
  };
  object(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  object(2, ["<< /Type /Pages /Kids [3 0 R] /Count 1 >>"]);
  object(3, [
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
  ]);
  object(4, [
    `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.byteLength} >>\nstream\n`,
    jpegBytes,
    "\nendstream",
  ]);
  object(5, [
    `<< /Length ${content.byteLength} >>\nstream\n`,
    content,
    "endstream",
  ]);
  const xrefOffset = byteLength;
  append("xref\n0 6\n0000000000 65535 f \n");
  for (let id = 1; id <= 5; id += 1)
    append(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  append(
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  );
  return new Blob(parts, { type: "application/pdf" });
}

function isHidden() {
  return (
    globalThis.document?.hidden === true ||
    globalThis.document?.visibilityState === "hidden"
  );
}

function videoContainer(mimeType) {
  return /^video\/(mp4|webm)(?:;|$)/i.exec(mimeType)?.[1]?.toLowerCase();
}

/**
 * Record an independently rendered export canvas. renderFrame(positionSeconds)
 * may be synchronous or return a Promise; it must not alter the UI playhead.
 * MediaRecorder records in real time, so duration is (end - start) / speed.
 */
export function exportVideo({
  canvas,
  renderFrame,
  start,
  end,
  speed = 1,
  mimeType = getSupportedVideoFormats()[0]?.mimeType,
  frameRate = 25,
  onProgress,
  signal,
}) {
  if (
    typeof canvas?.captureStream !== "function" ||
    !videoContainer(mimeType) ||
    !supportsMimeType(mimeType)
  )
    return Promise.reject(new ExportError("UNSUPPORTED_VIDEO"));
  if (
    !canvas.width ||
    !canvas.height ||
    typeof renderFrame !== "function" ||
    ![start, end, speed, frameRate].every(Number.isFinite) ||
    start < 0 ||
    end <= start ||
    speed <= 0 ||
    frameRate <= 0 ||
    frameRate > 60
  )
    return Promise.reject(new ExportError("EXPORT_FAILED"));
  if (signal?.aborted) return Promise.reject(new ExportError("EXPORT_ABORTED"));
  if (isHidden()) return Promise.reject(new ExportError("EXPORT_HIDDEN"));

  return new Promise((resolve, reject) => {
    const chunks = [];
    const document = globalThis.document;
    const durationMs = ((end - start) / speed) * 1000;
    const frameMs = 1000 / frameRate;
    const now = () => globalThis.performance.now();
    let stream;
    let recorder;
    let startedAt;
    let timer;
    let watchdog;
    let settled = false;
    let stopping = false;
    const cleanup = () => {
      clearTimeout(timer);
      clearTimeout(watchdog);
      document?.removeEventListener("visibilitychange", onVisibility);
      signal?.removeEventListener("abort", onAbort);
      if (recorder) {
        recorder.removeEventListener("start", onStart);
        recorder.removeEventListener("dataavailable", onData);
        recorder.removeEventListener("stop", onStop);
        recorder.removeEventListener("error", onError);
      }
      for (const track of stream?.getTracks() || []) {
        track.removeEventListener("ended", onTrackEnded);
        try {
          track.stop();
        } catch {
          // Cleanup must still release the other tracks and listeners.
        }
      }
    };
    const fail = (code, cause) => {
      if (settled) return;
      settled = true;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // The original export error is more useful than a stop error.
        }
      }
      cleanup();
      reject(new ExportError(code, cause));
    };
    const onAbort = () => fail("EXPORT_ABORTED");
    const onVisibility = () => {
      if (isHidden()) fail("EXPORT_HIDDEN");
    };
    const onError = (event) => fail("EXPORT_FAILED", event.error);
    const onTrackEnded = () => fail("EXPORT_FAILED");
    const onData = (event) => {
      if (!settled && event.data?.size) chunks.push(event.data);
    };
    const onStop = () => {
      if (settled) return;
      const actualType = recorder.mimeType || mimeType;
      if (
        !stopping ||
        chunks.length === 0 ||
        videoContainer(actualType) !== videoContainer(mimeType)
      ) {
        fail("EXPORT_FAILED");
        return;
      }
      try {
        const video = new Blob(chunks, { type: actualType });
        settled = true;
        cleanup();
        resolve(video);
      } catch (error) {
        fail("EXPORT_FAILED", error);
      }
    };
    const captureFrame = () => {
      for (const track of stream.getVideoTracks()) track.requestFrame?.();
    };
    const stop = () => {
      if (settled) return;
      stopping = true;
      watchdog = setTimeout(() => fail("EXPORT_FAILED"), 10000);
      try {
        recorder.stop();
      } catch (error) {
        fail("EXPORT_FAILED", error);
      }
    };
    const tick = async () => {
      if (settled || stopping) return;
      if (isHidden()) {
        fail("EXPORT_HIDDEN");
        return;
      }
      try {
        const elapsed = Math.max(0, now() - startedAt);
        const position = Math.min(end, start + (elapsed / 1000) * speed);
        await renderFrame(position);
        if (settled) return;
        captureFrame();
        onProgress?.(Math.min(1, (position - start) / (end - start)));
        if (position >= end) {
          // Let the encoder capture the last drawing before stopping the stream.
          timer = setTimeout(stop, frameMs);
        } else {
          const remaining = Math.max(0, durationMs - (now() - startedAt));
          timer = setTimeout(tick, Math.min(frameMs, remaining));
        }
      } catch (error) {
        fail("EXPORT_FAILED", error);
      }
    };
    const onStart = () => {
      if (settled) return;
      clearTimeout(watchdog);
      startedAt = now();
      try {
        captureFrame();
        onProgress?.(0);
        timer = setTimeout(tick, Math.min(frameMs, durationMs));
      } catch (error) {
        fail("EXPORT_FAILED", error);
      }
    };
    const begin = async () => {
      try {
        await renderFrame(start);
        if (settled) return;
        if (isHidden()) {
          fail("EXPORT_HIDDEN");
          return;
        }
        stream = canvas.captureStream(frameRate);
        for (const track of stream.getTracks())
          track.addEventListener("ended", onTrackEnded);
        recorder = new globalThis.MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 2500000,
        });
        recorder.addEventListener("start", onStart);
        recorder.addEventListener("dataavailable", onData);
        recorder.addEventListener("stop", onStop);
        recorder.addEventListener("error", onError);
        watchdog = setTimeout(() => fail("EXPORT_FAILED"), 10000);
        recorder.start(1000);
      } catch (error) {
        fail("EXPORT_FAILED", error);
      }
    };
    document?.addEventListener("visibilitychange", onVisibility);
    signal?.addEventListener("abort", onAbort, { once: true });
    void begin();
  });
}

export function saveExport(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  try {
    anchor.href = url;
    anchor.download = fileName;
    document.body.append(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    // Safari may begin reading the object URL after the click handler returns.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}
