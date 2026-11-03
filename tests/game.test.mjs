import test from "node:test";
import assert from "node:assert/strict";
import {
  ALL_MISSIONS,
  METRICS,
  PATHS,
  parseProgress,
  mergeResult,
  isUnlocked,
  scoreFor,
} from "../src/game/content.js";
import { scenarioFor, PATTERN_REFERENCES } from "../src/game/scenarios.js";
import { SCENARIOS } from "../src/data/scenarios.js";

test("game references resolve and teaching copies do not share mutable catalogue profiles", () => {
  const ids = new Set([
    ...ALL_MISSIONS.map((mission) => mission.scenarioId),
    ...ALL_MISSIONS.flatMap((mission) =>
      (mission.references ?? []).map((item) => item.scenarioId),
    ),
    "icu-progression",
    "target-a",
    "strong-suppression",
  ]);
  for (const scenarioId of ids) {
    assert.ok(scenarioFor({ scenarioId }).profile);
    const original = SCENARIOS.find((scenario) => scenario.id === scenarioId);
    if (original) assert.equal(scenarioFor({ scenarioId }), original);
  }
  assert.throws(() => scenarioFor({ scenarioId: "missing-case" }));
  assert.ok(scenarioFor({ scenarioId: "strong-suppression" }).profile.bs > 0);
  const original = SCENARIOS.find((item) => item.id === "target-a");
  const copy = scenarioFor({ scenarioId: "icu-continuous" });
  assert.deepEqual(copy.profile, original.profile);
  assert.notEqual(copy.profile, original.profile);
  assert.notEqual(copy.profile.bands, original.profile.bands);
  const sequence = scenarioFor({ scenarioId: "icu-progression" }).training
    .sequence;
  assert.notEqual(sequence[0].profile.bands, original.profile.bands);
  assert.notEqual(sequence[0].profile.bands, sequence[1].profile.bands);
  const suppression = PATTERN_REFERENCES.map(
    (item) => scenarioFor(item).profile.bs,
  );
  assert.ok(
    suppression[0] === 0 &&
      suppression[1] > 0 &&
      suppression[2] > suppression[1],
  );
});

test("missions have unique IDs, valid evidence and exactly one accepted answer", () => {
  assert.equal(ALL_MISSIONS.length, 12);
  assert.equal(new Set(ALL_MISSIONS.map((m) => m.id)).size, 12);
  const metricIds = new Set(METRICS.map((metric) => metric.id));
  for (const mission of ALL_MISSIONS) {
    assert.equal(mission.options.filter((option) => option.correct).length, 1);
    for (const id of mission.evidence ?? []) assert.ok(metricIds.has(id));
    if (mission.kind === "compare") {
      assert.equal(mission.references.length, 3);
      assert.equal(
        new Set(mission.references.map((item) => item.scenarioId)).size,
        3,
      );
    }
  }
});

test("malformed or obsolete progress is rejected without blocking the game", () => {
  for (const raw of [null, "invalid", "null", '{"version":2,"results":{}}']) {
    assert.deepEqual(parseProgress(raw), {});
  }
  const [a, b, c] = ALL_MISSIONS;
  assert.deepEqual(
    parseProgress(
      JSON.stringify({
        version: 3,
        results: {
          [a.id]: { score: 85 },
          [b.id]: { score: 101 },
          [c.id]: { score: -1 },
          unknown: { score: 100 },
        },
      }),
    ),
    { [a.id]: { score: 85 } },
  );
});

test("only completed missions unlock the next mission and best scores survive retries", () => {
  const path = PATHS[0];
  assert.ok(isUnlocked(path, 0, {}));
  assert.equal(isUnlocked(path, 1, {}), false);
  let results = mergeResult({}, path.missions[0].id, 85);
  assert.ok(isUnlocked(path, 1, results));
  assert.equal(isUnlocked(path, 2, results), false);
  results = mergeResult(results, path.missions[0].id, 40);
  assert.equal(results[path.missions[0].id].score, 85);
  results = mergeResult(results, path.missions[0].id, 100);
  assert.equal(results[path.missions[0].id].score, 100);
  assert.equal(scoreFor(1, 2), 60);
  assert.equal(scoreFor(20, 20), 0);
  assert.equal(isUnlocked(PATHS[1], 1, results), false);
});
