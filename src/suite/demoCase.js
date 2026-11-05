import {
  createDefaultCaseState,
  encodeCaseFile,
} from "../recordings/caseFile.js";

// A deterministic, invented signal for exploring the interface. No patient data.
export const DEMO_DURATION = 240;
export function createDemoBytes() {
  const bytes = new Uint8Array(DEMO_DURATION * 4 * 1024);
  const view = new DataView(bytes.buffer);
  const encoder = new TextEncoder();
  for (let frame = 0; frame < DEMO_DURATION * 4; frame++) {
    const offset = frame * 1024;
    const time = frame / 4;
    bytes.set(encoder.encode("fff0050000540"), offset);
    view.setUint32(offset + 13, frame + 1, false);
    const envelope =
      time < 45 ? 1 - time / 90 : time > 200 ? 0.5 + (time - 200) / 80 : 0.5;
    bytes[offset + 18] = Math.round(
      40 + envelope * 45 + 3 * Math.sin(time / 12),
    );
    bytes[offset + 19] = Math.round(8 + 12 * envelope);
    bytes[offset + 20] = 0;
    bytes[offset + 21] = 100;
    bytes.set([2, 3, 2], offset + 22);
    bytes[offset + 25] = Math.round(
      37 + envelope * 35 + 5 * Math.sin(time / 9),
    );
    const signal = (t) =>
      (27 * Math.sin(2 * Math.PI * 1.6 * t) +
        15 * Math.sin(2 * Math.PI * 10 * t) +
        3 * Math.sin(2 * Math.PI * 23 * t)) *
      (1.15 - envelope / 2);
    for (let i = 0; i < 256; i++) {
      const raw = Math.round(0x800000 + signal(time + i / 1024) / 0.04458);
      bytes[offset + 26 + i * 3] = (raw >>> 16) & 255;
      bytes[offset + 27 + i * 3] = (raw >>> 8) & 255;
      bytes[offset + 28 + i * 3] = raw & 255;
    }
    for (let i = 0; i < 32; i++)
      view.setUint16(
        offset + 794 + i * 2,
        Math.round(31000 + signal(time + i / 128) * 90),
        false,
      );
    bytes[offset + 881] = frame % 5;
    bytes.set(encoder.encode("R000001"), offset + 883);
    bytes.set(
      [10, Math.floor(time / 60), Math.floor(time % 60), 5, 11, 26],
      offset + 959,
    );
    let crc = 0;
    for (let i = offset; i < offset + 1022; i++) {
      crc ^= bytes[i];
      for (let bit = 0; bit < 8; bit++)
        crc = crc & 1 ? (crc >>> 1) ^ 0xa001 : crc >>> 1;
    }
    bytes[offset + 1022] = crc >>> 8;
    bytes[offset + 1023] = crc & 255;
  }
  return bytes;
}

export async function createDemoFile(locale = "fr") {
  const state = createDefaultCaseState(DEMO_DURATION, locale, "android-2.4");
  state.position = 110;
  state.layout = "blocks";
  state.settings.dsaWindow = 0;
  state.markers = [
    { id: "demo-1", time: 35, label: "Repère A · transition synthétique" },
    { id: "demo-2", time: 110, label: "Repère B · signal stable" },
    { id: "demo-3", time: 205, label: "Repère C · nouvelle transition" },
  ];
  const blob = await encodeCaseFile(createDemoBytes(), state, {
    duration: DEMO_DURATION,
    sourceName: "demo-synthetique.cxbin",
  });
  return new File([blob], "demo-synthetique.cxbin", {
    type: "application/octet-stream",
  });
}
