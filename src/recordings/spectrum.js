const FFT_SIZE = 2048;
const HOP_SECONDS = 1;
const HIGH_PASS_HZ = 0.5;
const LOW_PASS_HZ = 45;
const DB_FLOOR = -120;

function biquadCoefficients(type, frequency, sampleRate) {
  const omega = (2 * Math.PI * frequency) / sampleRate;
  const cosine = Math.cos(omega);
  const alpha = Math.sin(omega) / (2 * Math.SQRT1_2);
  const a0 = 1 + alpha;
  const b0 = type === "highpass" ? (1 + cosine) / 2 : (1 - cosine) / 2;
  const b1 = type === "highpass" ? -(1 + cosine) : 1 - cosine;
  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b0 / a0,
    a1: (-2 * cosine) / a0,
    a2: (1 - alpha) / a0,
  };
}

/** Causal second-order Butterworth high-pass and low-pass, without resampling. */
export function getFilteredEeg(recording) {
  const { samples, sampleRate } = recording;
  if (!samples || !Number.isFinite(sampleRate) || sampleRate <= 90) {
    throw new RangeError("INVALID_SIGNAL");
  }
  const output = new Float32Array(samples.length);
  if (!samples.length) return output;
  const hp = biquadCoefficients("highpass", HIGH_PASS_HZ, sampleRate);
  const lp = biquadCoefficients("lowpass", LOW_PASS_HZ, sampleRate);
  // Initialise the high-pass at the first input level to suppress a synthetic
  // start-up response to the recording's DC offset. No samples are discarded.
  let hx1 = samples[0];
  let hx2 = samples[0];
  let hy1 = 0;
  let hy2 = 0;
  let lx1 = 0;
  let lx2 = 0;
  let ly1 = 0;
  let ly2 = 0;
  for (let i = 0; i < samples.length; i++) {
    const input = samples[i];
    const high =
      hp.b0 * input + hp.b1 * hx1 + hp.b2 * hx2 - hp.a1 * hy1 - hp.a2 * hy2;
    const low =
      lp.b0 * high + lp.b1 * lx1 + lp.b2 * lx2 - lp.a1 * ly1 - lp.a2 * ly2;
    output[i] = low;
    hx2 = hx1;
    hx1 = input;
    hy2 = hy1;
    hy1 = high;
    lx2 = lx1;
    lx1 = high;
    ly2 = ly1;
    ly1 = low;
  }
  return output;
}

function fftInPlace(real, imaginary) {
  const length = real.length;
  for (let i = 1, j = 0; i < length; i++) {
    let bit = length >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imaginary[i], imaginary[j]] = [imaginary[j], imaginary[i]];
    }
  }
  for (let size = 2; size <= length; size *= 2) {
    const angle = (-2 * Math.PI) / size;
    const stepReal = Math.cos(angle);
    const stepImaginary = Math.sin(angle);
    const half = size / 2;
    for (let start = 0; start < length; start += size) {
      let factorReal = 1;
      let factorImaginary = 0;
      for (let j = 0; j < half; j++) {
        const even = start + j;
        const odd = even + half;
        const oddReal =
          real[odd] * factorReal - imaginary[odd] * factorImaginary;
        const oddImaginary =
          real[odd] * factorImaginary + imaginary[odd] * factorReal;
        real[odd] = real[even] - oddReal;
        imaginary[odd] = imaginary[even] - oddImaginary;
        real[even] += oddReal;
        imaginary[even] += oddImaginary;
        const nextReal =
          factorReal * stepReal - factorImaginary * stepImaginary;
        factorImaginary =
          factorReal * stepImaginary + factorImaginary * stepReal;
        factorReal = nextReal;
      }
    }
  }
}

function windowedPower(samples, offset, count, fftSize, sampleRate, work) {
  const { real, imaginary } = work;
  real.fill(0);
  imaginary.fill(0);
  let mean = 0;
  for (let i = 0; i < count; i++) mean += samples[offset + i];
  mean /= count;
  let windowEnergy = 0;
  for (let i = 0; i < count; i++) {
    const window =
      count <= 2 ? 1 : 0.5 * (1 - Math.cos((2 * Math.PI * i) / (count - 1)));
    real[i] = (samples[offset + i] - mean) * window;
    windowEnergy += window * window;
  }
  fftInPlace(real, imaginary);
  const power = new Float64Array(fftSize / 2 + 1);
  const denominator = sampleRate * windowEnergy;
  for (let bin = 0; bin < power.length; bin++) {
    const multiplier = bin > 0 && bin < fftSize / 2 ? 2 : 1;
    power[bin] =
      (multiplier * (real[bin] ** 2 + imaginary[bin] ** 2)) / denominator;
  }
  return power;
}

