export function impedanceReadout(values = [], states = []) {
  return [0, 1, 2]
    .map(
      (index) =>
        `${["+", "−", "REF"][index]}: ${states[index]?.kind === "tooHigh" ? "TH" : Number.isFinite(values[index]) ? values[index] : "--"}`,
    )
    .join(" · ");
}

export default function RecordingImpedances({
  values,
  states,
  t,
  referenceProfile = "ios-1.1",
}) {
  return (
    <div
      className="recording-impedances"
      title={t(`recording.impedanceHelp.${referenceProfile}`)}
    >
      <span>{t("recording.impedance")} (kΩ)</span>
      <strong>{impedanceReadout(values, states)}</strong>
    </div>
  );
}
