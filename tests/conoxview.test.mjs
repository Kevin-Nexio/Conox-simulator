import test from "node:test";
import assert from "node:assert/strict";
import {
  crc16Arc,
  hasValidConoxCrc,
  decodeConoxState,
  decodeConoxImpedance,
} from "../src/recordings/conoxview.js";
import { sealConoxFrame } from "./fixtures/conoxProtocol.mjs";
import {
  conoxviewEegY,
  createReferenceEegPath,
} from "../src/recordings/referenceEeg.js";
import {
  buildReferenceSpectrogram,
  createReferenceDsaPixels,
  conoxviewSpectralRgb,
} from "../src/recordings/referenceSpectrum.js";
import { RECORDING_REFERENCE } from "../src/i18n/recordingReference.js";

test("CRC agrees with ARC check vector and independently evaluated 1022-byte frames", () => {
  assert.equal(crc16Arc(new TextEncoder().encode("123456789")), 0xbb3d);
  assert.equal(crc16Arc(new Uint8Array(1022).fill(255)), 0xb0fe);
  assert.equal(
    crc16Arc(Uint8Array.from({ length: 1022 }, (_, i) => i & 255)),
    0xa0fe,
  );
  const frame = sealConoxFrame(
    Uint8Array.from({ length: 1024 }, (_, i) => (i * 13) & 255),
  );
  assert.equal(hasValidConoxCrc(frame), true);
  for (let bit = 0; bit < 8192; bit++) {
    frame[bit >>> 3] ^= 1 << (bit & 7);
    assert.equal(hasValidConoxCrc(frame), false, `bit ${bit}`);
    frame[bit >>> 3] ^= 1 << (bit & 7);
  }
  const padded = new Uint8Array(1050);
  padded.set(frame, 13);
  assert.equal(hasValidConoxCrc(padded.subarray(10), 3), true);
  assert.equal(hasValidConoxCrc(frame.subarray(1)), false);
});

test("sensor and impedance codes preserve TH, unavailable and unknown distinctions", () => {
  assert.deepEqual(
    [0, 128, 200, 225, 210, 132, 201].map((raw) => decodeConoxState(raw).kind),
    [
      "reading",
      "artifact",
      "impedanceTest",
      "leadOff",
      "sensorInvalid",
      "sensorEndOfUse",
      "unknown",
    ],
  );
  assert.deepEqual([0, 1, 10, 11, 15, 128, 255].map(decodeConoxImpedance), [
    { raw: 0, value: null, kind: "unknown" },
    { raw: 1, value: 1, kind: "value" },
    { raw: 10, value: 10, kind: "value" },
    { raw: 11, value: null, kind: "unknown" },
    { raw: 15, value: null, kind: "tooHigh" },
    { raw: 128, value: null, kind: "unavailable" },
    { raw: 255, value: null, kind: "unknown" },
  ]);
});

test("display EEG uses confirmed scale geometry, polarity and asymmetric zero", () => {
  const expected = [
    [25, 531, 1121, 29369, 32815, 205, 856],
    [50, 1061, 2243, 27739, 34636, 735, 1386],
    [120, 2552, 5394, 23153, 39742, 2226, 2877],
    [475, 10079, 21307, 3, 65534, 9753, 10404],
  ];
  for (const [
    scale,
    offset,
    maximum,
    low,
    high,
    pointLow,
    pointHigh,
  ] of expected) {
    assert.equal(
      conoxviewEegY(31000, scale),
      (120 - (100 * offset) / maximum) / 150,
    );
    assert.equal(
      conoxviewEegY(30000, scale),
      (120 - (100 * pointLow) / maximum) / 150,
    );
    assert.equal(
      conoxviewEegY(32000, scale),
      (120 - (100 * pointHigh) / maximum) / 150,
    );
    assert.equal(conoxviewEegY(low, scale), 0.8);
    assert.equal(conoxviewEegY(high, scale), 20 / 150);
    assert.ok(conoxviewEegY(31100, scale) < conoxviewEegY(30900, scale));
    assert.notEqual(conoxviewEegY(31000, scale), 0.5);
  }
});

test("EEG grows in four-point ticks then slides without future samples or stretching startup", () => {
  const samples = Uint16Array.from({ length: 2048 }, (_, i) => 31000 + i);
  const render = (position, windowSeconds = 2) =>
    createReferenceEegPath({
      samples,
      position,
      windowSeconds,
      width: 255,
      height: 150,
    });
  assert.equal(render(0).path, "");
  assert.equal(render(0.03124).sampleCount, 0);
  const first = render(0.03125);
  assert.equal(first.sampleCount, 4);
  assert.equal(first.path.split(" ").at(-1).split(",")[0], "L3");
  assert.equal(render(2).sampleCount, 256);
  assert.equal(render(2.03125).firstSample, 4);
  assert.equal(render(2.0625).firstSample, 8);
  assert.equal(render(8, 4).sampleCount, 512);
  assert.equal(render(16, 8).sampleCount, 1024);
  const before = render(1).path;
  samples.fill(65535, 128);
  assert.equal(render(1).path, before);
  assert.equal(render(99, 8).sampleCount, 1024);
});

