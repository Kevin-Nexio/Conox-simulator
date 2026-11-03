import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SimulatorApp } from "../App.jsx";

const DESIGN_WIDTH = 882;
const FRAME_RATIO = 1.43;
const SCREEN_RATIO = 1.72;

// Keep a single simulator mounted when the user enlarges or rotates the view.
// Only changing the exercise's scenario resets the simulation and its history.
export default function GameMonitor({
  scenario,
  controls,
  maskIndices = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const host = useRef(null);
  const area = useRef(null);
  const monitor = useRef(null);
  const toggle = useRef(null);
  const wasExpanded = useRef(false);
  const ratio = expanded ? SCREEN_RATIO : FRAME_RATIO;

  useLayoutEffect(() => {
    const fit = () => {
      if (!area.current || !monitor.current) return;
      const width = Math.max(
        0,
        Math.min(area.current.clientWidth, area.current.clientHeight * ratio),
      );
      monitor.current.style.width = `${width}px`;
      monitor.current.style.height = `${width / ratio}px`;
      monitor.current.style.setProperty("--conox-scale", width / DESIGN_WIDTH);
    };
    const observer = new ResizeObserver(fit);
    observer.observe(area.current);
    fit();
    return () => observer.disconnect();
  }, [ratio]);

  useLayoutEffect(() => {
    if (expanded || wasExpanded.current) toggle.current?.focus();
    wasExpanded.current = expanded;
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setExpanded(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [
        ...host.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]',
        ),
      ].filter(
        (element) =>
          element.getClientRects().length > 0 &&
          getComputedStyle(element).visibility !== "hidden",
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first) return;
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !host.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !host.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  return (
    <div
      ref={host}
      className={`game-monitor-host${expanded ? " is-expanded" : ""}`}
      role={expanded ? "dialog" : undefined}
      aria-modal={expanded ? true : undefined}
      aria-label={expanded ? "Enlarged Conox monitor" : undefined}
    >
      <div className="game-monitor-toolbar">
        <button
          ref={toggle}
          type="button"
          className="game-monitor-expand"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Close enlarged monitor" : "Enlarge monitor"}
        </button>
      </div>
      <div ref={area} className="game-monitor-area">
        <div
          ref={monitor}
          className={`game-monitor${maskIndices ? " case-monitor" : ""}`}
          style={{ aspectRatio: ratio }}
        >
          <SimulatorApp
            key={scenario.id}
            trainingScenario={scenario}
            trainingControls={controls}
            trainingScreenOnly={expanded}
            maskIndices={maskIndices}
          />
        </div>
      </div>
    </div>
  );
}
