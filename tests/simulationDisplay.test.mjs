import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeSimulationDisplay,
  simulationDsaPeriod,
} from "../src/simulation/displaySettings.js";

test("an older Android demo cannot select Android rendering or incompatible scales", () => {
  assert.deepEqual(
    normalizeSimulationDisplay({
      referenceProfile: "android-2.4",
      eegWindowSeconds: 9,
      eegAmplitude: 250,
      dsaPeriodMinutes: 60,
      originalDsaPeriodMinutes: 60,
    }),
    {
      eegWindowSeconds: 4,
      eegAmplitude: 120,
      eegMotion: "sweep",
      dsaPeriodMinutes: 30,
      originalDsaPeriodMinutes: 30,
    },
  );
});

test("compatible demo controls and historical long DSA periods survive synchronization", () => {
  const settings = {
    eegWindowSeconds: 8,
    eegAmplitude: 50,
    eegMotion: "scroll",
    dsaPeriodMinutes: 360,
    originalDsaPeriodMinutes: 120,
  };
  assert.deepEqual(normalizeSimulationDisplay(settings), settings);
  assert.equal(simulationDsaPeriod(5), 5);
});

test("Live keeps its one-minute window while retaining a valid return period", () => {
  const settings = normalizeSimulationDisplay({
    liveSync: true,
    dsaPeriodMinutes: 1,
    originalDsaPeriodMinutes: 120,
    eegMotion: "unknown",
  });
  assert.equal(settings.dsaPeriodMinutes, 1);
  assert.equal(simulationDsaPeriod(settings.originalDsaPeriodMinutes), 120);
  assert.equal(settings.eegMotion, "sweep");
  assert.equal(simulationDsaPeriod(NaN), 30);
});
