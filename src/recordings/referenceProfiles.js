// These are display software profiles. Neither supplies the monitor's clinical
// index algorithms or a physical calibration of the received EEG channel.
export const LEGACY_REFERENCE_PROFILE = "ios-1.1";
export const DEFAULT_REFERENCE_PROFILE = "android-2.4";

export const REFERENCE_PROFILES = Object.freeze({
  "ios-1.1": Object.freeze({
    id: "ios-1.1",
    name: "ConoxView iOS 1.1",
    eegWindows: [2, 4, 8],
    amplitudes: [25, 50, 120, 475],
    dsaWindows: [0, 60, 300, 1800, 7200, 21600],
    defaultEegWindow: 4,
    defaultDsaWindow: 0,
    impedanceMaximum: 10,
  }),
  "android-2.4": Object.freeze({
    id: "android-2.4",
    name: "ConoxView Android 2.4",
    eegWindows: [3, 6, 9],
    amplitudes: [25, 50, 120, 250, 475],
    dsaWindows: [0, 300, 1800, 3600],
    defaultEegWindow: 9,
    defaultDsaWindow: 1800,
    impedanceMaximum: 14,
  }),
});

export function getReferenceProfile(id = LEGACY_REFERENCE_PROFILE) {
  return REFERENCE_PROFILES[id] || REFERENCE_PROFILES[LEGACY_REFERENCE_PROFILE];
}

export function normalizeReferenceSettings(settings, id) {
  const profile = getReferenceProfile(id);
  return {
    ...settings,
    eegWindow: profile.eegWindows.includes(settings.eegWindow)
      ? settings.eegWindow
      : profile.defaultEegWindow,
    amplitude: profile.amplitudes.includes(settings.amplitude)
      ? settings.amplitude
      : 120,
    dsaWindow: profile.dsaWindows.includes(settings.dsaWindow)
      ? settings.dsaWindow
      : profile.defaultDsaWindow,
  };
}

export const isNativeSpectrum = (spectrum) =>
  spectrum?.valueScale === "conoxview-normalized";

export function referenceDsaPeriodMinutes(minutes, id) {
  const profile = getReferenceProfile(id);
  return minutes > 0 && profile.dsaWindows.includes(minutes * 60)
    ? minutes
    : profile.defaultDsaWindow / 60 || 30;
}

/** Android fills its bitmap from x=0 before the selected period is full. */
export function androidDsaTimeRange(position, windowSeconds) {
  const start = Math.max(0, position - windowSeconds);
  return { start, end: start + windowSeconds };
}

// The one-hour Android bitmap receives packets divisible by eight. Keep that
// phase rather than averaging two log-compressed colour values.
export function getReferenceSpectrumView(spectrum, windowSeconds) {
  if (spectrum?.source !== "conoxview-android-fft" || windowSeconds !== 3600)
    return spectrum;
  return {
    ...spectrum,
    hopSeconds: 2,
    columns: spectrum.secondaryColumns,
  };
}
