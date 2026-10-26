export default function RecordingDisplayControls({
  settings,
  onChange,
  locked,
  t,
}) {
  const choices = [
    [
      "eegWindow",
      "recording.eegWindow",
      "recording.eegWindow",
      [2, 4, 8].map((value) => [value, `${value} s`]),
    ],
    [
      "amplitude",
      "recording.amplitudeShort",
      "recording.amplitude",
      [25, 50, 120, 475].map((value) => [value, `±${value} µV*`]),
    ],
    [
      "dsaWindow",
      "recording.dsaWindow",
      "recording.dsaWindow",
      [
        [0, t("recording.whole")],
        ...[60, 300, 1800].map((value) => [
          value,
          t("recording.minutes", { count: value / 60 }),
        ]),
      ],
    ],
    [
      "colorOffset",
      "recording.colorShort",
      "recording.color",
      [-16, -12, -8, -4, 0, 4, 8, 12, 16].map((value) => [
        value,
        `${value > 0 ? "+" : ""}${value} dB`,
      ]),
    ],
  ];
  return (
    <fieldset
      className="recording-display-controls"
      disabled={locked}
      aria-label={t("display.heading")}
    >
      {choices.map(([key, label, description, options]) => (
        <label key={key} title={t(description)}>
          <span>{t(label)}</span>
          <select
            aria-label={t(description)}
            value={settings[key]}
            onChange={(event) =>
              onChange({ [key]: Number(event.target.value) })
            }
          >
            {options.map(([value, caption]) => (
              <option key={value} value={value}>
                {caption}
              </option>
            ))}
          </select>
        </label>
      ))}
      <div className="recording-display-toggles">
        {[
          ["guides", t("recording.gridShort"), t("recording.grid")],
          ["sef50", "SEF50", "SEF50"],
          ["sef95", "SEF95", "SEF95"],
        ].map(([key, caption, description]) => (
          <label key={key} className="recording-check" title={description}>
            <input
              type="checkbox"
              checked={settings[key]}
              aria-label={description}
              onChange={(event) => onChange({ [key]: event.target.checked })}
            />
            {caption}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
