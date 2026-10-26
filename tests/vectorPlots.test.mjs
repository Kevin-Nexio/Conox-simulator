import test from "node:test";
import assert from "node:assert/strict";
import {
  createEegPath,
  createEegSweepPath,
  createSeriesPath,
  getDsaImageBounds,
  getRecordedIndices,
  getRecordingRange,
} from "../src/recordings/vectorPlots.js";

const geometry = { range: { start: 0, end: 1 }, width: 4, height: 100 };

test("vector sweeps place current and previous samples on opposite sides without a future segment", () => {
  const options = {
    samples: Float32Array.from({ length: 80 }, (_, i) => (i >= 50 ? 10000 : i)),
    sampleRate: 10,
    duration: 8,
    windowSeconds: 4,
    position: 5,
    width: 40,
    height: 100,
    amplitude: 100,
  };
  const result = createEegSweepPath(options);
  assert.equal(result.cursorFraction, 0.25);
  assert.match(result.path, /^M0,30 /);
  assert.match(result.path, /M11,44\.5 /);
  assert.match(result.path, /L9,25\.5 /);
  assert.equal((result.path.match(/M/g) || []).length, 2);
  const points = [...result.path.matchAll(/[ML]([\d.]+),(-?[\d.]+)/g)].map(
    (m) => [Number(m[1]), Number(m[2])],
  );
  assert.ok(points.every(([x, y]) => x !== 10 && y >= 25.5 && y <= 50));
  assert.equal(createEegSweepPath({ ...options, position: 0 }).path, "");
  createEegSweepPath({ ...options, position: 7 });
  assert.deepEqual(createEegSweepPath(options), result);
});

test("EEG retains peaks in the same pixel and resumes after missing samples", () => {
  const path = createEegPath({
    ...geometry,
    width: 2,
    samples: [0, 100, -100, 0, null, 20, 40, 0],
    sampleRate: 8,
    amplitude: 100,
  });
  assert.match(path, /0,0/);
  assert.match(path, /0,100/);
  assert.equal((path.match(/M/g) || []).length, 2);
  assert.doesNotMatch(path, /NaN|Infinity/);
});

test("EEG does not bridge an internal missing span in a single display pixel", () => {
  const path = createEegPath({
    ...geometry,
    width: 1,
    samples: [10, null, 20, NaN, 30],
    sampleRate: 5,
  });
  assert.equal((path.match(/M/g) || []).length, 3);
  assert.doesNotMatch(path, /NaN|Infinity/);
});

test("trend and SEF paths leave null values and missing time intervals as gaps", () => {
  const path = createSeriesPath({
    ...geometry,
    range: { start: 0, end: 3 },
    width: 300,
    points: [
      { time: 0, value: 20 },
      { time: 0.25, value: 30 },
      { time: 0.5, value: null },
      { time: 0.75, value: 50 },
      { time: 2, value: 60 },
      { time: 2.25, value: 70 },
    ],
    metric: "value",
    maxGap: 0.375,
  });
  assert.equal((path.match(/M/g) || []).length, 3);
  assert.equal((path.match(/L/g) || []).length, 2);
  assert.match(path, /M75,50/);
  assert.doesNotMatch(path, /NaN|Infinity/);
});

test("invalid geometry or samples never produce nonfinite SVG coordinates", () => {
  for (const overrides of [
    { range: { start: 1, end: 1 } },
    { width: 0 },
    { height: Infinity },
  ]) {
    assert.equal(
      createEegPath({
        ...geometry,
        samples: [1, 2],
        sampleRate: 2,
        ...overrides,
      }),
      "",
    );
    assert.equal(
      createSeriesPath({
        ...geometry,
        points: [{ time: 0, value: 1 }],
        metric: "value",
        ...overrides,
      }),
      "",
    );
  }
  const path = createSeriesPath({
    ...geometry,
    points: [
      { time: NaN, value: 2 },
      { time: 0.25, value: Infinity },
      { time: 0.5, value: null },
      { time: 0.75, value: 3 },
    ],
    metric: "value",
  });
  assert.equal(path, "M3,97");
  assert.equal(
    createEegPath({
      ...geometry,
      samples: [1, 2],
      sampleRate: 2,
      amplitude: 0,
    }),
    "",
  );
});

test("current indices follow frame time including the last sample and EOF", () => {
  const recording = {
    frames: [
      { time: 0, indices: { qcon: 30 } },
      { time: 0.5, indices: { qcon: 40 } },
      { time: 0.75, indices: { qcon: null } },
    ],
  };
  assert.deepEqual(getRecordedIndices(recording, 0.49), { qcon: 30 });
  assert.deepEqual(getRecordedIndices(recording, 0.5), { qcon: 40 });
  assert.deepEqual(getRecordedIndices(recording, 1), { qcon: null });
  assert.equal(getRecordedIndices({ frames: [] }, 1), undefined);
});

test("DSA bitmap extents use column centres and the hop, leaving missing edges blank", () => {
  assert.deepEqual(
    getDsaImageBounds(
      { columns: [{ time: 1 }, { time: 2 }] },
      { start: 0, end: 4 },
      { left: 10, top: 20, width: 400, height: 80 },
    ),
    { x: 60, y: 20, width: 200, height: 80 },
  );
  assert.equal(
    getDsaImageBounds({ columns: [] }, geometry.range, geometry),
    null,
  );
});

test("view ranges stay bounded and zero-duration input is safe", () => {
  assert.deepEqual(getRecordingRange({ durationSeconds: 10 }, 10, 4), {
    start: 6,
    end: 10,
  });
  assert.deepEqual(getRecordingRange({ durationSeconds: 10 }, -3), {
    start: 0,
    end: 10,
  });
  assert.deepEqual(getRecordingRange({ durationSeconds: Infinity }, 0), {
    start: 0,
    end: 0,
  });
});
