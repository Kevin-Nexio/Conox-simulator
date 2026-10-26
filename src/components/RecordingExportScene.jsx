import * as React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import RecordingBlockView from "./RecordingBlockView.jsx";
import RecordingSimulatorView from "./RecordingSimulatorView.jsx";
import { getPresentationSize } from "../recordings/presentation.js";
import { snapshotElementToCanvas } from "../recordings/domExport.js";

/** Render the same native scene independently, leaving the UI playhead untouched. */
export function createRecordingExportScene(options) {
  const { layout, signal } = options;
  const size = getPresentationSize(layout);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const host = document.createElement("div");
  host.className = "sb-shell recording-shell recording-export-scene";
  host.style.width = `${size.width}px`;
  host.style.height = `${size.height}px`;
  host.setAttribute("aria-hidden", "true");
  host.inert = true;
  document.body.append(host);
  const root = createRoot(host);
  let disposed = false;
  const styleCache = new WeakMap();
  return {
    canvas,
    get element() {
      return host.firstElementChild;
    },
    async renderFrame(position) {
      if (disposed || signal?.aborted) throw { code: "EXPORT_ABORTED" };
      const Component =
        layout === "blocks" ? RecordingBlockView : RecordingSimulatorView;
      flushSync(() =>
        root.render(<Component {...options} position={position} />),
      );
      // The wordmark has an automatic height. Resolve intrinsic image sizes
      // before reading computed layout, including the first exported frame.
      await Promise.all(
        [...host.querySelectorAll("img")].map((image) => image.decode()),
      );
      await snapshotElementToCanvas(host.firstElementChild, canvas, {
        ...size,
        signal,
        styleCache,
      });
    },
    dispose() {
      disposed = true;
      flushSync(() => root.unmount());
      host.remove();
    },
  };
}
