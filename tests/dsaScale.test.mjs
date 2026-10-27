import test from "node:test";
import assert from "node:assert/strict";
import { dsaDbToRgb } from "../src/simulation/engine.js";
import {
  RECORDING_DSA_STOPS,
  getDsaScaleTicks,
} from "../src/recordings/dsaScale.js";

test("legend interpolation matches recorded DSA pixel colors across the dB range", () => {
  const stops = RECORDING_DSA_STOPS;
  for (let db = -30; db <= 50; db += 0.5) {
    const fraction = (db + 30) / 80;
    const index = Math.max(
      1,
      stops.findIndex((stop) => stop.fraction >= fraction),
    );
    const a = stops[index - 1];
    const b = stops[index];
    const start = a.color.match(/\d+/g).map(Number);
    const end = b.color.match(/\d+/g).map(Number);
    const between = (fraction - a.fraction) / (b.fraction - a.fraction);
    const legend = start.map((value, i) =>
      Math.round(value + (end[i] - value) * between),
    );
    const pixel = dsaDbToRgb(db);
    assert.ok(
      legend.every((value, i) => Math.abs(value - pixel[i]) <= 1),
      `Legend differs at ${db} dB`,
    );
  }
});

test("legend ticks describe the input power after every supported color offset", () => {
  for (let offset = -16; offset <= 16; offset += 4) {
    const ticks = getDsaScaleTicks(offset);
    assert.equal(ticks[0].value, 50 - offset);
    assert.equal(ticks.at(-1).value, -30 - offset);
    assert.equal(ticks[0].fraction, 0);
    assert.equal(ticks.at(-1).fraction, 1);
    for (const tick of ticks) {
      assert.deepEqual(
        dsaDbToRgb(tick.value, offset),
        dsaDbToRgb(50 - tick.fraction * 80),
      );
    }
  }
});
