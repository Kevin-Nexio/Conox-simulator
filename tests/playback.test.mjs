import test from "node:test";
import assert from "node:assert/strict";
import {
  advancePlayback,
  formatPosition,
  getViewRange,
  parsePosition,
} from "../src/recordings/playback.js";
import { RECORDING_UI } from "../src/i18n/recordings.js";

test("time entry round-trips fractional passage boundaries across a minute", () => {
  assert.equal(formatPosition(59.999, true), "1:00.00");
  assert.equal(formatPosition(1850.25, true), "30:50.25");
  assert.equal(parsePosition("30:50.25"), 1850.25);
  for (const value of ["1:60", "-1:00", "abc", "1.2:30", "1:30.555"])
    assert.equal(parsePosition(value), null);
});

test("playback respects speed, passage start and exact stop instead of wrapping", () => {
  assert.deepEqual(advancePlayback(5, 2, 0.5, 10, 20), {
    position: 11,
    ended: false,
  });
  assert.deepEqual(advancePlayback(19.9, 0.1, 4, 10, 20), {
    position: 20,
    ended: true,
  });
  assert.deepEqual(advancePlayback(12, -5, 1, 10, 20), {
    position: 12,
    ended: false,
  });
});

test("views stay within recorded data at the start, middle and end", () => {
  assert.deepEqual(getViewRange(0, 20, 4), { start: 0, end: 4 });
  assert.deepEqual(getViewRange(10, 20, 4), { start: 7, end: 11 });
  assert.deepEqual(getViewRange(20, 20, 4), { start: 16, end: 20 });
  assert.deepEqual(getViewRange(0, 0.25, 4), { start: 0, end: 0.25 });
});

test("recording translations have identical keys and interpolation variables", () => {
  const keys = Object.keys(RECORDING_UI.de).sort();
  const variables = (text) =>
    [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort();
  for (const locale of ["fr", "en"]) {
    assert.deepEqual(Object.keys(RECORDING_UI[locale]).sort(), keys);
    for (const key of keys)
      assert.deepEqual(
        variables(RECORDING_UI[locale][key]),
        variables(RECORDING_UI.de[key]),
        `${locale}: ${key}`,
      );
  }
});
