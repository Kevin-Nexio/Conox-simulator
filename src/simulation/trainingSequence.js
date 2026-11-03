// Opt-in teaching timelines. These interpolate reference signal profiles, not
// drug concentrations, patient responses or proprietary Conox index algorithms.
const bounded = (value, min, max) => Math.max(min, Math.min(max, value));
const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (!isObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, clone(item)]),
  );
}

function mergeProfile(base, patch) {
  const result = clone(base);
  for (const [key, value] of Object.entries(patch)) {
    if (["__proto__", "prototype", "constructor"].includes(key)) continue;
    result[key] =
      isObject(value) && isObject(base[key])
        ? mergeProfile(base[key], value)
        : clone(value);
  }
  return result;
}

function interpolate(left, right, fraction) {
  if (Number.isFinite(left) && Number.isFinite(right))
    return left + (right - left) * fraction;
  if (isObject(left) && isObject(right)) {
    return Object.fromEntries(
      [...new Set([...Object.keys(left), ...Object.keys(right)])].map((key) => [
        key,
        interpolate(left[key], right[key], fraction),
      ]),
    );
  }
  // Flags and named patterns switch at a keyframe, never halfway through it.
  return clone(fraction < 1 ? left : right);
}

/** Undefined options preserve the ordinary simulator path entirely. */
export function createTrainingSequence(baseProfile, options) {
  if (options == null) return null;
  if (!isObject(options))
    throw new TypeError("Training options must be an object");
  if (options.historySeconds != null && options.historySeconds !== 0)
    throw new RangeError(
      "Training history must start at zero; prerecorded history is not generated",
    );
  const eegWindowSeconds = options.eegWindowSeconds ?? 8;
  const trendWindowMinutes = options.trendWindowMinutes ?? 1;
  const suppressionCycleSeconds = options.suppressionCycleSeconds ?? 7.8;
  if (![2, 4, 8].includes(eegWindowSeconds))
    throw new RangeError("Training EEG window must be 2, 4 or 8 seconds");
  if (![1, 5, 30, 120, 360].includes(trendWindowMinutes))
    throw new RangeError("Unsupported training trend window");
  if (
    !Number.isFinite(suppressionCycleSeconds) ||
    suppressionCycleSeconds < 1 ||
    suppressionCycleSeconds > 60
  )
    throw new RangeError(
      "Training suppression cycle must be between 1 and 60 seconds",
    );
  const sequence = options.sequence ?? [];
  if (!Array.isArray(sequence))
    throw new TypeError("Training sequence must be an array");
  let previous = -1;
  const frames = sequence.map((frame) => {
    if (
      !isObject(frame) ||
      !Number.isFinite(frame.at) ||
      frame.at < 0 ||
      frame.at <= previous ||
      !isObject(frame.profile)
    )
      throw new RangeError(
        "Training keyframes need increasing nonnegative times and a profile",
      );
    previous = frame.at;
    return { at: frame.at, profile: mergeProfile(baseProfile, frame.profile) };
  });
  if (!frames.length || frames[0].at > 0)
    frames.unshift({ at: 0, profile: clone(baseProfile) });
  return {
    frames,
    duration: frames.at(-1).at,
    eegWindowSeconds,
    trendWindowMinutes,
    suppressionCycleSeconds,
    historySeconds: 0,
    retentionSeconds: trendWindowMinutes * 60,
  };
}

/** Clamp at both ends; the last reference continues without replaying the story. */
export function trainingProfileAt(training, elapsed) {
  if (!training) return null;
  const time = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const frames = training.frames;
  if (time <= frames[0].at) return clone(frames[0].profile);
  for (let index = 1; index < frames.length; index++) {
    const right = frames[index];
    if (time <= right.at) {
      const left = frames[index - 1];
      return interpolate(
        left.profile,
        right.profile,
        (time - left.at) / (right.at - left.at),
      );
    }
  }
  return clone(frames.at(-1).profile);
}

/** The activity is centred in each cycle. Changing cycle length preserves the
 * configured suppression fraction, including the 0% and 100% endpoints. */
export function trainingSuppressionAt(elapsed, bsr, cycleSeconds) {
  const duty = bounded(Number.isFinite(bsr) ? bsr / 100 : 0, 0, 1);
  if (duty === 0) return { suppressed: false, burstEnvelope: 1 };
  if (duty === 1) return { suppressed: true, burstEnvelope: 0 };
  const cycle =
    Number.isFinite(cycleSeconds) && cycleSeconds > 0 ? cycleSeconds : 7.8;
  const time = Number.isFinite(elapsed) ? elapsed : 0;
  const phase = (((time % cycle) + cycle) % cycle) / cycle;
  const halfActivity = (1 - duty) / 2;
  const distance = Math.abs(phase - 0.5);
  const suppressed = distance >= halfActivity;
  const ramp = Math.min(0.08, halfActivity * 0.6);
  const x = bounded(
    (halfActivity - distance) / Math.max(ramp, Number.EPSILON),
    0,
    1,
  );
  return { suppressed, burstEnvelope: x * x * (3 - 2 * x) };
}
