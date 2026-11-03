import test from "node:test";
import assert from "node:assert/strict";
import {
  createTrainingSequence,
  trainingProfileAt,
  trainingSuppressionAt,
} from "../src/simulation/trainingSequence.js";

const base = {
  bands: { delta: 70, theta: 15, alpha: 80, beta: 12, gamma: 3 },
  bs: 0,
  alphaWidth: 2,
  recoveryPattern: false,
};

test("omitting training options leaves the ordinary simulator path unselected", () => {
  const before = structuredClone(base);
  assert.equal(createTrainingSequence(base), null);
  assert.equal(createTrainingSequence(base, null), null);
  assert.equal(trainingProfileAt(null, 40), null);
  assert.deepEqual(base, before);
});

test("numeric profile values and nested bands interpolate in simulation seconds", () => {
  const training = createTrainingSequence(base, {
    sequence: [
      { at: 0, profile: {} },
      { at: 15, profile: {} },
      { at: 45, profile: { bs: 80, bands: { alpha: 20 }, alphaWidth: 4 } },
      { at: 60, profile: { bs: 80, bands: { alpha: 20 }, alphaWidth: 4 } },
    ],
  });
  assert.equal(trainingProfileAt(training, 10).bs, 0);
  const middle = trainingProfileAt(training, 30);
  assert.equal(middle.bs, 40);
  assert.equal(middle.bands.alpha, 50);
  assert.equal(middle.bands.delta, 70);
  assert.equal(middle.alphaWidth, 3);
  assert.equal(training.duration, 60);
});

test("a sequence clamps both ends and holds its final profile instead of looping", () => {
  const training = createTrainingSequence(base, {
    sequence: [
      { at: 15, profile: { bs: 30 } },
      { at: 60, profile: { bs: 85 } },
    ],
  });
  assert.equal(trainingProfileAt(training, -1).bs, 0);
  assert.equal(trainingProfileAt(training, 7.5).bs, 15);
  assert.equal(trainingProfileAt(training, 60).bs, 85);
  assert.equal(trainingProfileAt(training, 120).bs, 85);
  assert.equal(trainingProfileAt(training, 6000).bs, 85);
});

test("discrete pattern flags switch on the keyframe, not during interpolation", () => {
  const training = createTrainingSequence(base, {
    sequence: [
      { at: 0, profile: {} },
      { at: 20, profile: { recoveryPattern: true } },
    ],
  });
  assert.equal(trainingProfileAt(training, 19.99).recoveryPattern, false);
  assert.equal(trainingProfileAt(training, 20).recoveryPattern, true);
});

test("catalogue profiles and keyframes are isolated from generated mutable states", () => {
  const frozen = Object.freeze({
    ...base,
    bands: Object.freeze({ ...base.bands }),
  });
  const options = {
    sequence: [{ at: 10, profile: { bs: 70, bands: { alpha: 25 } } }],
  };
  const originalOptions = structuredClone(options);
  const training = createTrainingSequence(frozen, options);
  const sampled = trainingProfileAt(training, 5);
  sampled.bands.alpha = 999;
  sampled.bs = 999;
  options.sequence[0].profile.bands.alpha = 999;
  assert.equal(trainingProfileAt(training, 5).bands.alpha, 52.5);
  assert.equal(trainingProfileAt(training, 5).bs, 35);
  assert.equal(frozen.bands.alpha, 80);
  assert.equal(
    training.frames[1].profile.bands.alpha,
    originalOptions.sequence[0].profile.bands.alpha,
  );
});

test("static training references use their own windows and start without invented history", () => {
  const training = createTrainingSequence(
    { ...base, bs: 80 },
    {
      eegWindowSeconds: 8,
      trendWindowMinutes: 1,
      suppressionCycleSeconds: 12,
      historySeconds: 0,
    },
  );
  assert.equal(training.duration, 0);
  assert.equal(training.eegWindowSeconds, 8);
  assert.equal(training.trendWindowMinutes, 1);
  assert.equal(training.historySeconds, 0);
  assert.equal(training.retentionSeconds, 60);
  assert.equal(trainingProfileAt(training, 400).bs, 80);
  assert.throws(
    () => createTrainingSequence(base, { historySeconds: 60 }),
    /history/,
  );
});

test("invalid or ambiguous timeline settings are rejected", () => {
  for (const options of [
    {
      sequence: [
        { at: 1, profile: {} },
        { at: 1, profile: {} },
      ],
    },
    { sequence: [{ at: -1, profile: {} }] },
    { sequence: [{ at: NaN, profile: {} }] },
    { sequence: [{ at: 1, profile: null }] },
    { eegWindowSeconds: 9 },
    { trendWindowMinutes: 0 },
    { suppressionCycleSeconds: Infinity },
    { suppressionCycleSeconds: 0 },
  ])
    assert.throws(() => createTrainingSequence(base, options));
});

test("longer cycles lengthen continuous suppression without changing its configured duty", () => {
  const sampleRate = 128;
  for (const seconds of [4, 8, 12, 20]) {
    for (const bsr of [0, 10, 50, 80, 100]) {
      const sampleCount = seconds * sampleRate;
      let suppressed = 0;
      for (let i = 0; i < sampleCount; i++) {
        const sample = trainingSuppressionAt(
          (i + 0.5) / sampleRate,
          bsr,
          seconds,
        );
        suppressed += Number(sample.suppressed);
        assert.ok(sample.burstEnvelope >= 0 && sample.burstEnvelope <= 1);
        if (sample.suppressed) assert.equal(sample.burstEnvelope, 0);
      }
      assert.ok(
        Math.abs(suppressed / sampleCount - bsr / 100) <= 1 / sampleCount,
      );
    }
  }
  // An 80% duty occupies 9.6 continuous seconds across a 12-second boundary.
  assert.equal(trainingSuppressionAt(7.3, 80, 12).suppressed, true);
  assert.equal(trainingSuppressionAt(16.7, 80, 12).suppressed, true);
  assert.equal(trainingSuppressionAt(6, 80, 12).suppressed, false);
  assert.equal(trainingSuppressionAt(18, 80, 12).suppressed, false);
});
