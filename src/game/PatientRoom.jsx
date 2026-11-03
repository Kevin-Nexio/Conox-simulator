import { useState } from "react";

const BRIEFING = [
  {
    label: "Treatment goal",
    title: "Deep sedation has a reason.",
    text: "Early severe ARDS. For this patient, the team has chosen temporary deep sedation to support controlled, lung-protective ventilation. Prone positioning is being prepared.",
  },
  {
    label: "At the bedside",
    title: "Intubated. Ventilated. Closely observed.",
    text: "Propofol is running. Blood pressure, ECG and oxygenation remain essential clinical context, but they do not measure sedation depth. Ventilator tolerance alone does not establish consciousness.",
  },
  {
    label: "Clinical assessment",
    title: "Target RASS −4. Observed RASS −4.",
    text: "No response to voice; movement to physical stimulation. There is no neuromuscular blockade in this teaching case. This assessment does not tell us whether the EEG is continuous or suppressed.",
  },
];

export default function PatientRoom() {
  const [detail, setDetail] = useState(0);
  return (
    <div className="clinical-room">
      <div className="clinical-illustration">
        <span className="clinical-room-label">ICU · ACUTE PHASE</span>
        <svg
          viewBox="0 0 820 410"
          role="img"
          aria-label="Illustrative ICU scene: an intubated adult in a bed connected to a ventilator, infusion pumps and bedside monitoring. Prone positioning is being prepared."
        >
          <defs>
            <linearGradient id="clinical-wall" x2="0" y2="1">
              <stop stopColor="#d7eeeb" />
              <stop offset="1" stopColor="#edf5f8" />
            </linearGradient>
            <linearGradient id="clinical-blanket" x2="1" y2="1">
              <stop stopColor="#409c93" />
              <stop offset="1" stopColor="#226c75" />
            </linearGradient>
          </defs>
          <rect
            x="8"
            y="8"
            width="804"
            height="380"
            rx="24"
            fill="url(#clinical-wall)"
          />
          <rect
            x="44"
            y="49"
            width="215"
            height="124"
            rx="10"
            fill="#f6fcff"
            stroke="#b6d4db"
            strokeWidth="5"
          />
          <path d="M151 51v120M47 111h209" stroke="#cce2e7" strokeWidth="4" />
          <rect
            x="301"
            y="80"
            width="265"
            height="31"
            rx="7"
            fill="#fff"
            stroke="#c5dade"
          />
          <circle cx="327" cy="96" r="7" fill="#277c8b" />
          <circle cx="351" cy="96" r="7" fill="#d4ad59" />
          <circle cx="375" cy="96" r="7" fill="#b1c8d0" />
          <path d="M10 331h800" stroke="#b5d1d8" strokeWidth="3" />
          <ellipse
            cx="353"
            cy="369"
            rx="276"
            ry="19"
            fill="#759da6"
            opacity=".16"
          />
          <path d="M111 287v61m399-63v63" stroke="#7f9ba9" strokeWidth="13" />
          <path d="M111 348h399" stroke="#a0bac4" strokeWidth="9" />
          <circle cx="110" cy="359" r="13" fill="#506c7f" />
          <circle cx="510" cy="359" r="13" fill="#506c7f" />
          <rect
            x="72"
            y="252"
            width="491"
            height="47"
            rx="15"
            fill="#c5dce4"
            stroke="#8eafb9"
            strokeWidth="3"
          />
          <path
            d="M86 251l31-45h112l27 30h282v24H86Z"
            fill="#fff"
            stroke="#d7e5eb"
            strokeWidth="3"
          />
          <rect
            x="120"
            y="184"
            width="112"
            height="66"
            rx="22"
            fill="#f9fcff"
            transform="rotate(9 170 215)"
          />
          <path
            d="M211 223q69-20 116 2q60-8 109 5l85 17v22H205Z"
            fill="url(#clinical-blanket)"
          />
          <path
            d="M281 226l-1 41m98-36l4 36"
            stroke="#68b9ae"
            strokeWidth="3"
            opacity=".7"
          />
          <ellipse
            cx="176"
            cy="210"
            rx="38"
            ry="33"
            fill="#dfb99a"
            transform="rotate(10 176 210)"
          />
          <path
            d="M138 209q-3-42 35-40q36 1 42 34q-25-24-48-16q-13 4-29 22"
            fill="#535b64"
          />
          <path
            d="M174 205l10 2m5 16l9 1"
            stroke="#8c6355"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M199 222l14 3" stroke="#f8f6ec" strokeWidth="12" />
          <path
            d="M201 223h25q22 0 28-23q8-28 46-28h275q25 0 25 26v62h44"
            fill="none"
            stroke="#609caf"
            strokeWidth="13"
          />
          <path
            d="M201 223h25q22 0 28-23q8-28 46-28h275q25 0 25 26v62h44"
            fill="none"
            stroke="#d0eef3"
            strokeWidth="6"
            strokeDasharray="3 4"
          />
          <path
            d="M264 235q-17 11 5 18l67 4"
            stroke="#dfb99a"
            strokeWidth="15"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="299" y="248" width="13" height="13" rx="3" fill="#f7fbfc" />
          <path
            d="M306 251q43-28 71-91h179"
            fill="none"
            stroke="#8f6eb1"
            strokeWidth="2"
          />
          <path
            d="M94 278h440m-427-25v40m104-40v40m185-40v40m101-40v40"
            stroke="#aec9d4"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M660 130v225m-39 5h80"
            stroke="#8ba7b2"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <rect
            x="600"
            y="42"
            width="166"
            height="103"
            rx="12"
            fill="#3c586b"
          />
          <rect x="610" y="52" width="146" height="80" rx="6" fill="#102b3a" />
          <path
            d="M619 84h24l5-9 6 26 6-39 7 22h78"
            stroke="#6addba"
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M619 108q9-16 18 0t18 0t18 0t18 0t18 0t18 0"
            stroke="#6fc9ec"
            strokeWidth="2"
            fill="none"
          />
          <text x="619" y="122" fill="#bfd6df" fontSize="9">
            ECG · BP · SpO₂
          </text>
          <rect
            x="530"
            y="137"
            width="59"
            height="79"
            rx="8"
            fill="#f9fcff"
            stroke="#90adb9"
            strokeWidth="3"
          />
          <rect x="539" y="148" width="41" height="22" rx="3" fill="#276f7d" />
          <text x="558" y="162" fill="white" textAnchor="middle" fontSize="8">
            INFUSION
          </text>
          <text x="559" y="186" fill="#365362" textAnchor="middle" fontSize="9">
            Propofol
          </text>
          <circle cx="558" cy="201" r="5" fill="#61ab9d" />
          <rect
            x="627"
            y="221"
            width="150"
            height="111"
            rx="12"
            fill="#f7fbfd"
            stroke="#8eaebd"
            strokeWidth="4"
          />
          <rect x="639" y="233" width="126" height="65" rx="5" fill="#173f53" />
          <text x="647" y="247" fontSize="9" fill="#c8ebf1">
            CONTROLLED VENTILATION
          </text>
          <path
            d="M646 278h7v-17h19v17h16v-17h19v17h16v-17h19v17h15"
            stroke="#59c6ea"
            strokeWidth="2.5"
            fill="none"
          />
          <circle cx="744" cy="315" r="8" fill="#76afbc" />
          <path
            d="M652 314h55"
            stroke="#b3cbd4"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="624" cy="364" r="8" fill="#506c7f" />
          <circle cx="700" cy="364" r="8" fill="#506c7f" />
        </svg>
        <div className="clinical-room-caption">
          <b>Severe ARDS</b>
          <span>Intubated · Propofol · Proning planned</span>
        </div>
      </div>
      <div className="clinical-briefing">
        <div className="clinical-goal">
          <span>THIS PATIENT’S GOAL</span>
          <b>RASS −4</b>
          <small>Temporary deep sedation</small>
        </div>
        <div
          className="clinical-tabs"
          aria-label="Explore the clinical context"
        >
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
