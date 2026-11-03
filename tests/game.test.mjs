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
import { scenarioFor } from "../src/game/scenarios.js";
import { SCENARIOS } from "../src/data/scenarios.js";

test("all game references resolve to the main simulator catalogue", () => {
  const ids = new Set([
    ...ALL_MISSIONS.map((mission) => mission.scenarioId),
    "target-a",
    "strong-suppression",
  ]);
  for (const scenarioId of ids) {
    assert.equal(
      scenarioFor({ scenarioId }),
      SCENARIOS.find((scenario) => scenario.id === scenarioId),
    );
  }
  assert.throws(() => scenarioFor({ scenarioId: "missing-case" }));
  assert.ok(scenarioFor({ scenarioId: "strong-suppression" }).profile.bs > 0);
});

test("missions have unique IDs, valid evidence and exactly one accepted answer", () => {
  assert.equal(ALL_MISSIONS.length, 12);
  assert.equal(new Set(ALL_MISSIONS.map((m) => m.id)).size, 12);
  const metricIds = new Set(METRICS.map((metric) => metric.id));
  for (const mission of ALL_MISSIONS) {
    assert.equal(mission.options.filter((option) => option.correct).length, 1);
    for (const id of mission.evidence ?? []) assert.ok(metricIds.has(id));
  }
});

test("malformed or obsolete progress is rejected without blocking the game", () => {
  for (const raw of [null, "invalid", "null", '{"version":1,"results":{}}']) {
    assert.deepEqual(parseProgress(raw), {});
  }
  const [a, b, c] = ALL_MISSIONS;
  assert.deepEqual(
    parseProgress(
      JSON.stringify({
        version: 2,
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
