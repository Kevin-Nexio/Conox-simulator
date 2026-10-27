const CONTROL_TAGS = new Set([
  "INPUT",
  "SELECT",
  "TEXTAREA",
  "BUTTON",
  "A",
  "SUMMARY",
]);
const CONTROL_ROLES = new Set([
  "button",
  "checkbox",
  "combobox",
  "listbox",
  "menuitem",
  "option",
  "radio",
  "slider",
  "spinbutton",
  "switch",
  "textbox",
]);

/** Preserve native keyboard behaviour on controls and editable descendants. */
export function isPlaybackControl(target) {
  for (let node = target; node; node = node.parentElement) {
    const editable = node.getAttribute?.("contenteditable");
    if (
      CONTROL_TAGS.has(node.tagName) ||
      CONTROL_ROLES.has(node.getAttribute?.("role")) ||
      node.isContentEditable ||
      (editable !== undefined && editable !== null && editable !== "false")
    )
      return true;
  }
  return false;
}

/** Mouse/touch transport actions return keyboard control to the monitor. */
export function restorePlaybackFocusAfterPointer(event, fullscreen) {
  const host = event.currentTarget;
  if (!fullscreen || !(event.detail > 0) || !host) return false;
  let button = null;
  let node = event.target;
  for (; node && node !== host; node = node.parentElement) {
    const editable = node.getAttribute?.("contenteditable");
    if (
      ["INPUT", "SELECT", "TEXTAREA"].includes(node.tagName) ||
      node.isContentEditable ||
      (editable !== undefined && editable !== null && editable !== "false")
    )
      return false;
    if (node.tagName === "BUTTON") button ??= node;
  }
  if (!button || node !== host) return false;
  host.focus({ preventScroll: true });
  return true;
}

/** Fullscreen playback commands; seeking is bounded by the whole recording. */
export function getPlaybackShortcut(
  event,
  { fullscreen, locked, position, duration },
) {
  if (
    !fullscreen ||
    locked ||
    event.defaultPrevented ||
    event.isComposing ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    isPlaybackControl(event.target)
  )
    return null;
  if (event.key === " " || event.key === "Spacebar")
    return event.repeat ? null : { type: "toggle" };
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return null;
  if (!Number.isFinite(duration) || duration < 0) return null;
  const step = event.shiftKey ? 30 : 5;
  const current = Number.isFinite(position) ? position : 0;
  const next = current + (event.key === "ArrowLeft" ? -step : step);
  return { type: "seek", position: Math.min(duration, Math.max(0, next)) };
}
