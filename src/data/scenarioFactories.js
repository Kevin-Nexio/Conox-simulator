function qe(b, j, M, d, x = 100) {
  return { qcon: b, qnox: j, emg: M, bsr: d, sqi: x };
}

function Ce(b) {
  return {
    adjunct: "none",
    adjunctLevel: 1,
    opioid: "none",
    opioidLevel: 1,
    ...b,
  };
}

export { qe, Ce };
export { qe as makeIndices, Ce as withScenarioDefaults };
