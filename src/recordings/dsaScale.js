import { DSA_COLOR_STOPS } from "../data/dsaPalette.js";

// The legend uses exactly the palette and dB positions used for recorded pixels.
// This fixes the illustrative CSS gradient without changing the signal or PSD.
export const RECORDING_DSA_STOPS = DSA_COLOR_STOPS.map(([db, rgb]) => ({
  db,
  color: `rgb(${rgb.join(",")})`,
  fraction: (db + 30) / 80,
}));
export const RECORDING_DSA_GRADIENT = `linear-gradient(to top, ${RECORDING_DSA_STOPS.map(
  ({ color, fraction }) => `${color} ${fraction * 100}%`,
).join(", ")})`;

export function getDsaScaleTicks(offset = 0) {
  return [50, 10, 0, -10, -20, -30].map((db) => ({
    value: db - offset,
    fraction: (50 - db) / 80,
  }));
}
