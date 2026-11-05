import { useGameI18n } from "./GameI18n.jsx";
import { useState } from "react";
import PatientScene from "./PatientScene.jsx";

export default function PatientRoom() {
  const { t } = useGameI18n();
  const BRIEFING = [0, 1, 2].map((index) => ({
    label: t(`room.label.${index}`),
    title: t(`room.title.${index}`),
    text: t(`room.text.${index}`),
  }));
  const [detail, setDetail] = useState(0);
  return (
    <div className="clinical-room">
      <div className="clinical-illustration">
        <span className="clinical-room-label">{t("room.phase")}</span>
        <PatientScene />
        <div className="clinical-room-caption">
          <b>{t("room.ards")}</b>
          <span>{t("room.caption")}</span>
        </div>
        <p className="clinical-focus-note">
          <b>{t("room.focusTitle")}</b> {t("room.focusCopy")}
        </p>
      </div>
      <div className="clinical-briefing">
        <div className="clinical-goal">
          <span>{t("room.goal")}</span>
          <b>RASS −4</b>
          <small>{t("room.sedation")}</small>
        </div>
        <div className="clinical-tabs" aria-label={t("room.context")}>
          {BRIEFING.map((item, i) => (
            <button
              key={item.label}
              aria-pressed={detail === i}
              onClick={() => setDetail(i)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="clinical-detail" aria-live="polite">
          <h2>{BRIEFING[detail].title}</h2>
          <p>{BRIEFING[detail].text}</p>
        </div>
      </div>
    </div>
  );
}
