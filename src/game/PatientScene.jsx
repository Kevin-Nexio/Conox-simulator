import { useId } from "react";

// The airway, IV infusion and optional EEG lead have separate destinations.
export default function PatientScene({ withEeg = false }) {
  const id = useId();
  const blanket = `${id}-blanket`;
  const spectrum = `${id}-spectrum`;
  return (
    <svg
      className="patient-scene"
      viewBox="0 0 1000 540"
      role="img"
      aria-label={
        withEeg
          ? "Illustrative ICU scene. Propofol is delivered by a separate Agilia-style syringe pump through an IV line to the patient's hand. The breathing circuit connects the mouth to the ventilator. A Conox monitor connects to a forehead EEG sensor."
          : "Illustrative ICU scene. Propofol is delivered by a separate Agilia-style syringe pump through an IV line to the patient's hand. The breathing circuit connects the mouth to the ventilator. A bedside monitor shows ECG and oxygenation traces."
      }
    >
      <defs>
        <linearGradient id={blanket} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#74c5bb" />
          <stop offset="1" stopColor="#2d8f94" />
        </linearGradient>
        <linearGradient id={spectrum} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#123468" />
          <stop offset=".45" stopColor="#2a9bcc" />
          <stop offset=".72" stopColor="#f1c54b" />
          <stop offset="1" stopColor="#df754e" />
        </linearGradient>
      </defs>
      <rect x="10" y="12" width="980" height="505" rx="38" fill="#dcefeb" />
      <path d="M12 454h976v25q0 38-38 38H50q-38 0-38-38Z" fill="#d2e4e9" />
      <path d="M12 454h976" stroke="#bbd5dc" strokeWidth="3" />
      <rect
        x="249"
        y="54"
        width="390"
        height="180"
        rx="20"
        fill="#eff9fa"
        stroke="#c0dce0"
        strokeWidth="5"
      />
      <path d="M444 57v174M253 144h382" stroke="#d3e8eb" strokeWidth="4" />
      <circle cx="310" cy="101" r="22" fill="#d8efed" />
      <path d="M285 216q70-64 140-16q95-65 194 9v22H253Z" fill="#e1f0ee" />
      <ellipse cx="490" cy="493" rx="280" ry="18" fill="#416d7d" opacity=".1" />

      {/* Each device stands separately from the patient and the other circuits. */}
      <path
        d="M121 175v305m-52 5h104"
        stroke="#91acb7"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="69" cy="494" r="9" fill="#4f7183" />
      <circle cx="173" cy="494" r="9" fill="#4f7183" />
      <path
        d="M865 216v270m-57 0h115"
        stroke="#91acb7"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="809" cy="496" r="10" fill="#4f7183" />
      <circle cx="923" cy="496" r="10" fill="#4f7183" />

      {/* Bed, pillow and a softly rounded patient illustration. */}
      <path
        d="M235 415v61m450-61v61M235 474h450"
        stroke="#88a9b5"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <circle cx="235" cy="488" r="14" fill="#527185" />
      <circle cx="685" cy="488" r="14" fill="#527185" />
      <rect
        x="187"
        y="371"
        width="553"
        height="67"
        rx="24"
        fill="#bcd5df"
        stroke="#8eaebb"
        strokeWidth="4"
      />
      <path
        d="M196 375l30-69q5-12 20-12h103l39 63h335v35H196Z"
        fill="#f9fdff"
        stroke="#d8e7ee"
        strokeWidth="3"
      />
      <rect
        x="220"
        y="283"
        width="151"
        height="83"
        rx="30"
        fill="#fff"
        transform="rotate(9 285 324)"
      />
      <ellipse
        cx="289"
        cy="321"
        rx="56"
        ry="48"
        fill="#f0ceb3"
        transform="rotate(8 289 321)"
      />
      <ellipse cx="236" cy="324" rx="10" ry="14" fill="#e8bfa6" />
      <path
        d="M235 310q-6-48 44-50q52-8 64 44q-21-21-44-17q-8 10-25 9q-19-3-39 14Z"
        fill="#5d626f"
      />
      <path
        d="M254 320q8 8 17 1m20 3q8 8 17 1"
        fill="none"
        stroke="#745c59"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <ellipse cx="256" cy="338" rx="11" ry="6" fill="#e8a7a0" opacity=".65" />
      <ellipse cx="309" cy="344" rx="10" ry="6" fill="#e8a7a0" opacity=".65" />
      <path
        d="M281 328q-3 8 3 8"
        stroke="#c39c86"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M336 346q66-25 135 3q73-13 136 8q64-2 111 28v22H327Z"
        fill={`url(#${blanket})`}
      />
      <path
        d="M414 350l-2 51m100-47l5 49m84-42l13 44"
        stroke="#a3dad1"
        strokeWidth="3.5"
        opacity=".6"
      />
      <path
        d="M363 361q-23 12-6 21l86 7"
        fill="none"
        stroke="#efcbb0"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <path
        d="M429 385l17 2m-16 6l15 1"
        stroke="#d9ad94"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="414"
        y="378"
        width="23"
        height="19"
        rx="5"
        fill="#fff"
        stroke="#c7d8df"
      />
      <rect x="421" y="382" width="10" height="11" rx="3" fill="#94bed1" />
      <path
        d="M207 419h514m-493-30v44m96-36v36m250-36v36m121-36v36"
        stroke="#93b4c2"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Agilia-inspired syringe pump: IV tubing exits the syringe, never the airway. */}
      <rect
        x="33"
        y="204"
        width="179"
        height="126"
        rx="24"
        fill="#f9fcff"
        stroke="#88a8bc"
        strokeWidth="4"
      />
      <rect x="43" y="216" width="159" height="24" rx="9" fill="#3272b2" />
      <text x="56" y="233" fill="#fff" fontSize="16" fontWeight="800">
        Agilia
      </text>
      <rect
        x="48"
        y="248"
        width="80"
        height="45"
        rx="7"
        fill="#e1eecc"
        stroke="#b7cbaa"
      />
      <path
        d="M65 265q5-6 10 0m19 0q5-6 10 0m-28 11q9 7 17 0"
        stroke="#5d7d6e"
        fill="none"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx="151" cy="261" r="8" fill="#8bc0b3" />
      <circle cx="180" cy="261" r="8" fill="#b9d3e5" />
      <rect x="142" y="279" width="48" height="10" rx="4" fill="#b7cedf" />
      <path
        d="M57 310h121"
        stroke="#316fa6"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M60 301v18m-14-9h16" stroke="#8aa8b9" strokeWidth="4" />
      <rect
        x="69"
        y="299"
        width="96"
        height="20"
        rx="4"
        fill="#fff"
        stroke="#91aabb"
        strokeWidth="2"
      />
      <path
        d="M86 301v7m13-7v7m13-7v7m13-7v7m13-7v7"
        stroke="#a1b7c1"
        strokeWidth="1.5"
      />
      <path d="M166 310h17" stroke="#91aabb" strokeWidth="6" />
      <path
        d="M184 310h16q15 0 15 16v39q0 18 19 18h191"
        stroke="#bb8a3d"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <rect
        x="45"
        y="344"
        width="155"
        height="33"
        rx="13"
        fill="#fff9e8"
        stroke="#ddc99d"
      />
      <text
        x="122"
        y="366"
        fill="#8c602b"
        fontSize="17"
        fontWeight="800"
        textAnchor="middle"
      >
        Propofol · IV
      </text>

      {/* A distinct respiratory circuit leads from the mouth to the ventilator. */}
      <path
        d="M321 347h17"
        stroke="#f6f3e8"
        strokeWidth="17"
        strokeLinecap="round"
      />
      <path
        d="M327 347h27q25 0 31-27q6-28 34-28h291q48 0 48 43h31"
        stroke="#4597ad"
        strokeWidth="15"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M327 347h27q25 0 31-27q6-28 34-28h291q48 0 48 43h31"
        stroke="#c8edf3"
        strokeWidth="7"
        strokeDasharray="3 5"
        fill="none"
      />
      <rect
        x="770"
        y="289"
        width="197"
        height="151"
        rx="22"
        fill="#f8fcff"
        stroke="#8dabbc"
        strokeWidth="4"
      />
      <rect x="783" y="304" width="171" height="98" rx="10" fill="#183b51" />
      <text x="798" y="325" fill="#d5eef6" fontSize="14" fontWeight="700">
        {"VENTILATOR"}
      </text>
      <path
        d="M795 368h9v-24h25v24h20v-24h25v24h20v-24h25v24h23"
        fill="none"
        stroke="#6ecbe7"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <text x="798" y="390" fill="#b6dce7" fontSize="12">
        {"Controlled ventilation"}
      </text>
      <path
        d="M794 421h86"
        stroke="#b7ced9"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="929" cy="420" r="10" fill="#9fc8d5" />

      {/* A larger bedside screen, with illustrative traces and no invented vital signs. */}
      <rect x="755" y="61" width="221" height="171" rx="24" fill="#45657b" />
      <rect x="768" y="74" width="195" height="143" rx="13" fill="#112d40" />
      <text x="781" y="95" fill="#b5e5dd" fontSize="13" fontWeight="700">
        {"ECG"}
      </text>
      <path
        d="M782 120h20l7-10 7 25 8-41 9 26h116"
        fill="none"
        stroke="#81d8b8"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <text x="781" y="158" fill="#b9dff2" fontSize="13">
        SpO₂
      </text>
      <path
        d="M825 160q10-22 20 0t20 0t20 0t20 0t20 0t20 0"
        fill="none"
        stroke="#83c9ee"
        strokeWidth="3"
      />
      <text x="781" y="198" fill="#b9d1e0" fontSize="13">
        {"Blood pressure"}
      </text>
      <path d="M920 194h27" stroke="#b9d1e0" strokeWidth="3" />

      {withEeg && (
        <g>
          <path
            d="M457 231v23m-38 0h76"
            stroke="#8ea5b1"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <rect
            x="322"
            y="53"
            width="283"
            height="188"
            rx="35"
            fill="#172c3c"
            stroke="#93aaba"
            strokeWidth="4"
          />
          <rect
            x="339"
            y="75"
            width="249"
            height="133"
            rx="9"
            fill="#071821"
            stroke="#6e8795"
            strokeWidth="2"
          />
          <rect x="346" y="82" width="172" height="14" rx="3" fill="#609d81" />
          <rect x="523" y="82" width="57" height="14" rx="3" fill="#b5c8d2" />
          <path
            d="M346 123l8-6 8 13 8-19 8 21 8-17 8 11 8-5 8 7 8-17 8 18 8-11 8 7 8-15 8 19 8-13 8 7 8-5 8 4 8-7 6 5"
            fill="none"
            stroke="#bddee0"
            strokeWidth="2"
          />
          <rect
            x="346"
            y="143"
            width="172"
            height="55"
            rx="3"
            fill={`url(#${spectrum})`}
          />
          <path
            d="M346 163h172m-172 21h172"
            stroke="#f8d270"
            strokeWidth="3"
            opacity=".7"
          />
          <text
            x="550"
            y="119"
            fill="#cbdbe2"
            fontSize="12"
            textAnchor="middle"
          >
            qCON
          </text>
          <text
            x="550"
            y="144"
            fill="#dce8ed"
            fontSize="24"
            textAnchor="middle"
          >
            --
          </text>
          <text
            x="463"
            y="226"
            fill="#d9e4ea"
            fontSize="15"
            textAnchor="middle"
            letterSpacing="2"
          >
            CONOX · EEG
          </text>
          <path
            d="M339 230h-59q-33 0-33 32v23"
            fill="none"
            stroke="#8b76b0"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M246 285l49 13"
            fill="none"
            stroke="#f9fcff"
            strokeWidth="13"
            strokeLinecap="round"
          />
          <circle cx="248" cy="286" r="5" fill="#b19bc9" />
          <circle cx="271" cy="292" r="5" fill="#b19bc9" />
          <circle cx="294" cy="298" r="5" fill="#b19bc9" />
        </g>
      )}
    </svg>
  );
}
