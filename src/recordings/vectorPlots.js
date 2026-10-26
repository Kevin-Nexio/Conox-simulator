import { getViewRange } from "./playback.js";

const finite = Number.isFinite;
const number = (value) => String(Math.round(value * 1000) / 1000);
const point = (x, y) => `${number(x)},${number(y)}`;

function validGeometry(range, width, height) {
  return (
    finite(range?.start) &&
    finite(range?.end) &&
    range.end > range.start &&
    finite(width) &&
    width > 0 &&
    finite(height) &&
    height > 0
  );
}

export function getRecordedIndices(recording, position = 0) {
  const frames = recording?.frames || [];
  let low = 0;
  let high = frames.length - 1;
  const at = finite(position) ? position : 0;
  while (low <= high) {
    const middle = (low + high) >>> 1;
    if (frames[middle].time <= at) low = middle + 1;
    else high = middle - 1;
  }
  return frames[Math.max(0, high)]?.indices;
}

export function getRecordingRange(recording, position, windowSeconds = 0) {
  const rawDuration = Number(recording?.durationSeconds);
  const duration = finite(rawDuration) ? Math.max(0, rawDuration) : 0;
  const at = finite(position) ? Math.min(duration, Math.max(0, position)) : 0;
  const window =
    finite(windowSeconds) && windowSeconds > 0 ? windowSeconds : duration;
  return getViewRange(at, duration, window);
}

/** Each pixel retains the extrema of every uninterrupted run of samples. */
export function createEegPath({
  samples,
  sampleRate,
  range,
  width,
  height,
  left = 0,
  top = 0,
  amplitude = 120,
}) {
  if (
    !samples?.length ||
    !validGeometry(range, width, height) ||
    !finite(sampleRate) ||
    sampleRate <= 0 ||
    !finite(amplitude) ||
    amplitude <= 0 ||
    !finite(left) ||
    !finite(top)
  )
    return "";
  const parts = [];
  const middle = top + height / 2;
  const scale = height / (2 * amplitude);
  const span = range.end - range.start;
  const pixels = Math.max(1, Math.ceil(width));
  let connected = false;
  for (let pixel = 0; pixel < pixels; pixel++) {
    const first = Math.max(
      0,
      Math.floor((range.start + (pixel / pixels) * span) * sampleRate),
    );
    const last = Math.min(
      samples.length,
      Math.max(
        first + 1,
        Math.floor((range.start + ((pixel + 1) / pixels) * span) * sampleRate),
      ),
    );
    const x = left + (pixel / pixels) * width;
    if (first >= last) {
      connected = false;
      continue;
    }
    let run = null;
    const flush = () => {
      if (!run) return;
      parts.push(
        `${connected ? "L" : "M"}${point(x, middle - run.first * scale)}`,
      );
      // Preserve the chronological order of the low and high peaks.
      const extrema =
        run.minimumAt < run.maximumAt
          ? [run.minimum, run.maximum]
          : [run.maximum, run.minimum];
      for (const value of extrema)
        parts.push(`L${point(x, middle - value * scale)}`);
      parts.push(`L${point(x, middle - run.last * scale)}`);
      connected = true;
      run = null;
    };
    for (let index = first; index < last; index++) {
      const value = samples[index];
      if (!finite(value) || !finite(middle - value * scale)) {
        flush();
        connected = false;
        continue;
      }
      if (!run)
        run = {
          first: value,
          last: value,
          minimum: value,
          maximum: value,
          minimumAt: index,
          maximumAt: index,
        };
      run.last = value;
      if (value < run.minimum) {
        run.minimum = value;
        run.minimumAt = index;
      }
      if (value > run.maximum) {
        run.maximum = value;
        run.maximumAt = index;
      }
    }
    flush();
  }
  return parts.join(" ");
}

/** Missing values, invalid times and missing time intervals start a new subpath. */
export function createSeriesPath({
  points,
  metric,
  range,
  width,
  height,
  left = 0,
  top = 0,
  minimum = 0,
  maximum = 100,
  maxGap = Infinity,
}) {
  if (
    !points?.length ||
    !validGeometry(range, width, height) ||
    !finite(left) ||
    !finite(top) ||
    !finite(minimum) ||
    !finite(maximum) ||
    maximum <= minimum
  )
    return "";
  const parts = [];
  let previous = null;
  for (const item of points) {
    const time = item?.time;
    const value = typeof metric === "function" ? metric(item) : item?.[metric];
    if (
      !finite(time) ||
      !finite(value) ||
      time < range.start ||
      time > range.end
    ) {
      previous = null;
      continue;
    }
    const x = left + ((time - range.start) / (range.end - range.start)) * width;
    const y = top + height - ((value - minimum) / (maximum - minimum)) * height;
    if (!finite(x) || !finite(y)) {
      previous = null;
      continue;
    }
    const connected =
      previous !== null && time > previous && time - previous <= maxGap;
    parts.push(`${connected ? "L" : "M"}${point(x, y)}`);
    previous = time;
  }
  return parts.join(" ");
}

export function getDsaImageBounds(
  spectrum,
  range,
  { left = 0, top = 0, width, height },
) {
  const columns = spectrum?.columns || [];
  if (
    !columns.length ||
    !validGeometry(range, width, height) ||
    !finite(left) ||
    !finite(top)
  )
    return null;
  const first = columns[0].time;
  const hop = columns.length > 1 ? columns[1].time - first : 1;
  if (!finite(first) || !finite(hop) || hop <= 0) return null;
  const scale = width / (range.end - range.start);
  return {
    x: left + (first - hop / 2 - range.start) * scale,
    y: top,
    width: columns.length * hop * scale,
    height,
  };
}
