import { Da } from "./defaults.js";

const yl = {
  awake: {
    label: "Kein Hypnotikum / wach",
    short: "Wach",
    mechanism: "Wachreferenz",
    signature:
      "Niedrigamplitudige schnelle Mischaktivität mit Beta-/Gamma-Anteil.",
    conscious: "Reaktionsfähigkeit klinisch prüfen.",
    special: "Referenz für Veränderungen unter Sedativa.",
    pitfall: "EMG kann schnelle EEG-Anteile vortäuschen.",
    anchors: [
      { at: 0, bands: Da, bs: 0 },
      { at: 100, bands: Da, bs: 0 },
    ],
  },
  propofol: {
    label: "Propofol",
    short: "Propofol",
    mechanism: "GABA-A-vermittelte Hypnose",
    signature:
      "Leicht: mehr Beta. Moderat/tief: frontales Alpha mit Slow/Delta. Extrem: Diskontinuität und Suppression.",
    conscious: "Alpha/Slow spricht für eine deutliche hypnotische Wirkung.",
    special: "Typischer Alpha/Delta-Komplex im frontalen EEG.",
    pitfall: "qCON nicht ohne RAW EEG, DSA und Klinik bewerten.",
    anchors: [
      { at: 0, bands: Da, bs: 0 },
      {
        at: 28,
        bands: { delta: 48, theta: 31, alpha: 48, beta: 84, gamma: 40 },
        bs: 0,
      },
      {
        at: 58,
        bands: { delta: 88, theta: 24, alpha: 90, beta: 34, gamma: 11 },
        bs: 0,
      },
      {
        at: 78,
        bands: { delta: 95, theta: 21, alpha: 94, beta: 18, gamma: 4 },
        bs: 3,
      },
      {
        at: 90,
        bands: { delta: 91, theta: 19, alpha: 78, beta: 13, gamma: 2 },
        bs: 24,
      },
      {
        at: 100,
        bands: { delta: 72, theta: 17, alpha: 48, beta: 8, gamma: 1 },
        bs: 88,
      },
    ],
  },
  midazolam: {
    label: "Midazolam",
    short: "Midazolam",
    mechanism: "Benzodiazepin · GABA-A-Modulation",
    signature:
      "Betonte Beta-Aktivität; bei tiefer Wirkung langsamere Mischaktivität.",
    conscious: "Die Sedierungstiefe bleibt im EEG weniger eindeutig.",
    special: "Kumulative Wirkung kann die Aufhellung verzögern.",
    pitfall: "Schnelle Aktivität nicht automatisch als Wachheit deuten.",
    anchors: [
      { at: 0, bands: Da, bs: 0 },
      {
        at: 28,
        bands: { delta: 42, theta: 42, alpha: 34, beta: 83, gamma: 40 },
        bs: 0,
      },
      {
        at: 58,
        bands: { delta: 55, theta: 48, alpha: 38, beta: 91, gamma: 31 },
        bs: 0,
      },
      {
        at: 78,
        bands: { delta: 70, theta: 55, alpha: 42, beta: 66, gamma: 17 },
        bs: 0,
      },
      {
        at: 96,
        bands: { delta: 84, theta: 60, alpha: 37, beta: 32, gamma: 5 },
        bs: 6,
      },
      {
        at: 100,
        bands: { delta: 86, theta: 60, alpha: 35, beta: 28, gamma: 4 },
        bs: 8,
      },
    ],
  },
  dexmedetomidine: {
    label: "Dexmedetomidin",
    short: "Dex",
    mechanism: "Alpha-2-Agonist · schlafähnliche Sedierung",
    signature: "Slow/Delta mit schmalen Spindelepisoden bei 12–16 Hz.",
    conscious: "Erweckbarkeit kann trotz sichtbarer Sedierung erhalten sein.",
    special: "Schlafähnliches Muster ohne typische Propofol-Suppression.",
    pitfall: "Indexwerte sind nicht zwischen Wirkstoffen gleichbedeutend.",
    anchors: [
      { at: 0, bands: Da, bs: 0 },
      {
        at: 28,
        bands: { delta: 56, theta: 49, alpha: 39, beta: 44, gamma: 22 },
        bs: 0,
      },
      {
        at: 58,
        bands: { delta: 82, theta: 61, alpha: 46, beta: 28, gamma: 9 },
        bs: 0,
      },
      {
        at: 78,
        bands: { delta: 93, theta: 68, alpha: 53, beta: 19, gamma: 4 },
        bs: 0,
      },
      {
        at: 100,
        bands: { delta: 96, theta: 70, alpha: 46, beta: 12, gamma: 2 },
        bs: 0,
      },
    ],
  },
  ketamine: {
    label: "Ketamin",
    short: "Ketamin",
    mechanism: "NMDA-Antagonismus · dissoziative Wirkung",
    signature:
      "Niedrige Dosis: schnelle Oszillationen bei etwa 25–32 Hz plus unregelmäßigere langsame Delta-Aktivität.",
    conscious:
      "Schnelle Aktivität kann trotz dissoziativer Wirkung bestehen; Vigilanz klinisch prüfen.",
    special:
      "Die hochfrequente Aktivität kann verarbeitete EEG-Tiefenindizes numerisch anheben.",
    pitfall:
      "Einen höheren Index unter Ketamin nicht automatisch als Wachheit interpretieren.",
    anchors: [
      { at: 0, bands: Da, bs: 0 },
      {
        at: 28,
        bands: { delta: 38, theta: 48, alpha: 24, beta: 65, gamma: 76 },
        bs: 0,
      },
      {
        at: 58,
        bands: { delta: 61, theta: 60, alpha: 18, beta: 49, gamma: 91 },
        bs: 0,
      },
      {
        at: 78,
        bands: { delta: 78, theta: 64, alpha: 20, beta: 63, gamma: 94 },
        bs: 0,
      },
      {
        at: 100,
        bands: { delta: 72, theta: 61, alpha: 22, beta: 83, gamma: 90 },
        bs: 0,
      },
    ],
  },
  sevoflurane: {
    label: "Sevofluran",
    short: "Sevo",
    mechanism: "Volatiles, überwiegend GABAerges Anästhetikum",
    signature:
      "Slow/Delta mit breitem Alpha-Anteil; extrem: Diskontinuität und Suppression.",
    conscious:
      "Das Muster unterstützt die Einordnung der hypnotischen Wirkung.",
    special: "Inhalativer Vergleich zum Propofolprofil.",
    pitfall: "Gleiche DSA-Farbe ist keine Dosisäquivalenz.",
    anchors: [
      { at: 0, bands: Da, bs: 0 },
      {
        at: 28,
        bands: { delta: 55, theta: 47, alpha: 49, beta: 68, gamma: 30 },
        bs: 0,
      },
      {
        at: 58,
        bands: { delta: 85, theta: 70, alpha: 72, beta: 44, gamma: 17 },
        bs: 0,
      },
      {
        at: 78,
        bands: { delta: 93, theta: 82, alpha: 58, beta: 27, gamma: 8 },
        bs: 7,
      },
      {
        at: 90,
        bands: { delta: 89, theta: 46, alpha: 70, beta: 18, gamma: 4 },
        bs: 22,
      },
      {
        at: 100,
        bands: { delta: 70, theta: 28, alpha: 42, beta: 8, gamma: 1 },
        bs: 72,
      },
    ],
  },
};

export { yl };
export { yl as DRUG_PROFILES };
