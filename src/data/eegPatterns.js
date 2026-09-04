import { Da } from "./defaults.js";

const Be = {
  awakeReference: {
    bands: { ...Da },
    bs: 0,
    awakePattern: !0,
  },
  mixed: {
    bands: { delta: 72, theta: 10, alpha: 82, beta: 2, gamma: 1 },
    bs: 0,
  },
  alpha: {
    bands: { delta: 20, theta: 6, alpha: 100, beta: 3, gamma: 1 },
    bs: 0,
  },
  weakAlpha: {
    bands: { delta: 58, theta: 15, alpha: 28, beta: 5, gamma: 0 },
    bs: 0,
  },
  broadAlpha: {
    bands: { delta: 22, theta: 8, alpha: 92, beta: 4, gamma: 1 },
    bs: 0,
    alphaWidth: 3.1,
  },
  intermittentAlpha: {
    bands: { delta: 22, theta: 10, alpha: 84, beta: 4, gamma: 0 },
    bs: 0,
    alphaPulse: !0,
  },
  alphaLoss: {
    bands: { delta: 25, theta: 18, alpha: 48, beta: 25, gamma: 5 },
    bs: 0,
  },
  alphaDropout: {
    bands: { delta: 72, theta: 10, alpha: 82, beta: 2, gamma: 1 },
    bs: 0,
    eventType: "alphaDropout",
    eventStrength: 1,
    eventCycle: 15,
    eventStart: 3.5,
    eventAttack: 0.45,
    eventHold: 2.4,
    eventDecay: 2.1,
    eventIndex: { qcon: 7, qnox: 9, emg: 7 },
  },
  arousal: {
    bands: { delta: 66, theta: 12, alpha: 74, beta: 8, gamma: 2 },
    bs: 0,
    arousalStrength: 1,
    eventType: "betaArousal",
    eventStrength: 0.86,
    eventCycle: 16,
    eventStart: 3.8,
    eventAttack: 0.35,
    eventHold: 1.8,
    eventDecay: 2.8,
    eventIndex: { qcon: 10, qnox: 15, emg: 16 },
  },
  nociceptiveArousal: {
    bands: { delta: 70, theta: 11, alpha: 78, beta: 5, gamma: 1 },
    bs: 0,
    eventType: "nociceptiveBeta",
    eventStrength: 1,
    eventCycle: 18,
    eventStart: 4,
    eventAttack: 0.3,
    eventHold: 2.8,
    eventDecay: 3.8,
    eventIndex: { qcon: 12, qnox: 27, emg: 24 },
  },
  deltaArousal: {
    bands: { delta: 68, theta: 12, alpha: 76, beta: 6, gamma: 1 },
    bs: 0,
    eventType: "deltaArousal",
    eventStrength: 1,
    eventCycle: 19,
    eventStart: 4,
    eventAttack: 0.55,
    eventHold: 3.1,
    eventDecay: 3.5,
    eventIndex: { qcon: -5, qnox: 13, emg: 9 },
  },
  emgArtifact: {
    bands: { delta: 70, theta: 11, alpha: 78, beta: 5, gamma: 1 },
    bs: 0,
    eventType: "emgArtifact",
    eventStrength: 1,
    eventCycle: 14,
    eventStart: 3.2,
    eventAttack: 0.2,
    eventHold: 2.2,
    eventDecay: 1.6,
    eventIndex: { qcon: 17, qnox: 14, emg: 55 },
  },
  theta: {
    bands: { delta: 18, theta: 100, alpha: 12, beta: 8, gamma: 0 },
    bs: 0,
    thetaPulse: !0,
  },
  delta: {
    bands: { delta: 100, theta: 5, alpha: 2, beta: 0, gamma: 0 },
    bs: 0,
  },
  deltaNoAlpha: {
    bands: { delta: 100, theta: 7, alpha: 0, beta: 0, gamma: 0 },
    bs: 0,
    suppressAlpha: !0,
    deltaPolymorphic: !0,
  },
  discontinuous: {
    bands: { delta: 78, theta: 8, alpha: 12, beta: 1, gamma: 0 },
    bs: 9,
  },
  preSuppress: {
    bands: { delta: 62, theta: 8, alpha: 16, beta: 1, gamma: 0 },
    bs: 22,
  },
  suppressStrong: {
    bands: { delta: 4, theta: 2, alpha: 2, beta: 0, gamma: 0 },
    bs: 78,
  },
  recoverSuppress: {
    bands: { delta: 68, theta: 10, alpha: 18, beta: 2, gamma: 0 },
    bs: 24,
    alphaPulse: !0,
    recoveryPattern: !0,
  },
  midazolam: {
    bands: { delta: 18, theta: 36, alpha: 18, beta: 62, gamma: 8 },
    bs: 0,
  },
  midDeep: {
    bands: { delta: 70, theta: 42, alpha: 10, beta: 12, gamma: 1 },
    bs: 0,
  },
  dex: {
    bands: { delta: 48, theta: 22, alpha: 7, beta: 4, gamma: 0 },
    bs: 0,
    spindleStrength: 0.95,
  },
  dexDeep: {
    bands: { delta: 84, theta: 20, alpha: 5, beta: 3, gamma: 0 },
    bs: 0,
    spindleStrength: 0.48,
  },
  ketamineLow: {
    bands: { delta: 24, theta: 14, alpha: 12, beta: 92, gamma: 58 },
    bs: 0,
  },
  ketamineDeep: {
    bands: { delta: 58, theta: 22, alpha: 12, beta: 72, gamma: 48 },
    bs: 0,
  },
  opioidAwake: {
    bands: { delta: 8, theta: 16, alpha: 16, beta: 72, gamma: 14 },
    bs: 0,
  },
  opioidSlow: {
    bands: { delta: 58, theta: 34, alpha: 10, beta: 16, gamma: 2 },
    bs: 0,
  },
  propKet: {
    bands: { delta: 58, theta: 16, alpha: 56, beta: 44, gamma: 18 },
    bs: 0,
  },
  propDex: {
    bands: { delta: 68, theta: 30, alpha: 66, beta: 3, gamma: 0 },
    bs: 0,
  },
};

export { Be };
export { Be as EEG_PATTERNS };
