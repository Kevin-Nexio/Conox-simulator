import { Da, sl, yl, of } from "../data/index.js";

function re(b, j, M) {
  return Math.max(j, Math.min(M, b));
}

function Il(b) {
  const j = re(b, 0, 1);
  return j * j * (3 - 2 * j);
}

function sh(b) {
  return 0.06 + 0.94 * Math.max(0, Math.sin(2 * Math.PI * 0.27 * b + 0.7)) ** 2;
}

function fh(b) {
  const M = ((b % 14) + 14) % 14,
    d = Il((M - 4.2) / 0.7),
    x = 1 - Il((M - 5.7) / 1.8);
  return d * x;
}

function eventEnvelope(b, j) {
  if (!b?.eventType) return (b?.arousalStrength ?? 0) * fh(j);
  const M = b.eventCycle ?? 16,
    d = ((j % M) + M) % M,
    x = b.eventStart ?? 4,
    C = b.eventAttack ?? 0.4,
    q = b.eventHold ?? 2,
    J = b.eventDecay ?? 3,
    O = Il((d - x) / Math.max(0.05, C)),
    E = 1 - Il((d - x - C - q) / Math.max(0.05, J));
  return re(O * E * (b.eventStrength ?? 1), 0, 1);
}

function eventAdjustedIndices(b, j, M) {
  if (!b) return j;
  const d = eventEnvelope(b, M),
    x = b.eventIndex;
  if (!x || d <= 0) return j;
  return {
    qcon: re(j.qcon + (x.qcon ?? 0) * d, 0, 99),
    qnox: re(j.qnox + (x.qnox ?? 0) * d, 0, 99),
    emg: re(j.emg + (x.emg ?? 0) * d, 0, 99),
    sqi: re(j.sqi + (x.sqi ?? 0) * d, 0, 100),
    bsr: re(j.bsr + (x.bsr ?? 0) * d, 0, 100),
  };
}

function se(b, j, M) {
  return Math.exp(-0.5 * ((b - j) / M) ** 2);
}

function St() {
  let b = 0,
    j = 0;
  for (; !b; ) b = Math.random();
  for (; !j; ) j = Math.random();
  return Math.sqrt(-2 * Math.log(b)) * Math.cos(2 * Math.PI * j);
}

function xm(b) {
  const j = re(b, -30, 50);
  for (let M = 0; M < of.length - 1; M += 1) {
    const [d, x] = of[M],
      [C, q] = of[M + 1];
    if (j <= C) {
      const J = (j - d) / (C - d),
        O = x.map((E, F) => Math.round(E + (q[F] - E) * J));
      return [O[0], O[1], O[2]];
    }
  }
  return [255, 0, 0];
}

const Tu = [
  [0, 1.28],
  [2, 1.24],
  [4, 0.95],
  [6, 0.72],
  [8, 0.92],
  [10.5, 1.28],
  [13, 1.08],
  [20, 1.25],
  [30, 0.62],
  [35, 0.25],
  [45, 0.16],
];

function jm(b) {
  for (let j = 0; j < Tu.length - 1; j += 1) {
    const [M, d] = Tu[j],
      [x, C] = Tu[j + 1];
    if (b <= x) {
      const q = (b - M) / (x - M);
      return d + (C - d) * q;
    }
  }
  return Tu[Tu.length - 1][1];
}

function Om(b, j) {
  const M = Math.max(0, b) * jm(j),
    d = 1.55,
    x = 20;
  return re(
    -30 + (80 * Math.log10(1 + M * x)) / Math.log10(1 + d * x),
    -30,
    50,
  );
}

function Vi(b, j) {
  const M = b.anchors,
    d = M.findIndex((E) => E.at >= j);
  if (d <= 0) return { bands: { ...M[0].bands }, bs: M[0].bs };
  const x = M[d - 1],
    C = M[d],
    q = (j - x.at) / (C.at - x.at),
    J = Il(q),
    O = {};
  return (
    Object.keys(x.bands).forEach((E) => {
      O[E] = x.bands[E] + (C.bands[E] - x.bands[E]) * J;
    }),
    { bands: O, bs: x.bs + (C.bs - x.bs) * J }
  );
}

