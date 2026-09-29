import test from "node:test";
import assert from "node:assert/strict";

import {
  applyAnalgesicSpectralSignature,
  calculateIndices,
  combineDrugProfiles,
  getMedicationEffects,
} from "../src/simulation/engine.js";

const baseConfig = {
  drug: "propofol",
  level: 0,
  adjunct: "dexmedetomidine",
  adjunctLevel: 0,
  opioid: "remifentanil",
  opioidLevel: 0,
  bolusStartedAt: { primary: null, adjunct: null, analgesia: null },
};

test("Stufe 0 deaktiviert alle drei kontinuierlichen Wirkungen", () => {
  const effects = getMedicationEffects(baseConfig, 10_000);
  assert.equal(effects.primaryValue, 0);
  assert.equal(effects.adjunctValue, 0);
  assert.equal(effects.analgesiaValue, 0);
});

test("jeder Kategorie-Bolus wirkt unabhangig von Stufe 0", () => {
  for (const category of ["primary", "adjunct", "analgesia"]) {
    const config = structuredClone(baseConfig);
    config.bolusStartedAt[category] = 10_000;
    const effects = getMedicationEffects(config, 11_500);
    assert.ok(effects[category] > 0, `${category} bolus did not activate`);
  }
});

test("Analgesiestufen senken qNOX ohne einen hypnotischen BSR zu erfinden", () => {
  const state = { depth: 58, bs: 0 };
  const none = calculateIndices(baseConfig, state, 20);
  const high = calculateIndices({ ...baseConfig, opioidLevel: 4 }, state, 20);
  assert.ok(high.qnox < none.qnox);
  assert.equal(high.bsr, 0);
});

test("Opioidsignatur betont langsame und dampft schnelle Spektralleistung", () => {
  const lowFrequency = applyAnalgesicSpectralSignature(1, "fentanyl", 1, 1.5);
  const highFrequency = applyAnalgesicSpectralSignature(1, "fentanyl", 1, 30);
  assert.ok(lowFrequency > 1);
  assert.ok(highFrequency < 1);
});

test("hohe GABAerge Wirkung kann BSR erzeugen", () => {
  const config = { ...baseConfig, level: 4, adjunct: "none" };
  const effects = getMedicationEffects(config, 0);
  const profile = combineDrugProfiles(config, effects.primaryValue, effects);
  assert.ok(profile.bs > 50);
});
