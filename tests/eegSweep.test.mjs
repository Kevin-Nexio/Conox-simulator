import test from "node:test";
import assert from "node:assert/strict";
import {
  EEG_SWEEP_GAP_FRACTION,
  getEegSweep,
  isEegSweepGap,
} from "../src/simulation/eegSweep.js";

test("an empty recording starts blank and the first pass only fills behind the cursor", () => {
  assert.deepEqual(getEegSweep(), {
    seconds: 0,
    cursorFraction: 0,
    segments: [],
  });
  assert.deepEqual(getEegSweep({ position: 0, duration: 20 }), {
    seconds: 0,
    cursorFraction: 0,
    segments: [],
  });
  assert.deepEqual(
    getEegSweep({ position: 1, duration: 20, sampleRate: 100 }),
    {
      seconds: 1,
      cursorFraction: 0.25,
      segments: [
        { startFraction: 0, endFraction: 0.25, range: { start: 0, end: 1 } },
      ],
    },
  );
});

test("before, at and after a wrap retain the old pass and erase ahead of the cursor", () => {
  const sweep = (position) =>
    getEegSweep({ position, duration: 20, sampleRate: 100 });
  assert.deepEqual(sweep(3.99), {
    seconds: 3.99,
    cursorFraction: 399 / 400,
    segments: [
      {
        startFraction: 9 / 400,
        endFraction: 399 / 400,
        range: { start: 0.09, end: 3.99 },
      },
    ],
  });
  assert.deepEqual(sweep(4), {
    seconds: 4,
    cursorFraction: 0,
    segments: [
      { startFraction: 0.025, endFraction: 1, range: { start: 0.1, end: 4 } },
    ],
  });
  assert.deepEqual(sweep(4.01), {
    seconds: 4.01,
    cursorFraction: 1 / 400,
    segments: [
      {
        startFraction: 0,
        endFraction: 1 / 400,
        range: { start: 4, end: 4.01 },
      },
      {
        startFraction: 11 / 400,
        endFraction: 1,
        range: { start: 0.11, end: 4 },
      },
    ],
  });
});

test("a gap that crosses the screen boundary erases both edges", () => {
  assert.equal(EEG_SWEEP_GAP_FRACTION, 0.025);
  const erased = Array.from({ length: 100 }, (_, index) => index).filter(
    (index) => isEegSweepGap(index, 99, 100),
  );
  assert.deepEqual(erased, [0, 1, 99]);
  assert.equal(isEegSweepGap(100, 99, 100), true);
  assert.equal(isEegSweepGap(-1, 99, 100), true);
  for (const values of [
    [0, 0, 0],
    [0, 0, -1],
    [NaN, 0, 100],
    [0, Infinity, 100],
    [0.5, 0, 100],
  ]) {
    assert.equal(isEegSweepGap(...values), false);
  }
});

test("EOF wraps exactly at a boundary and short cases never fill future samples", () => {
  assert.deepEqual(
    getEegSweep({ position: 100, duration: 4, sampleRate: 100 }),
    getEegSweep({ position: 4, duration: 4, sampleRate: 100 }),
  );
  assert.deepEqual(
    getEegSweep({ position: 100, duration: 1.253, sampleRate: 100 }),
    {
      seconds: 1.25,
      cursorFraction: 125 / 400,
      segments: [
        {
          startFraction: 0,
          endFraction: 125 / 400,
          range: { start: 0, end: 1.25 },
        },
      ],
    },
  );
  assert.deepEqual(
    getEegSweep({ position: 1, duration: 0.005, sampleRate: 100 }),
    { seconds: 0, cursorFraction: 0, segments: [] },
  );
});

test("pausing, repeated rendering and scrubbing reconstruct the same sample buffer", () => {
  const options = Object.freeze({
    position: 12.345,
    duration: 20,
    windowSeconds: 4,
    sampleRate: 1024,
  });
  const expected = getEegSweep(options);
  assert.deepEqual(getEegSweep(options), expected);
  for (const position of [0, 19, 1, 4, 16, 0.01, 12.345]) {
    getEegSweep({ ...options, position });
    assert.deepEqual(getEegSweep(options), expected);
  }
  // Subsample changes in wall time do not advance the sample cursor.
  assert.deepEqual(
    getEegSweep({ ...options, position: expected.seconds + 0.1 / 1024 }),
    expected,
  );
});

test("segment geometry matches an independently overwritten circular sample buffer", () => {
  for (const windowSeconds of [2, 4, 8]) {
    const sampleRate = 16;
    const length = windowSeconds * sampleRate;
    const counts = [
      0,
      1,
      length - 2,
      length - 1,
      length,
      length + 1,
      2 * length - 1,
      2 * length,
      3 * length + 7,
    ];
    for (const count of counts) {
      const position = count / sampleRate;
      const result = getEegSweep({
        position,
        duration: 100,
        windowSeconds,
        sampleRate,
      });
      const expected = Array(length).fill(null);
      for (let sample = 0; sample < count; sample++) {
        expected[sample % length] = sample;
      }
      const cursor = count % length;
      for (let index = 0; index < length; index++) {
        const ahead = (index - cursor + length) % length;
        if (ahead < Math.ceil(length * 0.025)) expected[index] = null;
      }
      const actual = Array(length).fill(null);
      let previousEnd = 0;
      for (const segment of result.segments) {
        assert.ok(segment.startFraction >= previousEnd);
        assert.ok(segment.endFraction > segment.startFraction);
        assert.ok(segment.endFraction <= 1);
        assert.ok(segment.range.start >= 0);
        assert.ok(segment.range.end > segment.range.start);
        assert.ok(segment.range.end <= result.seconds);
        const start = Math.round(segment.startFraction * length);
        const end = Math.round(segment.endFraction * length);
        const firstSample = Math.round(segment.range.start * sampleRate);
        for (let index = start; index < end; index++) {
          actual[index] = firstSample + index - start;
          assert.ok(actual[index] < count);
        }
        previousEnd = segment.endFraction;
      }
      assert.equal(result.cursorFraction, cursor / length);
      assert.deepEqual(
        actual,
        expected,
        `${windowSeconds}s at sample ${count}`,
      );
    }
  }
});

test("minimum buffers and invalid inputs remain finite without invented ranges", () => {
  assert.deepEqual(
    getEegSweep({
      position: 1,
      duration: 1,
      windowSeconds: 0.01,
      sampleRate: 1,
    }),
    { seconds: 1, cursorFraction: 0, segments: [] },
  );
  assert.deepEqual(
    getEegSweep({ position: 2, duration: 2, windowSeconds: 2, sampleRate: 1 }),
    {
      seconds: 2,
      cursorFraction: 0,
      segments: [
        { startFraction: 0.5, endFraction: 1, range: { start: 1, end: 2 } },
      ],
    },
  );
  for (const invalid of [
    { duration: NaN },
    { duration: Infinity },
    { duration: -1 },
    { windowSeconds: 0 },
    { windowSeconds: NaN },
    { sampleRate: 0 },
    { sampleRate: -1 },
    { sampleRate: Infinity },
    { sampleRate: Number.MAX_VALUE },
  ]) {
    assert.deepEqual(getEegSweep({ position: 2, duration: 5, ...invalid }), {
      seconds: 0,
      cursorFraction: 0,
      segments: [],
    });
  }
  for (const position of [-1, NaN, Infinity, -Infinity]) {
    assert.deepEqual(getEegSweep({ position, duration: 5 }), {
      seconds: 0,
      cursorFraction: 0,
      segments: [],
    });
  }
});
