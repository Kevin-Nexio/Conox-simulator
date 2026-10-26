import { clampTimelinePosition } from "./timeline.js";

/** An event is independent of the passage and stays within the recorded case. */
export function normalizeEventMarker(event, duration) {
  const maximum = clampTimelinePosition(duration, duration);
  const label = typeof event?.label === "string" ? event.label.trim() : "";
  if (
    typeof event?.id !== "string" ||
    !event.id ||
    event.id.length > 128 ||
    !label ||
    label.length > 80 ||
    !Number.isFinite(event.time) ||
    event.time < 0 ||
    event.time > maximum ||
    maximum <= 0
  )
    return null;
  return {
    id: event.id,
    label,
    time: clampTimelinePosition(event.time, maximum),
  };
}

export function saveEventMarker(markers, event, duration) {
  const normalized = normalizeEventMarker(event, duration);
  if (!normalized) return null;
  return [
    ...markers.filter((marker) => marker.id !== event.id),
    normalized,
  ].sort((a, b) => a.time - b.time || a.id.localeCompare(b.id));
}