function _m(b, j) {
  const M = Vi(yl[b.drug], j);
  if (b.adjunct === "none") return M;
  const d = sl[b.adjunctLevel],
    x = Vi(yl[b.adjunct], d),
    C = 0.35 + b.adjunctLevel * 0.11,
    q = {};
  if (
    (Object.keys(M.bands).forEach((J) => {
      const O = x.bands[J] - Da[J];
      q[J] = re(M.bands[J] + O * C, 0, 100);
    }),
    (b.drug === "propofol" && b.adjunct === "ketamine") ||
      (b.drug === "ketamine" && b.adjunct === "propofol"))
  ) {
    const J = 6 + b.adjunctLevel * 3;
    ((q.alpha = re(q.alpha - J * 0.55, 0, 100)),
      (q.beta = re(q.beta + J, 0, 100)),
      (q.gamma = re(q.gamma + J * 0.55, 0, 100)));
  }
  return {
    bands: q,
    bs: re(Math.max(M.bs, x.bs * C) + Math.min(M.bs, x.bs * C) * 0.16, 0, 85),
  };
}

function Nm(b, j) {
  if (b === null) return 0;
  const M = (j - b) / 1e3;
  return M < 0
    ? 0
    : M < 1.2
      ? 20 * Math.sin((M / 1.2) * Math.PI * 0.5)
      : M < 5
        ? 20
        : M < 15
          ? 20 * Math.exp(-(M - 5) / 4.5)
          : 0;
}

function oh(b, j, M, d, x, C) {
  let q = b;
  if (
    (j === "awake" && (q += 0.36 * se(d, 20, 7.5) + 0.14 * se(d, 35, 7)),
    j === "propofol")
  ) {
    const J = re(1 - Math.abs(M - 0.28) / 0.25, 0, 1);
    q +=
      0.22 * M * se(d, 0.9, 1.2) +
      0.34 * J * se(d, 19, 5.8) +
      0.27 * re((M - 0.35) / 0.5, 0, 1) * se(d, 10.1, 1.45);
  }
  if (
    (j === "midazolam" && (q += 0.36 * M * se(d, 19, 5.8)),
    j === "dexmedetomidine" &&
      ((q += 0.24 * M * se(d, 1.2, 1.6) + 0.08 * M * se(d, 5.8, 1.1)),
      d > 16 && (q *= 1 - 0.25 * M)),
    j === "ketamine")
  ) {
    const J = 0.5 + 0.5 * Math.sin(x * 0.82),
      O = M > 0.72 ? 0.62 + 0.38 * J : J,
      E =
        0.48 + 0.32 * Math.sin(x * 0.47 + 0.9) + 0.2 * Math.sin(x * 1.31 + 2.2),
      F = re((1.05 - O * 0.62) * E, 0.18, 1.15);
    q +=
      0.46 * M * F * se(d, 1.7, 2.1) +
      0.62 * M * O * se(d, C ? 23.5 : 29.5, 4.6);
  }
  if (j === "sevoflurane") {
    const J = re((M - 0.42) / 0.42, 0, 1),
      O = 0.58 + 0.42 * Math.sin(x * 0.82 + 0.4) ** 2;
    q +=
      0.2 * M * se(d, 1.1, 1.5) +
      0.24 * M * (1 - J * 0.72) * se(d, 10.2, 2.4) +
      0.5 * M * J * O * se(d, 5.8, 1.5) +
      0.16 * M * se(d, 16, 6.5);
  }
  return q;
}