function spectrumFixture(times, groups, codes) {
  return buildReferenceSpectrogram({
    frames: times.map((time) => ({ time })),
    referenceSpectrum: {
      groups: Uint8Array.from(groups),
      values: Uint8Array.from(codes.flatMap((code) => Array(9).fill(code))),
    },
  });
}
function pixel(spectrum, pixels, column, bin) {
  const width = Math.max(1, spectrum.columns.length);
  const at = ((44 - bin) * width + column) * 4;
  return [...pixels.slice(at, at + 4)];
}

test("native spectral palette matches fixed byte/RGB pairs including dark red endpoint", () => {
  for (const [code, rgb] of [
    [0, [0, 0, 127]],
    [32, [0, 0, 255]],
    [64, [0, 127, 255]],
    [96, [0, 255, 255]],
    [128, [127, 255, 127]],
    [160, [255, 255, 0]],
    [192, [255, 127, 0]],
    [224, [255, 0, 0]],
    [255, [131, 0, 0]],
  ])
    assert.deepEqual(conoxviewSpectralRgb((code - 128) / 128), rgb);
  assert.deepEqual(conoxviewSpectralRgb(NaN), [0, 0, 0]);
});

test("received DSA writes before advance, overwrites groups and hides unfinished columns", () => {
  const spectrum = spectrumFixture(
    [0, 0.75, 1, 1.25, 4.75, 5, 5.25, 10, 10.25],
    [0, 1, 0, 1, 0, 2, 3, 4, 0],
    [0, 0, 32, 64, 128, 160, 192, 224, 255],
  );
  assert.equal(spectrum.frequencies.length, 45);
  assert.equal(spectrum.frequencies[0], 1);
  assert.equal(spectrum.frequencies.at(-1), 45);
  assert.equal(spectrum.columns[0].finalizedAt, 5);
  assert.equal(spectrum.columns[0].values[0], 0);
  assert.equal(spectrum.columns[0].values[9], -0.5);
  assert.equal(spectrum.columns[0].values[18], 0.25);
  assert.ok(Number.isNaN(spectrum.columns[0].values[27]));
  assert.ok(Number.isNaN(spectrum.columns[1].values[0]));
  assert.equal(spectrum.columns[2].finalizedAt, null);
  assert.equal(spectrum.hasSef, false);
  assert.equal(spectrum.columns[0].sef50, null);
  assert.deepEqual(
    pixel(spectrum, createReferenceDsaPixels(spectrum, 4.99), 0, 0),
    [0, 0, 0, 255],
  );
  const atFive = createReferenceDsaPixels(spectrum, 5);
  assert.deepEqual(pixel(spectrum, atFive, 0, 0), [127, 255, 127, 255]);
  assert.deepEqual(pixel(spectrum, atFive, 0, 18), [255, 255, 0, 255]);
  assert.deepEqual(pixel(spectrum, atFive, 0, 27), [0, 0, 0, 255]);
  assert.deepEqual(pixel(spectrum, atFive, 1, 27), [0, 0, 0, 255]);
  const atTen = createReferenceDsaPixels(spectrum, 10);
  assert.deepEqual(pixel(spectrum, atTen, 1, 27), [255, 127, 0, 255]);
  assert.deepEqual(pixel(spectrum, atTen, 1, 44), [255, 0, 0, 255]);
  assert.deepEqual(pixel(spectrum, atTen, 2, 0), [0, 0, 0, 255]);
  assert.deepEqual(createReferenceDsaPixels(spectrum, 5), atFive);
});

test("short recordings and unknown spectral groups do not fabricate bands", () => {
  const short = spectrumFixture([0, 1, 4.75], [0, 1, 2], [128, 128, 128]);
  assert.ok(
    createReferenceDsaPixels(short).every((value, i) =>
      i % 4 === 3 ? value === 255 : value === 0,
    ),
  );
  const invalid = spectrumFixture(
    [1, 5, 5.25, 10],
    [255, 255, 5, 255],
    [255, 255, 255, 255],
  );
  assert.equal(invalid.columns.length, 2);
  assert.ok(
    invalid.columns.every((column) => column.values.every(Number.isNaN)),
  );
});

test("reference labels stay complete in French, German and English", () => {
  assert.deepEqual(
    Object.keys(RECORDING_REFERENCE.fr).sort(),
    Object.keys(RECORDING_REFERENCE.de).sort(),
  );
  assert.deepEqual(
    Object.keys(RECORDING_REFERENCE.fr).sort(),
    Object.keys(RECORDING_REFERENCE.en).sort(),
  );
  for (const locale of Object.values(RECORDING_REFERENCE))
    for (const value of Object.values(locale)) assert.ok(value.length > 0);
});
