export function formatPosition(seconds, precise = false) {
  const raw = Math.max(0, Number(seconds) || 0);
  const value = precise ? Math.round(raw * 100) / 100 : Math.floor(raw);
  const minutes = Math.floor(value / 60);
  const remainder = value - minutes * 60;
  return `${minutes}:${(precise ? remainder.toFixed(2) : Math.floor(remainder).toString()).padStart(precise ? 5 : 2, "0")}`;
}

export function parsePosition(text) {
  const match = /^(\d{1,4}):([0-5]?\d(?:\.\d{1,2})?)$/.exec(text.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function advancePlayback(position, elapsed, speed, start, end) {
  const next = Math.min(
    end,
    Math.max(start, position) + Math.max(0, elapsed) * speed,
  );
  return { position: next, ended: next >= end };
}

export function getViewRange(position, duration, windowSeconds) {
  const length = Math.min(duration, windowSeconds);
  const start = Math.max(
    0,
    Math.min(position - length * 0.75, duration - length),
  );
  return { start, end: start + length };
}
