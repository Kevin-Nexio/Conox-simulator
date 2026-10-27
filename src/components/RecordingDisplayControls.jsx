import {
  REFERENCE_PROFILES,
  getReferenceProfile,
} from "../recordings/referenceProfiles.js";

export default function RecordingDisplayControls({
  settings,
  onChange,
  locked,
  t,
  reference = false,
}) {
  const profile = getReferenceProfile(settings.referenceProfile);
  const android = profile.id === "android-2.4";
  const choices = [
    [
      "eegMotion",
      "reference.eegMotion",
      "reference.eegMotion",
      [
        ["sweep", t("reference.sweep")],
        ["scroll", t("reference.scroll")],
      ],
    ],
    [
      "referenceProfile",
      "reference.profile",
      "reference.profile",
      Object.values(REFERENCE_PROFILES).map((entry) => [entry.id, entry.name]),
    ],
    [
      "eegWindow",
      "recording.eegWindow",
      "recording.eegWindow",
      profile.eegWindows.map((value) => [value, `${value} s`]),
    ],
    [
      "amplitude",
      "recording.amplitudeShort",
      "recording.amplitude",
      profile.amplitudes.map((value) => [
        value,
        `${android ? "±" : ""}${value} µV`,
      ]),
    ],
    [
      "dsaWindow",
      "recording.dsaWindow",
      "recording.dsaWindow",
      [
        [0, t("recording.whole")],
        ...profile.dsaWindows
          .filter((value) => value > 0)
          .map((value) => [
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
      {choices
        .filter(([key]) => !reference || key !== "colorOffset")
        .map(([key, label, description, options]) => (
          <label key={key} title={t(description)}>
            <span>{t(label)}</span>
            <select
              aria-label={t(description)}
              value={settings[key]}
              onChange={(event) =>
                onChange({
                  [key]:
                    key === "referenceProfile" || key === "eegMotion"
                      ? event.target.value
                      : Number(event.target.value),
                })
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
        ]
          .filter(([key]) => !reference || key === "guides")
          .map(([key, caption, description]) => (
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