function Um(b, j, M) {
  const d = b.adjunct === "none" ? 0 : sl[b.adjunctLevel] / 100,
    x = re(j.depth / 100 + d * 0.32, 0, 1.3),
    C = b.opioid === "none" ? 0 : b.opioidLevel / 4,
    q =
      b.drug === "ketamine" ? j.depth / 100 : b.adjunct === "ketamine" ? d : 0,
    J =
      b.drug === "dexmedetomidine"
        ? j.depth / 100
        : b.adjunct === "dexmedetomidine"
          ? d
          : 0,
    O = Math.sin(M * 0.39) * 1.5 + Math.sin(M * 0.13 + 1.2) * 0.8 + St() * 0.3,
    E =
      Math.sin(M * 0.31 + 0.8) * 1.8 +
      Math.sin(M * 0.09 + 2.1) * 0.9 +
      St() * 0.4,
    F = re(
      96 -
        Math.min(x, 1) * 57 -
        Math.max(0, x - 1) * 48 -
        j.bs * 0.58 +
        q * 11 +
        J * 2 +
        O,
      0,
      99,
    ),
    Q = re(57 - Math.min(x, 1) * 42 - C * 17 + q * 11 + St() * 1.5, 3, 82),
    de =
      b.opioid === "remifentanil"
        ? 1
        : b.opioid === "fentanyl"
          ? 0.82
          : b.opioid === "sufentanil"
            ? 0.92
            : 0,
    rt = re(
      86 -
        Math.min(x, 1) * 29 -
        C * de * 48 -
        q * 14 +
        Math.max(0, Q - 35) * 0.14 +
        E,
      2,
      99,
    );
  return {
    qcon: Math.round(F),
    qnox: Math.round(rt),
    emg: Math.round(Q),
    sqi: Math.round(re(97 + St() * 1.1, 92, 100)),
    bsr: Math.round(j.bs),
  };
}

function Rm(b, j, M) {
  if (b === "awake")
    return {
      zone: "yellow",
      pattern: yl.awake.signature,
      state: "Wachheit / Arousal",
      consciousness: "Reaktionsfähigkeit klinisch prüfen",
      pain: "Nicht aus dem EEG ableitbar",
      response: "Wachreferenz ohne Wirkstufe",
    };
  const d = M > 12,
    x = j === 1 || j >= 3;
  return {
    zone: d ? "red" : x ? "yellow" : "green",
    pattern: yl[b].signature,
    state:
      b === "awake"
        ? "Wachheit / Arousal"
        : j === 1
          ? "Leichte Sedierung"
          : j === 2
            ? "Kontinuierliche Sedierung"
            : j === 3
              ? "Tiefe Sedierung"
              : "Sehr tiefe Wirkung",
    consciousness:
      j === 1
        ? "Erweckbarkeit klinisch prüfen"
        : j === 2
          ? "Bewusstsein deutlich reduziert"
          : "Reaktionsfähigkeit klinisch prüfen",
    pain: "Nicht aus dem EEG ableitbar",
    response: d
      ? "Indikation der Suppression prüfen"
      : "Muster und Verlauf beurteilen",
  };
}

export {
  re,
  Il,
  sh,
  fh,
  eventEnvelope,
  eventAdjustedIndices,
  se,
  St,
  xm,
  Tu,
  jm,
  Om,
  Vi,
  _m,
  Nm,
  oh,
  Um,
  Rm,
};

// Readable aliases for new development code.
export {
  re as clamp,
  Il as smoothstep,
  sh as spindleEnvelope,
  eventEnvelope as getEventEnvelope,
  eventAdjustedIndices as applyEventToIndices,
  se as gaussian,
  St as gaussianNoise,
  xm as dsaDbToRgb,
  Tu as FREQUENCY_RESPONSE,
  jm as getFrequencyWeight,
  Om as powerToDb,
  Vi as interpolateDrugProfile,
  _m as combineDrugProfiles,
  Nm as getBolusDepth,
  oh as applyDrugSpectralSignature,
  Um as calculateIndices,
  Rm as classifyClinicalState,
};
