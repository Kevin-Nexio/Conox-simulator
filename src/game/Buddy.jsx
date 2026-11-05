import { useGameI18n } from "./GameI18n.jsx";
import buddyUrl from "./assets/coni.png";
export default function Buddy() {
  const { t } = useGameI18n();
  return <img className="game-buddy" src={buddyUrl} alt={t("buddy.alt")} />;
}