/**
 * One-sided Hann-windowed PSD. Inputs are in microvolts; output power is
 * microvolts squared per Hz, and db = 10 log10(power / 1 microvolt²/Hz).
 * The window mean is removed. Zero-padding does not change the power scale.
 */
export function powerSpectrum(samples, sampleRate = 1024, fftSize) {
  const size =
    fftSize || 2 ** Math.ceil(Math.log2(Math.max(2, samples.length)));
  if (
    !samples.length ||
    !Number.isFinite(sampleRate) ||
    sampleRate <= 0 ||
    !Number.isInteger(size) ||
    size < samples.length ||
    size < 2 ||
    (size & (size - 1)) !== 0
  ) {
    throw new RangeError("INVALID_SPECTRUM_INPUT");
  }
  const power = windowedPower(samples, 0, samples.length, size, sampleRate, {
    real: new Float64Array(size),
    imaginary: new Float64Array(size),
  });
  const binWidth = sampleRate / size;
  const frequencies = Float32Array.from(power, (_, bin) => bin * binWidth);
  const db = Float32Array.from(power, (value) =>
    Math.max(DB_FLOOR, 10 * Math.log10(Math.max(1e-12, value))),
  );
  return { frequencies, power, db, binWidth };
}

function spectralEdge(power, binWidth, fraction, maximumBin) {
  const minimumBin = Math.ceil(HIGH_PASS_HZ / binWidth);
  let total = 0;
  for (let bin = minimumBin; bin <= maximumBin; bin++) total += power[bin];
  if (total <= 1e-12) return null;
  const target = total * fraction;
  let cumulative = 0;
  for (let bin = minimumBin; bin <= maximumBin; bin++) {
    cumulative += power[bin];
    if (cumulative >= target) return bin * binWidth;
  }
  return maximumBin * binWidth;
}

/**
 * Two-second FFT windows, one-second hops, 0..45 Hz. Column times mark window
 * centres. SEF values describe this reconstruction's 0.5..45 Hz band, not the
 * device's undocumented processing. Run this function in a worker for long cases.
 */
export function buildSpectrogram(recording, filteredSamples) {
  const { sampleRate } = recording;
  const samples = filteredSamples || getFilteredEeg(recording);
  if (
    !samples.length ||
    samples.length !== recording.samples.length ||
    sampleRate !== 1024
  ) {
    throw new RangeError("INVALID_SPECTROGRAM_INPUT");
  }
  const binWidth = sampleRate / FFT_SIZE;
  const maximumBin = Math.floor(LOW_PASS_HZ / binWidth);
  const frequencies = Float32Array.from(
    { length: maximumBin + 1 },
    (_, bin) => bin * binWidth,
  );
  const work = {
    real: new Float64Array(FFT_SIZE),
    imaginary: new Float64Array(FFT_SIZE),
  };
  const count = Math.min(FFT_SIZE, samples.length);
  const finalOffset = Math.max(0, samples.length - FFT_SIZE);
  const hopSamples = HOP_SECONDS * sampleRate;
  const columns = [];
  for (let offset = 0; offset <= finalOffset; offset += hopSamples) {
    const power = windowedPower(
      samples,
      offset,
      count,
      FFT_SIZE,
      sampleRate,
      work,
    );
    const db = Float32Array.from(frequencies, (_, bin) =>
      Math.max(DB_FLOOR, 10 * Math.log10(Math.max(1e-12, power[bin]))),
    );
    columns.push({
      time: (offset + count / 2) / sampleRate,
      db,
      sef50: spectralEdge(power, binWidth, 0.5, maximumBin),
      sef95: spectralEdge(power, binWidth, 0.95, maximumBin),
    });
  }
  return {
    columns,
    frequencies,
    minDb: -30,
    maxDb: 50,
    units: "dB re 1 µV²/Hz",
    windowSeconds: FFT_SIZE / sampleRate,
    hopSeconds: HOP_SECONDS,
    bandHz: [HIGH_PASS_HZ, LOW_PASS_HZ],
  };
}
