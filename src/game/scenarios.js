import { SCENARIOS } from "../data/scenarios.js";

// Mission references always resolve against the main simulator's catalogue.
// A keyed SimulatorApp mount starts each reference with its own clean history.
export function scenarioFor({ scenarioId }) {
  const scenario = SCENARIOS.find((item) => item.id === scenarioId);
  if (!scenario) throw new Error(`Unknown game scenario: ${scenarioId}`);
  return scenario;
}
