import { SCENARIOS } from "../data/scenarios.js";

const reference = (id) => SCENARIOS.find((item) => item.id === id);
const training = {
  eegWindowSeconds: 8,
  trendWindowMinutes: 1,
  suppressionCycleSeconds: 12,
  historySeconds: 0,
};

// These exercises reuse the shared catalogue and generator. Copies isolate the
// longer teaching cadence from the simulator's original presets and metadata.
function teachingReference(id, sourceId) {
  return {
    ...structuredClone(reference(sourceId)),
    id,
    training: { ...training },
  };
}

export const PATTERN_REFERENCES = [
  {
    scenarioId: "icu-continuous",
    label: "Continuous",
    description: "Continuous alpha/delta activity",
  },
  {
    scenarioId: "icu-discontinuous",
    label: "Early gaps",
    description: "Emerging discontinuity",
  },
  {
    scenarioId: "icu-suppression",
    label: "Suppression",
    description: "Long suppressed intervals",
  },
];

const GAME_SCENARIOS = [
  teachingReference("icu-continuous", "target-a"),
  teachingReference("icu-discontinuous", "pre-suppression"),
  teachingReference("icu-suppression", "strong-suppression"),
  {
    ...teachingReference("icu-progression", "target-a"),
    training: {
      ...training,
      sequence: [
        { at: 0, profile: structuredClone(reference("target-a").profile) },
        { at: 15, profile: structuredClone(reference("target-a").profile) },
        {
          at: 30,
          profile: structuredClone(reference("discontinuous").profile),
        },
        {
          at: 45,
          profile: structuredClone(reference("pre-suppression").profile),
        },
        {
          at: 60,
          profile: structuredClone(reference("strong-suppression").profile),
        },
      ],
    },
  },
];

export function scenarioFor({ scenarioId }) {
  const scenario = [...GAME_SCENARIOS, ...SCENARIOS].find(
    (item) => item.id === scenarioId,
  );
  if (!scenario) throw new Error(`Unknown game scenario: ${scenarioId}`);
  return scenario;
}
