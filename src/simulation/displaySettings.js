// The synthetic simulator keeps its historical display independently of the
// software profiles used to interpret recorded cases.
export const SIMULATION_DISPLAY = Object.freeze({
  eegWindows: [2, 4, 8],
  amplitudes: [25, 50, 120, 475],
  dsaPeriods: [5, 30, 120, 360],
  defaultEegWindow: 4,
  defaultAmplitude: 120,
  defaultDsaPeriod: 30,
});

export function simulationDsaPeriod(minutes) {
  return SIMULATION_DISPLAY.dsaPeriods.includes(minutes)
    ? minutes
    : SIMULATION_DISPLAY.defaultDsaPeriod;
}

// Older demo peers can still send Android settings. Keep compatible controls,
// but never let a remote profile change the synthetic rendering pipeline.
export function normalizeSimulationDisplay(snapshot = {}) {
  return {
    eegWindowSeconds: SIMULATION_DISPLAY.eegWindows.includes(
      snapshot.eegWindowSeconds,
    )
      ? snapshot.eegWindowSeconds
      : SIMULATION_DISPLAY.defaultEegWindow,
    eegAmplitude: SIMULATION_DISPLAY.amplitudes.includes(snapshot.eegAmplitude)
      ? snapshot.eegAmplitude
      : SIMULATION_DISPLAY.defaultAmplitude,
    eegMotion: snapshot.eegMotion === "scroll" ? "scroll" : "sweep",
    dsaPeriodMinutes: snapshot.liveSync
      ? 1
      : simulationDsaPeriod(snapshot.dsaPeriodMinutes),
    originalDsaPeriodMinutes: simulationDsaPeriod(
      snapshot.originalDsaPeriodMinutes ?? snapshot.dsaPeriodMinutes,
    ),
  };
}
