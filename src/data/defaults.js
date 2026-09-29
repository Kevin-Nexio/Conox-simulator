const Da = { delta: 12, theta: 26, alpha: 24, beta: 78, gamma: 46 };

const ch = {
  pixel: 10,
  frequencyPixel: 4,
  temporal: 74,
  freqSmooth: 0,
  texture: 68,
};

const sl = { 0: 0, 1: 28, 2: 58, 3: 78, 4: 96 };

const ff = {
  0: "Inaktiv",
  1: "Low dose",
  2: "Mid dose",
  3: "High dose",
  4: "Overdose",
};

export { Da, ch, sl, ff };
export {
  Da as DEFAULT_EEG_BANDS,
  ch as DEFAULT_RENDER_SETTINGS,
  sl as EFFECT_LEVELS,
  ff as EFFECT_LABELS,
};
