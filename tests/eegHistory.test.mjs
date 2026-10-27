import test from "node:test";
import assert from "node:assert/strict";
import {
  createEegHistory,
  appendEegSample,
  visibleEegSamples,
  consumeEegTicks,
  EEG_BATCH_SIZE,
  getEegHistoryView,
  clearEegHistory,
} from "../src/simulation/eegHistory.js";

test("irregular drawing callbacks produce exactly 128 samples per active second", () => {
  const clock = {};
  consumeEegTicks(clock, 0, true);
  let samples = 0;
  for (const now of [20, 65, 111, 200, 325, 500, 610, 789, 950, 1000])
    samples += consumeEegTicks(clock, now, true) * EEG_BATCH_SIZE;
  assert.equal(samples, 128);
  consumeEegTicks(clock, 1005, false);
  consumeEegTicks(clock, 11000, false);
  assert.equal(consumeEegTicks(clock, 11000, true), 0);
  assert.equal(consumeEegTicks(clock, 12000, true) * EEG_BATCH_SIZE, 128);
});

test("chronological rolling history preserves peaks and supports both profiles after wrap", () => {
  const history = createEegHistory();
  for (let i = 0; i < 2000; i++) appendEegSample(history, i);
  for (const seconds of [2, 3, 4, 6, 8, 9]) {
    const visible = visibleEegSamples(history, seconds);
    assert.equal(visible.length, seconds * 128);
    assert.equal(visible[0], 2000 - seconds * 128);
    assert.equal(visible.at(-1), 1999);
  }
  const before = visibleEegSamples(history, 8);
  visibleEegSamples(history, 2);
  assert.deepEqual(visibleEegSamples(history, 8), before);
  assert.equal(visibleEegSamples(createEegHistory()).length, 0);
});

test("resume primes the drawing clock and delayed tabs signal a fresh history", () => {
  const clock = {};
  assert.equal(consumeEegTicks(clock, 0, true), 0);
  assert.equal(consumeEegTicks(clock, 31.25, false), 0);
  assert.equal(consumeEegTicks(clock, 10031.25, true), 0);
  assert.equal(consumeEegTicks(clock, 10062.5, true), 1);
  assert.equal(consumeEegTicks(clock, 40062.5, true), 32);
  assert.equal(clock.discontinuity, true);
  assert.equal(consumeEegTicks(clock, 40093.75, true), 1);
  assert.equal(clock.discontinuity, false);
});

test("overwrite sweep keeps old samples at fixed slots until replaced, across both profile windows", () => {
  for (const seconds of [2, 3, 4, 6, 8, 9]) {
    const history = createEegHistory();
    const capacity = seconds * 128;
    for (let i = 0; i < capacity + 17; i++) appendEegSample(history, i);
    const view = getEegHistoryView(history, seconds);
    assert.equal(view.cursorFraction, 17 / capacity);
    for (let slot = 0; slot < capacity; slot++) {
      const gap = Math.ceil(capacity * 0.025);
      if (slot >= 17 && slot < 17 + gap)
        assert.ok(Number.isNaN(view.values[slot]));
      else assert.equal(view.values[slot], slot < 17 ? slot + capacity : slot);
    }
    const fixedSlot = capacity - 30;
    appendEegSample(history, capacity + 17);
    const next = getEegHistoryView(history, seconds);
    assert.equal(next.values[fixedSlot], view.values[fixedSlot]);
    assert.equal(next.values[17], capacity + 17);
    assert.deepEqual(getEegHistoryView(history, seconds), next);
    const scroll = getEegHistoryView(history, seconds, "scroll");
    assert.equal(scroll.values[0], 18);
    assert.equal(scroll.values.at(-1), capacity + 17);
    assert.equal(scroll.cursorFraction, null);
  }
});

test("switching trace motion does not alter the signal, and discontinuity clears the sweep", () => {
  const history = createEegHistory();
  for (let i = 0; i < 128; i++) appendEegSample(history, i);
  const before = visibleEegSamples(history, 9);
  assert.equal(
    getEegHistoryView(history, 9, "scroll", true).startFraction,
    8 / 9,
  );
  const sweep = getEegHistoryView(history, 9, "sweep");
  assert.equal(sweep.values[0], 0);
  assert.ok(Number.isNaN(sweep.values[128]));
  assert.deepEqual(visibleEegSamples(history, 9), before);
  clearEegHistory(history);
  assert.equal(history.totalSamples, 0);
  assert.ok(getEegHistoryView(history, 9).values.every(Number.isNaN));
});
