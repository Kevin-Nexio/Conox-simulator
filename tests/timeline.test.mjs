import test from "node:test";
import assert from "node:assert/strict";
import {
  clampTimelinePosition,
  moveSelectionBoundary,
  normalizeSelection,
} from "../src/recordings/timeline.js";

test("timeline seeks cover the full recording at centisecond precision", () => {
  assert.equal(clampTimelinePosition(-4, 120), 0);
  assert.equal(clampTimelinePosition(123, 120), 120);
  assert.equal(clampTimelinePosition(31.234, 120), 31.23);
  assert.equal(clampTimelinePosition(31.236, 120), 31.24);
  assert.equal(clampTimelinePosition(NaN, 120), 0);
  assert.equal(clampTimelinePosition(12, 0), 0);
});

test("normalizing a passage repairs bounds and retains a usable minimum span", () => {
  assert.deepEqual(normalizeSelection({ start: -3, end: 150 }, 100), {
    start: 0,
    end: 100,
  });
  assert.deepEqual(normalizeSelection({ start: 5, end: 3 }, 100), {
    start: 5,
    end: 5.25,
  });
  assert.deepEqual(normalizeSelection({ start: 100, end: 100 }, 100), {
    start: 99.75,
    end: 100,
  });
  assert.deepEqual(normalizeSelection(undefined, 100), { start: 0, end: 100 });
  assert.deepEqual(normalizeSelection({ start: 0, end: 0 }, 0.1), {
    start: 0,
    end: 0.1,
  });
  assert.deepEqual(normalizeSelection({ start: 2, end: 3 }, 0), {
    start: 0,
    end: 0,
  });
});

test("dragging the in marker cannot cross or move the out marker", () => {
  const passage = { start: 5, end: 20 };
  assert.deepEqual(moveSelectionBoundary(passage, "start", 30, 60), {
    start: 19.75,
    end: 20,
  });
  assert.deepEqual(moveSelectionBoundary(passage, "start", -30, 60), {
    start: 0,
    end: 20,
  });
  assert.deepEqual(moveSelectionBoundary(passage, "start", 9.876, 60), {
    start: 9.88,
    end: 20,
  });
  assert.deepEqual(passage, { start: 5, end: 20 });
});

test("dragging the out marker cannot cross the in marker or recording end", () => {
  const passage = { start: 5, end: 20 };
  assert.deepEqual(moveSelectionBoundary(passage, "end", -30, 60), {
    start: 5,
    end: 5.25,
  });
  assert.deepEqual(moveSelectionBoundary(passage, "end", 75, 60), {
    start: 5,
    end: 60,
  });
  assert.deepEqual(moveSelectionBoundary(passage, "end", 19.999, 60), {
    start: 5,
    end: 20,
  });
});

test("short and fractional recordings keep markers on the same valid time grid", () => {
  assert.deepEqual(
    moveSelectionBoundary({ start: 0, end: 0.1 }, "start", 0.1, 0.1),
    { start: 0, end: 0.1 },
  );
  assert.deepEqual(
    moveSelectionBoundary({ start: 1850, end: 1850.75 }, "end", 1850, 1850.75),
    { start: 1850, end: 1850.25 },
  );
  assert.deepEqual(
    moveSelectionBoundary({ start: 5.01, end: 5.26 }, "start", 5.26, 10),
    { start: 5.01, end: 5.26 },
  );
});
