const ANALGESIC_PROFILES = {
  remifentanil: {
    label: "Remifentanil",
    short: "Remifentanil",
    signature:
      "Rasche qNOX-Dampfung; mit steigender Wirkung mehr langsame Delta-Aktivitat und weniger schnelle Aktivitat.",
    spectral: {
      deltaHz: 2.1,
      deltaWidth: 2,
      deltaGain: 0.25,
      thetaHz: 5.6,
      thetaGain: 0.07,
      highFrequencyDamping: 0.3,
    },
    qnoxPotency: 1,
    qconCoupling: 0.08,
  },
  fentanyl: {
    label: "Fentanyl",
    short: "Fentanyl",
    signature:
      "Dosisabhangige Verlangsamung; bei hoher Wirkung zunehmend hochamplitudige Delta-Aktivitat.",
    spectral: {
      deltaHz: 1.45,
      deltaWidth: 1.8,
      deltaGain: 0.38,
      thetaHz: 5.2,
      thetaGain: 0.14,
      highFrequencyDamping: 0.27,
    },
    qnoxPotency: 0.82,
    qconCoupling: 0.12,
  },
  sufentanil: {
    label: "Sufentanil",
    short: "Sufentanil",
    signature:
      "Ausgepragte Delta-/Theta-Betonung und Abnahme schneller Aktivitat; die spektrale Anderung sattigt bei hoher Wirkung.",
    spectral: {
      deltaHz: 1.7,
      deltaWidth: 2.1,
      deltaGain: 0.34,
      thetaHz: 5.5,
      thetaGain: 0.14,
      highFrequencyDamping: 0.34,
    },
    qnoxPotency: 0.92,
    qconCoupling: 0.1,
  },
};

export { ANALGESIC_PROFILES };
