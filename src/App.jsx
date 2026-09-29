import * as React from "react";
import QRCode from "qrcode";
import { joinRoom } from "trystero";
import {
  DEFAULT_RENDER_SETTINGS,
  EFFECT_LEVELS,
  ANALGESIC_PROFILES,
  NARKOSE_REISE_DAUER,
  DSA_COLOR_STOPS,
} from "./data/index.js";
import { createI18n, getInitialLocale, LOCALES } from "./i18n/index.js";
import {
  clamp,
  smoothstep,
  spindleEnvelope,
  getEventEnvelope,
  applyEventToIndices,
  gaussian,
  gaussianNoise,
  dsaDbToRgb,
  powerToDb,
  interpolateDrugProfile,
  combineDrugProfiles,
  getMedicationBolusProgress,
  getMedicationEffects,
  applyDrugSpectralSignature,
  applyAnalgesicSpectralSignature,
  getAnalgesicRawSignal,
  calculateIndices,
  classifyClinicalState,
} from "./simulation/engine.js";
import { renderDisplayViewIcon as DisplayViewIconFor } from "./components/DisplayViewIcon.jsx";
import {
  TrendChart,
  Metric,
  SelectField,
  DoseControl,
  MedicationChannel,
  FactRow,
} from "./components/UiPrimitives.jsx";

// Spectrogram colour scaling (IFU §5.2.7): "+" shifts saturation towards red,
// "−" towards blue. Each step shifts the dB colour mapping by DSA_SCALE_STEP_DB.
const DSA_SCALE_MIN = -4;
const DSA_SCALE_MAX = 4;
const DSA_SCALE_STEP_DB = 4;

const REMOTE_ROLES = ["full", "display", "controller"];
const DEMO_SESSIONS = Array.from({ length: 10 }, (_, index) => index + 1);
const DEMO_STORAGE_KEY = "conox.demoSession";
const REMOTE_ROOM_PREFIX =
  import.meta.env.VITE_REMOTE_ROOM_PREFIX || "conox-demo-";
const REMOTE_STATE_VERSION = 2;
const REMOTE_HEARTBEAT_MS = 4000;
const REMOTE_APPLY_SETTLE_MS = 150;
const MEDICATION_BOLUS_DURATIONS_MS = {
  primary: 15000,
  adjunct: 13200,
  analgesia: 10000,
};

function createClientId() {
  return (
    window.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function getInitialRemoteRole() {
  const role = new URLSearchParams(window.location.search).get("role");
  return REMOTE_ROLES.includes(role) ? role : "full";
}

function parseDemoSession(value) {
  const demo = Number.parseInt(value, 10);
  return DEMO_SESSIONS.includes(demo) ? demo : null;
}

function readStoredDemoSession() {
  try {
    return parseDemoSession(window.localStorage.getItem(DEMO_STORAGE_KEY));
  } catch {
    return null;
  }
}

function getInitialDemoSession() {
  return (
    parseDemoSession(new URLSearchParams(window.location.search).get("demo")) ??
    readStoredDemoSession() ??
    DEMO_SESSIONS[0]
  );
}

function replaceRemoteUrl(role, demo) {
  const params = new URLSearchParams(window.location.search);
  role === "full" ? params.delete("role") : params.set("role", role);
  params.set("demo", String(demo));
  params.delete("room");
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}?${params}${window.location.hash}`,
  );
}

function buildRemoteUrl(role, demo) {
  const url = new URL(window.location.href);
  url.searchParams.set("role", role);
  url.searchParams.set("demo", String(demo));
  url.searchParams.delete("room");
  return url.toString();
}

// Total order over state revisions: higher revision wins, then the device
// that joined the demo first, then the client id as a stable tie-breaker.
// Every peer applies the same rule, so all devices converge on one state.
function compareRemoteRevisions(a, b) {
  if (a.rev !== b.rev) return a.rev - b.rev;
  if (a.joinedAt !== b.joinedAt) return b.joinedAt - a.joinedAt;
  if (a.author === b.author) return 0;
  return a.author < b.author ? 1 : -1;
}

function isRemoteRevision(value) {
  return (
    Number.isFinite(value?.rev) &&
    Number.isFinite(value?.joinedAt) &&
    typeof value?.author === "string"
  );
}

export default function App() {
  const [locale, setLocale] = React.useState(getInitialLocale);
  const {
    t,
    tr,
    displayViews: DISPLAY_VIEWS,
    drugProfiles: DRUG_PROFILES,
    scenarios: SCENARIOS,
    getJourney: NARKOSE_REISE,
    eegKnowledge: EEG_KNOWLEDGE,
  } = React.useMemo(() => createI18n(locale), [locale]);
  const DEFAULT_SCENARIO =
    SCENARIOS.find((A) => A.id === "target-a") ?? SCENARIOS[0];
  const [remoteRole, setRemoteRole] = React.useState(getInitialRemoteRole),
    [borderlessDisplay, setBorderlessDisplay] = React.useState(false),
    [demoSession, setDemoSession] = React.useState(getInitialDemoSession),
    [remotePeers, setRemotePeers] = React.useState(0),
    [remoteStatus, setRemoteStatus] = React.useState("remote.status.waiting"),
    [linkPanelOpen, setLinkPanelOpen] = React.useState(!1),
    [qrCodeDataUrl, setQrCodeDataUrl] = React.useState(""),
    [activePanel, setActivePanel] = React.useState("monitor"),
    [displayView, setDisplayView] = React.useState("eeg-dsa"),
    [displayChoices, setDisplayChoices] = React.useState([
      "eeg-index",
      "dsa-index",
      "all",
    ]),
    [primaryDrug, setPrimaryDrug] = React.useState("propofol"),
    [primaryLevel, setPrimaryLevel] = React.useState(2),
    [adjunctDrug, setAdjunctDrug] = React.useState("none"),
    [adjunctLevel, setAdjunctLevel] = React.useState(0),
    [opioidDrug, setOpioidDrug] = React.useState("none"),
    [opioidLevel, setOpioidLevel] = React.useState(0),
    [eegWindowSeconds, setEegWindowSeconds] = React.useState(4),
    [eegAmplitude, setEegAmplitude] = React.useState(120),
    [dsaPeriodMinutes, setDsaPeriodMinutes] = React.useState(30),
    [dsaColorScale, setDsaColorScale] = React.useState(0),
    [liveSync, setLiveSync] = React.useState(!1),
    [qconAlarmEnabled, setQconAlarmEnabled] = React.useState(!1),
    [qconAlarmMin, setQconAlarmMin] = React.useState(20),
    [qconAlarmMax, setQconAlarmMax] = React.useState(80),
    [qconAlarmFlash, setQconAlarmFlash] = React.useState(!1),
    [sef50Visible, setSef50Visible] = React.useState(!1),
    [sef95Visible, setSef95Visible] = React.useState(!1),
    [simulationRunning, setSimulationRunning] = React.useState(!0),
    [simulatorEnabled, setSimulatorEnabled] = React.useState(!1),
    [eegHintsEnabled, setEegHintsEnabled] = React.useState(!0),
    [selectedScenarioId, setSelectedScenarioId] = React.useState("target-a"),
    [selectedKnowledgeTopic, setSelectedKnowledgeTopic] =
      React.useState("alpha"),
    [currentIndices, setCurrentIndices] = React.useState(
      DEFAULT_SCENARIO.indices,
    ),
    [trendHistory, setTrendHistory] = React.useState(() =>
      Array.from(
        {
          length: 21601,
        },
        (A, R) => ({
          qcon: DEFAULT_SCENARIO.indices.qcon,
          qnox: DEFAULT_SCENARIO.indices.qnox,
          bsr: DEFAULT_SCENARIO.indices.bsr,
          emg: DEFAULT_SCENARIO.indices.emg,
          seq: R - 21600,
        }),
      ),
    ),
    [bolusActive, setBolusActive] = React.useState({
      primary: !1,
      adjunct: !1,
      analgesia: !1,
    }),
    [bolusProgress, setBolusProgress] = React.useState({
      primary: 0,
      adjunct: 0,
      analgesia: 0,
    }),
    [bolusEpochs, setBolusEpochs] = React.useState({
      primary: null,
      adjunct: null,
      analgesia: null,
    }),
    [journeyRunning, setJourneyRunning] = React.useState(!1),
    [journeyPhase, setJourneyPhase] = React.useState(t("journey.ready")),
    [journeyProgress, setJourneyProgress] = React.useState(0),
    rawEegCanvasRef = React.useRef(null),
    dsaCanvasRef = React.useRef(null),
    dsaOverlayRef = React.useRef(null),
    sef50VisibleRef = React.useRef(!1),
    sef95VisibleRef = React.useRef(!1),
    knowledgeCanvasRef = React.useRef(null),
    eegStatusRef = React.useRef(null),
    bolusStartedAtRef = React.useRef({
      primary: null,
      adjunct: null,
      analgesia: null,
    }),
    journeyStateRef = React.useRef({
      elapsed: 0,
      last: 0,
      step: -1,
    }),
    scenarioProfileRef = React.useRef(DEFAULT_SCENARIO.profile),
    scenarioIndicesRef = React.useRef(DEFAULT_SCENARIO.indices),
    xa = DEFAULT_SCENARIO.profile,
    simulationStateRef = React.useRef({
      depth: EFFECT_LEVELS[2],
      bands: xa.bands,
      bs: xa.bs,
      suppressed: !1,
      burstEnvelope: 0,
      time: 0,
    }),
    simulationConfigRef = React.useRef({
      drug: primaryDrug,
      level: primaryLevel,
      adjunct: adjunctDrug,
      adjunctLevel: adjunctLevel,
      opioid: opioidDrug,
      opioidLevel: opioidLevel,
      bolusStartedAt: bolusStartedAtRef.current,
      running: simulationRunning,
      render: DEFAULT_RENDER_SETTINGS,
    }),
    eegWindowRef = React.useRef(eegWindowSeconds),
    eegAmplitudeRef = React.useRef(eegAmplitude),
    dsaPeriodRef = React.useRef(dsaPeriodMinutes),
    dsaColorOffsetRef = React.useRef(0),
    trendSequenceRef = React.useRef(0),
    originalDsaPeriod = React.useRef(30),
    soloReturnView = React.useRef("eeg-dsa"),
    remoteClientIdRef = React.useRef(createClientId()),
    remoteActionRef = React.useRef(null),
    remoteStateRef = React.useRef(null),
    remoteKnownStateRef = React.useRef({ json: "", state: null }),
    remoteRevisionRef = React.useRef(null),
    remoteJoinedAtRef = React.useRef(0),
    remoteApplyingUntilRef = React.useRef(0),
    remoteMessageHandlerRef = React.useRef(null),
    qconAlarmTriggered =
      qconAlarmEnabled &&
      (currentIndices.qcon < qconAlarmMin ||
        currentIndices.qcon > qconAlarmMax);
  React.useEffect(() => {
    window.localStorage.setItem("conox.locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);
  (React.useEffect(() => {
    simulationConfigRef.current = {
      drug: primaryDrug,
      level: primaryLevel,
      adjunct: adjunctDrug,
      adjunctLevel: adjunctLevel,
      opioid: opioidDrug,
      opioidLevel: opioidLevel,
      bolusStartedAt: bolusStartedAtRef.current,
      running: simulationRunning,
      render: DEFAULT_RENDER_SETTINGS,
    };
  }, [
    primaryDrug,
    primaryLevel,
    adjunctDrug,
    adjunctLevel,
    opioidDrug,
    opioidLevel,
    simulationRunning,
  ]),
    React.useEffect(() => {
      eegWindowRef.current = eegWindowSeconds;
    }, [eegWindowSeconds]),
    React.useEffect(() => {
      eegAmplitudeRef.current = eegAmplitude;
    }, [eegAmplitude]),
    React.useEffect(() => {
      dsaPeriodRef.current = dsaPeriodMinutes;
      window.dispatchEvent(new Event("conox-dsa-period-change"));
    }, [dsaPeriodMinutes]),
    React.useEffect(() => {
      dsaColorOffsetRef.current = dsaColorScale * DSA_SCALE_STEP_DB;
      window.dispatchEvent(new Event("conox-dsa-period-change"));
    }, [dsaColorScale]),
    React.useEffect(() => {
      ((sef50VisibleRef.current = sef50Visible),
        (sef95VisibleRef.current = sef95Visible),
        window.dispatchEvent(new Event("conox-sef-change")));
    }, [sef50Visible, sef95Visible]),
    React.useEffect(() => {
      if (!qconAlarmTriggered) {
        setQconAlarmFlash(!1);
        return;
      }
      setQconAlarmFlash(!0);
      const A = window.setInterval(() => setQconAlarmFlash((R) => !R), 1e3);
      return () => window.clearInterval(A);
    }, [qconAlarmTriggered]),
    React.useEffect(() => {
      const A = window.setInterval(() => {
        const now = performance.now();
        const categories = ["primary", "adjunct", "analgesia"];
        const nextActive = {};
        const nextProgress = {};
        categories.forEach((category) => {
          const startedAt = bolusStartedAtRef.current[category];
          const progress = getMedicationBolusProgress(startedAt, now, category);
          nextProgress[category] = progress;
          nextActive[category] = startedAt !== null && progress < 100;
          if (progress >= 100) {
            bolusStartedAtRef.current[category] = null;
            setBolusEpochs((current) =>
              current[category] === null
                ? current
                : { ...current, [category]: null },
            );
          }
        });
        setBolusActive(nextActive);
        setBolusProgress(nextProgress);
      }, 250);
      return () => window.clearInterval(A);
    }, [simulationRunning]),
    React.useEffect(() => {
      const A = dsaCanvasRef.current;
      if (!A) return;
      const R = A.getContext("2d", {
        alpha: !1,
      });
      if (!R) return;
      const dsaOverlay = dsaOverlayRef.current,
        dsaOverlayContext = dsaOverlay?.getContext("2d") ?? null,
        me = [];
      let G = null,
        ve = 0,
        Ze = 0,
        tt = performance.now(),
        Ve = 0,
        L = 0,
        ke = "",
        lastDsaPeriod = null,
        dsaPixelRemainder = 0,
        dsaColumnSamples = [];
      const Mt = () => {
          const Y = simulationConfigRef.current,
            Z = simulationStateRef.current,
            medicationEffects = getMedicationEffects(Y, performance.now()),
            fe = 180,
            Qe = {
              d: Z.bands.delta / 100,
              t: Z.bands.theta / 100,
              a: Z.bands.alpha / 100,
              b: Z.bands.beta / 100,
              g: Z.bands.gamma / 100,
            },
            ze = scenarioProfileRef.current,
            ft = ze?.alphaWidth ?? 2,
            lt = ze?.alphaPulse
              ? 0.42 + 0.58 * Math.sin(Z.time * 0.47 + 0.7) ** 2
              : 1,
            vt = ze?.thetaPulse
              ? 0.58 + 0.42 * Math.sin(Z.time * 0.78 + 0.2) ** 2
              : 1,
            dl = Y.render.texture / 100,
            El = Y.render.freqSmooth / 100,
            Ne = Z.bs / 100,
            ge = Z.depth / 100,
            Ee = medicationEffects.adjunct,
            we = medicationEffects.analgesia,
            Xt = Y.drug === "propofol" || Y.adjunct === "propofol",
            Ml =
              Y.drug === "dexmedetomidine"
                ? ge
                : Y.adjunct === "dexmedetomidine"
                  ? Ee * 0.8
                  : 0,
            Tl = ze?.spindleStrength ?? Ml,
            _t = getEventEnvelope(ze, Z.time),
            ta = [
              Y.drug,
              Y.adjunct,
              Y.opioid,
              ze?.alphaWidth ?? 2,
              ze?.alphaPulse ? 1 : 0,
              ze?.thetaPulse ? 1 : 0,
              ze?.spindleStrength ?? 0,
              ze?.arousalStrength ?? 0,
              ze?.eventType ?? "none",
              ze?.recoveryPattern ? 1 : 0,
              ze?.suppressAlpha ? 1 : 0,
            ].join("|");
          (ke && ke !== ta && (L = 1), (ke = ta));
          const Dl = Math.max(Ve, L),
            ml = 7.8,
            xl = (Z.time % ml) / ml,
            jl = clamp(1 - Ne, 0.08, 0.98),
            Le = 0.5,
            Bn = Math.min(Math.abs(xl - Le), 1 - Math.abs(xl - Le)),
            Fa = jl * 0.5,
            Hl = Ne <= 0.02 || Bn < Fa,
            la = Math.min(0.08, Fa * 0.6),
            Uu = Ne <= 0.02 ? 1 : smoothstep((Fa - Bn) / Math.max(la, 0.01));
          ((Z.suppressed = Ne > 0.02 && !Hl),
            (Z.burstEnvelope = Uu),
            eegStatusRef.current &&
              (eegStatusRef.current.textContent = Z.suppressed
                ? t("eeg.status.suppression")
                : t("eeg.status.active")));
          const Oa = new Array(fe),
            Ia = clamp((Ne - 0.1) / 0.52, 0, 1),
            Ru = Ia * Ia * (3 - 2 * Ia),
            Pa = smoothstep(Ne / 0.24);
          for (let He = 0; He < fe; He += 1) {
            const X = (He / (fe - 1)) * 45;
            let le =
              1.18 * Qe.d * gaussian(X, 1.4, 2.4) +
              0.18 * Qe.t * vt * gaussian(X, 5.8, 2.1) +
              1.05 * Qe.a * lt * gaussian(X, 10.2, ft) +
              0.64 * Qe.b * gaussian(X, 20, 7.5) +
              0.52 * Qe.g * gaussian(X, 35, 6.2) +
              0.28 / (1 + X * 0.12) +
              0.05;
            if (
              ((le = applyDrugSpectralSignature(le, Y.drug, ge, X, Z.time, Xt)),
              Y.adjunct !== "none" &&
                (le = applyDrugSpectralSignature(
                  le,
                  Y.adjunct,
                  Ee * 0.8,
                  X,
                  Z.time,
                  Xt,
                )),
              Tl > 0 &&
                (le +=
                  0.42 *
                  Tl *
                  spindleEnvelope(Z.time) *
                  gaussian(X, 13.2, 1.15)),
              _t > 0)
            ) {
              const Je = ze?.eventType ?? "betaArousal";
              if (Je === "alphaDropout") {
                const Kt =
                  0.78 * gaussian(X, 10.2, 2.2) + 0.2 * gaussian(X, 2, 2.8);
                ((le *= 1 - _t * Kt), (le += _t * 0.2 * gaussian(X, 20, 6.5)));
              } else if (Je === "deltaArousal") {
                ((le *= 1 - _t * 0.72 * gaussian(X, 10.2, 2.6)),
                  (le +=
                    _t *
                    (1.15 * gaussian(X, 1.6, 1.7) +
                      0.26 * gaussian(X, 4.4, 2.1))));
              } else if (Je === "emgArtifact") {
                le +=
                  _t *
                  (0.32 * gaussian(X, 18, 7.5) +
                    0.75 * gaussian(X, 33, 9.5) +
                    0.22 * gaussian(X, 43, 4.5));
              } else {
                const Kt =
                    (Je === "nociceptiveBeta" ? 0.82 : 0.72) *
                      gaussian(X, 1.8, 2.8) +
                    (Je === "nociceptiveBeta" ? 0.76 : 0.68) *
                      gaussian(X, 10.2, 4.2),
                  _a = Je === "nociceptiveBeta" ? 1.18 : 0.86;
                ((le *= 1 - _t * Kt),
                  (le +=
                    _t *
                    _a *
                    (0.72 * gaussian(X, 20.5, 7.2) +
                      0.24 * gaussian(X, 31.5, 5.2))));
              }
            }
            le = applyAnalgesicSpectralSignature(le, Y.opioid, we, X);
            (Y.opioid === "fentanyl" &&
              ((le += 0.16 * we * gaussian(X, 5.8, 1.15)),
              X > 14 && (le *= 1 - 0.25 * we)),
              Y.opioid === "remifentanil" &&
                (Xt && ge >= 0.55
                  ? ((le += 0.28 * we * gaussian(X, 10.4, 2.2)),
                    X < 4 && (le *= 1 - 0.15 * we))
                  : ((le += 0.25 * we * gaussian(X, 2.1, 2)),
                    X > 14 && (le *= 1 - 0.3 * we))),
              Y.opioid === "sufentanil" &&
                ((le +=
                  0.34 * we * gaussian(X, 1.8, 2.1) +
                  0.14 * we * gaussian(X, 5.5, 1.5)),
                X > 13 && (le *= 1 - 0.34 * we)));
            if (ze?.suppressAlpha) {
              const Je =
                smoothstep((X - 7.2) / 1.25) *
                (1 - smoothstep((X - 13.8) / 1.25));
              le *= 1 - 0.975 * Je;
            }
            const Kt = (Je) =>
                Je === "sevoflurane"
                  ? 0.98
                  : Je === "dexmedetomidine"
                    ? 0.84
                    : Je === "ketamine"
                      ? 0.8
                      : Je === "midazolam"
                        ? 0.74
                        : Je === "awake"
                          ? 0.72
                          : 0.56,
              _a = Y.adjunct === "none" ? 0 : Kt(Y.adjunct),
              en = ze?.thetaPulse ? 1 : Math.max(Kt(Y.drug), _a);
            if (
              ((le *= 1 - (1 - en) * gaussian(X, 5.9, 1.55)),
              (le = Math.max(
                1e-4,
                le *
                  (1 +
                    (gaussianNoise() * 0.16 +
                      Math.sin(He * 0.29 + Z.time * 0.9) * 0.05) *
                      dl),
              )),
              Ne > 0 && Ru > 0)
            )
              if (Z.suppressed) {
                let Je = 1;
                (X < 4
                  ? (Je = 0.055 + (1 - Ne) * 0.13)
                  : X < 8
                    ? (Je = 0.035 + (1 - Ne) * 0.09)
                    : X < 13
                      ? (Je = 0.018 + (1 - Ne) * 0.055)
                      : X < 30
                        ? (Je = 0.007 + (1 - Ne) * 0.022)
                        : (Je = 0.002 + (1 - Ne) * 0.006),
                  (le *= 1 - (1 - Je) * Pa));
              } else
                le *=
                  1 +
                  Ru *
                    Uu *
                    (2 * gaussian(X, 2, 3) +
                      1.5 * gaussian(X, 9.5, 4.5) +
                      0.55 * gaussian(X, 20, 10));
            Oa[He] = le;
          }
          for (let He = 0; He < Math.round(El * 4); He += 1) {
            const X = Oa.slice();
            for (let le = 1; le < fe - 1; le += 1)
              Oa[le] = X[le] * 0.52 + (X[le - 1] + X[le + 1]) * 0.24;
          }
          let vl = Oa.map((He, X) => {
            const le = (X / (fe - 1)) * 45,
              Kt =
                Dl *
                (gaussianNoise() * 3.4 +
                  Math.sin(X * 0.83 + Z.time * 2.2) * 1.15);
            return clamp(powerToDb(He, le) + Kt, -30, 50);
          });
          if (ze?.suppressAlpha)
            vl = vl.map((He, X) => {
              const le = (X / (fe - 1)) * 45,
                Kt =
                  smoothstep((le - 7.2) / 1.25) *
                  (1 - smoothstep((le - 13.8) / 1.25));
              return He * (1 - Kt) + (-27.5 + gaussianNoise() * 0.8) * Kt;
            });
          if (G) {
            const He = Z.suppressed
                ? Math.min(Y.render.temporal / 100, 0.74)
                : clamp(Y.render.temporal / 100, 0.62, 0.82),
              X = smoothstep(Dl);
            vl = vl.map((le, Kt) => {
              const _a = (Kt / (fe - 1)) * 45,
                en =
                  X *
                  (Math.sin(Kt * 0.19 + Z.time * 0.43) * 0.018 +
                    Math.sin(Kt * 0.071 - Z.time * 0.27) * 0.012 +
                    gaussian(_a, 10.2, 8) * 0.012),
                Je = clamp(He + (0.91 - He) * X + en, 0.58, 0.94);
              return G[Kt] * Je + le * (1 - Je);
            });
          }
          if (ze?.suppressAlpha)
            vl = vl.map((He, X) => {
              const le = (X / (fe - 1)) * 45,
                Kt =
                  smoothstep((le - 7.2) / 1.25) *
                  (1 - smoothstep((le - 13.8) / 1.25));
              return He * (1 - Kt) + (-27.5 + gaussianNoise() * 0.8) * Kt;
            });
          return (
            (vl = vl.map((He, X) => {
              const le = smoothstep((-4 - He) / 20),
                Kt =
                  gaussianNoise() * (0.9 + dl * 2.4) * (1 + le * 0.48) +
                  Math.sin(X * 2.17 + Z.time * 6.8) * (0.25 + dl * 0.7);
              return clamp(He + Kt, -30, 50);
            })),
            (G = vl.slice()),
            (L *= Math.exp(-0.12 / 2.4)),
            L < 0.01 && (L = 0),
            {
              spec: vl,
              power: Oa.slice(),
            }
          );
        },
        spectralEdgeFrequency = (Y, Z) => {
          if (!Y?.length) return 0.5;
          const fe = 45 / Math.max(1, Y.length - 1),
            Qe = Math.max(0, Math.ceil(0.5 / fe));
          let ze = 0;
          for (let ft = Qe; ft < Y.length; ft += 1)
            ze += Math.max(0, Number(Y[ft]) || 0);
          if (ze <= 0) return 0.5;
          const ft = ze * Z;
          let lt = 0;
          for (let vt = Qe; vt < Y.length; vt += 1) {
            const dl = Math.max(0, Number(Y[vt]) || 0),
              El = lt;
            lt += dl;
            if (lt >= ft) {
              const Ne = vt === Qe ? 0.5 : (vt - 1) * fe,
                ge = vt * fe,
                Ee = dl > 0 ? clamp((ft - El) / dl, 0, 1) : 0;
              return clamp(Ne + (ge - Ne) * Ee, 0.5, 45);
            }
          }
          return 45;
        },
        makeDsaSample = (Y, Z) => {
          const fe = Y instanceof Float32Array ? Y : new Float32Array(Y),
            Qe = Z instanceof Float64Array ? Z : new Float64Array(Z);
          return {
            spec: fe,
            sef50: spectralEdgeFrequency(Qe, 0.5),
            sef95: spectralEdgeFrequency(Qe, 0.95),
          };
        },
        sefY = (Y, Z) => {
          if (!dsaOverlay) return 0.5;
          const fe = Math.max(
              1,
              simulationConfigRef.current.render.frequencyPixel,
            ),
            Qe =
              dsaOverlay.height -
              1 -
              (clamp(Y?.[Z] ?? 0.5, 0.5, 45) / 45) * (dsaOverlay.height - 1),
            ze = Math.floor(Qe / fe) * fe + Math.floor(fe / 2);
          return clamp(ze, 1, dsaOverlay.height - 1);
        },
        drawSefColumns = () => {
          if (!dsaOverlay || !dsaOverlayContext) return;
          dsaOverlayContext.clearRect(
            0,
            0,
            dsaOverlay.width,
            dsaOverlay.height,
          );
          if (!dsaColumnSamples.length) return;
          const drawTrend = (Y, Z) => {
            dsaOverlayContext.save();
            dsaOverlayContext.strokeStyle = Z;
            dsaOverlayContext.lineWidth = 2;
            dsaOverlayContext.lineCap = "butt";
            dsaOverlayContext.lineJoin = "miter";
            dsaOverlayContext.setLineDash([]);
            dsaOverlayContext.beginPath();
            let fe = sefY(dsaColumnSamples[0], Y);
            dsaOverlayContext.moveTo(0, fe);
            for (let Qe = 1; Qe < dsaOverlay.width; Qe += 1) {
              const ze = sefY(
                  dsaColumnSamples[Math.min(Qe, dsaColumnSamples.length - 1)],
                  Y,
                ),
                ft = Qe;
              (dsaOverlayContext.lineTo(ft, fe),
                ze !== fe && dsaOverlayContext.lineTo(ft, ze),
                (fe = ze));
            }
            (dsaOverlayContext.stroke(), dsaOverlayContext.restore());
          };
          (sef95VisibleRef.current && drawTrend("sef95", "#000000"),
            sef50VisibleRef.current && drawTrend("sef50", "#ffffff"));
        },
        paintDsaColumns = (Y, Z) => {
          const fe = simulationConfigRef.current.render.frequencyPixel;
          for (let Qe = 0; Qe < Y.width; Qe += 1)
            for (let ze = 0; ze < A.height; ze += fe) {
              const ft = Math.min(A.height - 1, ze + Math.floor(fe / 2)),
                lt = ((A.height - 1 - ft) / (A.height - 1)) * (Z.length - 1),
                [vt, dl, El] = dsaDbToRgb(
                  Z[Math.round(lt)],
                  dsaColorOffsetRef.current,
                ),
                Ne = Math.min(A.height, ze + fe);
              for (let ge = ze; ge < Ne; ge += 1) {
                const Ee = (ge * Y.width + Qe) * 4;
                ((Y.data[Ee] = vt),
                  (Y.data[Ee + 1] = dl),
                  (Y.data[Ee + 2] = El),
                  (Y.data[Ee + 3] = 255));
              }
            }
        },
        rl = () => {
          const Y = R.createImageData(A.width, A.height);
          const Z = dsaPeriodRef.current <= 1 ? 60 : dsaPeriodRef.current * 60,
            fe = Math.max(0, me.length - 1 - Z),
            Qe = simulationConfigRef.current.render.frequencyPixel;
          dsaColumnSamples = new Array(A.width);
          for (let ze = 0; ze < A.width; ze += 1) {
            const ft = ze / Math.max(1, A.width - 1),
              lt = Math.min(
                me.length - 1,
                Math.max(0, Math.round(fe + ft * Z)),
              ),
              vt = me[lt]?.spec ?? me[me.length - 1].spec;
            dsaColumnSamples[ze] = me[lt] ?? me[me.length - 1];
            for (let El = 0; El < A.height; El += Qe) {
              const Ne = Math.min(A.height - 1, El + Math.floor(Qe / 2)),
                ge = ((A.height - 1 - Ne) / (A.height - 1)) * (vt.length - 1),
                [Ee, we, Xt] = dsaDbToRgb(
                  vt[Math.round(ge)],
                  dsaColorOffsetRef.current,
                ),
                Ml = Math.min(A.height, El + Qe);
              for (let Tl = El; Tl < Ml; Tl += 1) {
                const hl = (Tl * A.width + ze) * 4;
                ((Y.data[hl] = Ee),
                  (Y.data[hl + 1] = we),
                  (Y.data[hl + 2] = Xt),
                  (Y.data[hl + 3] = 255));
              }
            }
          }
          (R.putImageData(Y, 0, 0),
            (lastDsaPeriod = dsaPeriodRef.current),
            (dsaPixelRemainder = 0),
            drawSefColumns());
        },
        scrollDsa = () => {
          const Y = dsaPeriodRef.current,
            Z = Y <= 1 ? 60 : Y * 60;
          if (lastDsaPeriod !== Y) {
            rl();
            return;
          }
          dsaPixelRemainder += A.width / Z;
          const fe = Math.floor(dsaPixelRemainder);
          if (fe < 1) return;
          if (((dsaPixelRemainder -= fe), fe >= A.width)) {
            rl();
            return;
          }
          R.drawImage(
            A,
            fe,
            0,
            A.width - fe,
            A.height,
            0,
            0,
            A.width - fe,
            A.height,
          );
          const Qe = R.createImageData(fe, A.height),
            ze = me[me.length - 1]?.spec,
            ft = me[me.length - 1];
          ze &&
            (paintDsaColumns(Qe, ze),
            R.putImageData(Qe, A.width - fe, 0),
            dsaColumnSamples.splice(0, fe),
            dsaColumnSamples.push(...new Array(fe).fill(ft)),
            dsaColumnSamples.length > A.width &&
              (dsaColumnSamples = dsaColumnSamples.slice(-A.width)),
            drawSefColumns());
        },
        zl = (Y) => {
          const Z = simulationConfigRef.current,
            fe = simulationStateRef.current,
            Qe = Math.min((Y - tt) / 1e3, 0.1);
          if (((tt = Y), Z.running)) {
            const ze = scenarioProfileRef.current,
              medicationEffects = getMedicationEffects(Z, Y),
              ft =
                Z.drug === "awake"
                  ? 0
                  : clamp(
                      ze
                        ? EFFECT_LEVELS[Z.level]
                        : medicationEffects.primaryValue,
                      0,
                      100,
                    ),
              lt = 1 - Math.exp(-Qe / 2.8);
            fe.depth += (ft - fe.depth) * lt;
            const vt = ze ?? combineDrugProfiles(Z, ft, medicationEffects),
              dl =
                Object.keys(fe.bands).reduce(
                  (ge, Ee) => ge + Math.abs(vt.bands[Ee] - fe.bands[Ee]),
                  0,
                ) /
                5 /
                100,
              El = clamp(dl * 2.4 + Math.abs(vt.bs - fe.bs) / 100, 0, 1),
              Ne = 1 - Math.exp(-Qe / 0.45);
            if (
              ((Ve += (El - Ve) * Ne),
              Object.keys(fe.bands).forEach((ge) => {
                fe.bands[ge] += (vt.bands[ge] - fe.bands[ge]) * lt;
              }),
              (fe.bs += (vt.bs - fe.bs) * lt),
              (fe.time += Qe),
              Y - Ze >= 1e3)
            ) {
              const ge = Mt();
              me.push(
                makeDsaSample(
                  new Float32Array(ge.spec),
                  new Float64Array(ge.power),
                ),
              );
              for (; me.length > 21601; ) me.shift();
              (scrollDsa(), (Ze = Y));
            }
          }
          ve = requestAnimationFrame(zl);
        },
        ue = Mt(),
        Re = ue.spec,
        Yt = new Float64Array(ue.power);
      for (let Y = 0; Y <= 21600; Y += 1)
        me.push(
          makeDsaSample(
            new Float32Array(
              Re.map((Z, fe) => {
                const Qe = (fe / (Re.length - 1)) * 45,
                  ze =
                    Math.sin(Y * 0.018 + 0.4) * 2.1 * gaussian(Qe, 1.3, 1.7) +
                    Math.sin(Y * 0.024 + 1.1) * 2.5 * gaussian(Qe, 10.1, 1.5);
                return clamp(
                  Z +
                    ze +
                    Math.sin(fe * 0.31 + Y * 0.019) * 1.35 +
                    gaussianNoise() * 2.2,
                  -30,
                  50,
                );
              }),
            ),
            Yt,
          ),
        );
      return (
        rl(),
        window.addEventListener("conox-dsa-period-change", rl),
        window.addEventListener("conox-sef-change", drawSefColumns),
        (ve = requestAnimationFrame(zl)),
        () => {
          (window.removeEventListener("conox-dsa-period-change", rl),
            window.removeEventListener("conox-sef-change", drawSefColumns),
            cancelAnimationFrame(ve));
        }
      );
    }, [t]),
    React.useEffect(() => {
      const A = rawEegCanvasRef.current;
      if (!A) return;
      const R = A.getContext("2d", {
        alpha: !1,
      });
      if (!R) return;
      const me = document.createElement("canvas");
      ((me.width = A.width), (me.height = A.height));
      const G = me.getContext("2d", {
        alpha: !1,
      });
      if (!G) return;
      const ve = 125,
        Ze = 25,
        tt = ve / Ze;
      let sweepLength = ve * eegWindowRef.current,
        Ve = Array(sweepLength).fill(null),
        sweepCursor = 0,
        L = 0;
      const ke = () => {
          const ue = simulationConfigRef.current,
            Re = simulationStateRef.current,
            medicationEffects = getMedicationEffects(ue, performance.now()),
            Y = Re.bands,
            Z = scenarioProfileRef.current,
            fe =
              ue.drug === "propofol"
                ? Re.depth / 100
                : ue.adjunct === "propofol"
                  ? medicationEffects.adjunct
                  : 0,
            Qe =
              ue.drug === "midazolam"
                ? Re.depth / 100
                : ue.adjunct === "midazolam"
                  ? medicationEffects.adjunct
                  : 0,
            ze =
              ue.drug === "dexmedetomidine"
                ? Re.depth / 100
                : ue.adjunct === "dexmedetomidine"
                  ? medicationEffects.adjunct
                  : 0,
            ft =
              ue.drug === "ketamine"
                ? Re.depth / 100
                : ue.adjunct === "ketamine"
                  ? medicationEffects.adjunct
                  : 0,
            lt =
              ue.drug === "sevoflurane"
                ? Re.depth / 100
                : ue.adjunct === "sevoflurane"
                  ? medicationEffects.adjunct
                  : 0,
            vt = medicationEffects.analgesia;
          if (((L += 1 / ve), Re.bs > 0 && Re.suppressed))
            return gaussianNoise() * (0.7 + (100 - Re.bs) * 0.018);
          const El = Math.sin(2 * Math.PI * 0.85 * L),
            Ne = spindleEnvelope(L),
            ge = Z?.spindleStrength ?? ze,
            Ee = getEventEnvelope(Z, Re.time),
            we =
              0.32 + 0.68 * Math.max(0, Math.sin(2 * Math.PI * 0.13 * L + 1.3)),
            Xt = clamp(
              0.58 +
                0.28 * Math.sin(2 * Math.PI * 0.19 * L + 0.5) +
                0.14 * Math.sin(2 * Math.PI * 0.47 * L + 2.1),
              0.18,
              1,
            ),
            Ml = Z?.alphaPulse
              ? 0.38 + 0.62 * Math.sin(2 * Math.PI * 0.12 * L + 0.8) ** 2
              : 1,
            Tl = Z?.thetaPulse
              ? 0.58 + 0.42 * Math.sin(Re.time * 0.78 + 0.2) ** 2
              : 1,
            hl = (0.62 + 0.38 * (0.5 + 0.5 * El)) * Ml;
          if (Z?.recoveryPattern) {
            const ml =
                25 *
                (0.66 +
                  0.22 * Math.sin(2 * Math.PI * 0.11 * L + 0.4) +
                  0.12 * Math.sin(2 * Math.PI * 0.31 * L + 1.6)) *
                Math.sin(
                  2 * Math.PI * 1.05 * L +
                    0.48 * Math.sin(2 * Math.PI * 0.14 * L),
                ),
              xl = 7.5 * Ml * Math.sin(2 * Math.PI * 9.7 * L + 0.8),
              jl = 2.4 * Math.sin(2 * Math.PI * 5.4 * L + 1.3),
              Le = 0.72 + Re.burstEnvelope * (0.38 + Re.bs / 180);
            return (ml + xl + jl) * Le + gaussianNoise() * 2.1;
          }
          let _t = Z?.deltaPolymorphic
            ? (Y.delta / 100) *
                (19 * Math.sin(2 * Math.PI * 0.78 * L + 0.2) +
                  13 * Math.sin(2 * Math.PI * 1.46 * L + 1.1) +
                  7.5 *
                    Math.sin(
                      2 * Math.PI * 2.55 * L +
                        0.42 * Math.sin(2 * Math.PI * 0.16 * L),
                    )) +
              (Y.theta / 100) * 3.2 * Math.sin(2 * Math.PI * 4.8 * L + 1.7)
            : (Y.delta / 100) *
                (Z?.awakePattern ? 10 : 31) *
                Math.sin(2 * Math.PI * 1.15 * L + 0.2) +
              (Y.theta / 100) *
                5.4 *
                Tl *
                Math.sin(2 * Math.PI * 5.8 * L + 1.4) +
              (Y.alpha / 100) *
                17 *
                hl *
                Math.sin(2 * Math.PI * 10.1 * L + 0.8) +
              (Y.beta / 100) * 7 * Math.sin(2 * Math.PI * 19.3 * L + 2.1) +
              (Y.gamma / 100) * 2.8 * Math.sin(2 * Math.PI * 34.1 * L + 1.7);
          _t +=
            fe *
              (Z?.suppressAlpha ? 0 : 21) *
              hl *
              Math.sin(2 * Math.PI * 10 * L) +
            Qe * 8 * Math.sin(2 * Math.PI * 20.5 * L + 0.4) +
            ge * 17 * Ne * Math.sin(2 * Math.PI * 13.2 * L) +
            ft *
              (9 * we * Math.sin(2 * Math.PI * (fe > 0 ? 23.5 : 29.5) * L) +
                10 *
                  Xt *
                  Math.sin(
                    2 * Math.PI * 1.45 * L +
                      0.85 * Math.sin(2 * Math.PI * 0.17 * L),
                  )) +
            lt * 11 * Math.sin(2 * Math.PI * 2.1 * L + 1.1) +
            getAnalgesicRawSignal(ue.opioid, vt, L);
          if (Ee > 0) {
            const ml = Z?.eventType ?? "betaArousal";
            ml === "alphaDropout"
              ? (_t =
                  _t * (1 - 0.62 * Ee) +
                  Ee *
                    (4.8 * Math.sin(2 * Math.PI * 19.5 * L + 0.5) +
                      gaussianNoise() * 2.2))
              : ml === "deltaArousal"
                ? (_t =
                    _t * (1 - 0.3 * Ee) +
                    Ee *
                      (28 * Math.sin(2 * Math.PI * 1.55 * L + 0.2) +
                        9 * Math.sin(2 * Math.PI * 2.8 * L + 1.1) +
                        gaussianNoise() * 2.3))
                : ml === "emgArtifact"
                  ? (_t +=
                      Ee *
                      (11 * Math.sin(2 * Math.PI * 27 * L + 0.1) +
                        8 * Math.sin(2 * Math.PI * 36.5 * L + 1.2) +
                        gaussianNoise() * 8.5))
                  : (_t =
                      _t * (1 - (ml === "nociceptiveBeta" ? 0.68 : 0.56) * Ee) +
                      Ee *
                        ((ml === "nociceptiveBeta" ? 11 : 8.2) *
                          Math.sin(2 * Math.PI * 21.5 * L + 0.3) +
                          3.7 * Math.sin(2 * Math.PI * 31 * L + 1.1) +
                          gaussianNoise() *
                            (ml === "nociceptiveBeta" ? 4.4 : 3.2)));
          }
          const ta =
            Re.bs > 0 ? 0.72 + Re.burstEnvelope * (0.45 + Re.bs / 115) : 1;
          return _t * ta + gaussianNoise() * (2.4 + vt * 0.8);
        },
        Mt = () => {
          const ue = A.width,
            Re = A.height,
            Y = Re / 2,
            Qe = ue / Math.max(1, sweepLength),
            gapSamples = Math.ceil(sweepLength * 0.025);
          let connected = false;
          ((G.fillStyle = "#010504"),
            G.fillRect(0, 0, ue, Re),
            (G.strokeStyle = "rgba(62,122,96,.18)"),
            (G.lineWidth = 1));
          for (let ze = 1; ze < 8; ze += 1) {
            const ft = (ue / 8) * ze;
            (G.beginPath(), G.moveTo(ft, 0), G.lineTo(ft, Re), G.stroke());
          }
          ((G.strokeStyle = "rgba(129,211,171,.2)"),
            G.beginPath(),
            G.moveTo(0, Y),
            G.lineTo(ue, Y),
            G.stroke(),
            (G.strokeStyle = "#ffffff"),
            (G.lineWidth = 1.35),
            (G.lineCap = "round"),
            (G.lineJoin = "round"),
            G.beginPath(),
            Ve.forEach((ze, ft) => {
              // Break the path at the erase gap and at the screen boundary.
              const ahead = (ft - sweepCursor + sweepLength) % sweepLength;
              if (ze === null || ahead < gapSamples) {
                connected = false;
                return;
              }
              const lt = ft * Qe,
                vt = Y - (ze / eegAmplitudeRef.current) * (Re * 0.43);
              connected ? G.lineTo(lt, vt) : G.moveTo(lt, vt);
              connected = true;
            }),
            G.stroke());
          const cursorX = sweepCursor * Qe;
          ((G.strokeStyle = "rgba(129,211,171,.65)"),
            (G.lineWidth = 1),
            G.beginPath(),
            G.moveTo(cursorX, 0),
            G.lineTo(cursorX, Re),
            G.stroke(),
            R.drawImage(me, 0, 0));
        },
        rl = () => {
          const nextLength = ve * eegWindowRef.current;
          if (nextLength !== sweepLength) {
            sweepLength = nextLength;
            Ve = Array(sweepLength).fill(null);
            sweepCursor = 0;
          }
          if (simulationConfigRef.current.running) {
            for (let ue = 0; ue < tt; ue += 1) {
              Ve[sweepCursor] = ke();
              sweepCursor = (sweepCursor + 1) % sweepLength;
            }
          }
          Mt();
        };
      Mt();
      const zl = window.setInterval(rl, 1e3 / Ze);
      return () => window.clearInterval(zl);
    }, []),
    React.useEffect(() => {
      const A = [];
      let R = {
          ...currentIndices,
        },
        trendSampleAt = performance.now() - 1e3,
        indexPausedAt = null;
      const me = window.setInterval(() => {
        const G = performance.now();
        if (!simulationConfigRef.current.running) {
          indexPausedAt === null && (indexPausedAt = G);
          return;
        }
        if (indexPausedAt !== null) {
          const ve = G - indexPausedAt;
          (A.forEach((Ze) => {
            Ze.at += ve;
          }),
            (trendSampleAt += ve),
            (indexPausedAt = null));
        }
        const ve = calculateIndices(
            simulationConfigRef.current,
            simulationStateRef.current,
            G / 1e3,
          ),
          Ze = scenarioIndicesRef.current,
          dynamicScenarioIndices = Ze
            ? applyEventToIndices(
                scenarioProfileRef.current,
                Ze,
                simulationStateRef.current.time,
              )
            : null;
        for (
          A.push({
            at: G,
            values: dynamicScenarioIndices
              ? {
                  qcon: clamp(
                    dynamicScenarioIndices.qcon + gaussianNoise() * 0.7,
                    0,
                    99,
                  ),
                  qnox: clamp(
                    dynamicScenarioIndices.qnox + gaussianNoise() * 0.9,
                    0,
                    99,
                  ),
                  emg: clamp(
                    dynamicScenarioIndices.emg + gaussianNoise() * 0.8,
                    0,
                    99,
                  ),
                  sqi: clamp(
                    dynamicScenarioIndices.sqi + gaussianNoise() * 0.35,
                    92,
                    100,
                  ),
                  bsr: clamp(
                    dynamicScenarioIndices.bsr + gaussianNoise() * 0.35,
                    0,
                    100,
                  ),
                }
              : ve,
          });
          A.length > 220;

        )
          A.shift();
        const tt = liveSync
            ? {
                qcon: 0,
                qnox: 0,
                emg: 0,
                sqi: 0,
                bsr: 0,
              }
            : {
                qcon: 2e4,
                qnox: 2e4,
                emg: 650,
                sqi: 800,
                bsr: 3e4,
              },
          Ve = liveSync
            ? {
                qcon: 0.34,
                qnox: 0.38,
                emg: 0.46,
                sqi: 0.42,
                bsr: 0.34,
              }
            : {
                qcon: 0.13,
                qnox: 0.16,
                emg: 0.38,
                sqi: 0.3,
                bsr: 0.12,
              },
          L = {
            ...R,
          };
        (Object.keys(L).forEach((ke) => {
          const Mt = [...A].reverse().find((rl) => rl.at <= G - tt[ke]);
          if (!Mt) {
            L[ke] = R[ke];
            return;
          }
          L[ke] = Math.round(R[ke] * (1 - Ve[ke]) + Mt.values[ke] * Ve[ke]);
        }),
          (R = L),
          setCurrentIndices(L),
          simulationConfigRef.current.running &&
            G - trendSampleAt >= 1e3 &&
            (setTrendHistory((ke) => [
              ...ke.slice(-21600),
              {
                qcon: L.qcon,
                qnox: L.qnox,
                bsr: L.bsr,
                emg: L.emg,
                seq: ++trendSequenceRef.current,
              },
            ]),
            (trendSampleAt = G)));
      }, 250);
      return () => window.clearInterval(me);
    }, [liveSync]),
    React.useEffect(() => {
      const A = knowledgeCanvasRef.current;
      if (!A || activePanel !== "learn") return;
      const R = A.getContext("2d");
      if (!R) return;
      const me = EEG_KNOWLEDGE[selectedKnowledgeTopic];
      (R.clearRect(0, 0, A.width, A.height),
        (R.fillStyle = "#050b0f"),
        R.fillRect(0, 0, A.width, A.height),
        (R.strokeStyle = "rgba(111, 151, 166, 0.22)"),
        (R.lineWidth = 1));
      for (let G = 1; G < 8; G += 1) {
        const ve = (A.width / 8) * G;
        (R.beginPath(), R.moveTo(ve, 0), R.lineTo(ve, A.height), R.stroke());
      }
      (R.beginPath(),
        R.moveTo(0, A.height / 2),
        R.lineTo(A.width, A.height / 2),
        R.stroke(),
        (R.fillStyle = "#8ba0aa"),
        (R.font = "11px Arial"),
        R.fillText(t("learn.canvasWindow"), 10, A.height - 10),
        (R.fillStyle = "#dce8ec"),
        (R.font = "bold 12px Arial"),
        R.fillText(me.title, 10, 18),
        (R.strokeStyle = "#63ec8f"),
        (R.lineWidth = 2),
        R.beginPath());
      for (let G = 0; G < A.width; G += 1) {
        const ve = (G / A.width) * 2;
        let Ze = A.height / 2;
        if (selectedKnowledgeTopic === "awake") {
          Ze +=
            Math.sin(2 * Math.PI * 18 * ve + 0.2) * 5.5 +
            Math.sin(2 * Math.PI * 27 * ve + 1.4) * 3.2 +
            Math.sin(2 * Math.PI * 7.2 * ve + 0.7) * 2.4 +
            Math.sin(2 * Math.PI * 36 * ve + 2.1) * 1.8;
        } else if (selectedKnowledgeTopic === "suppression") {
          const tt = G > A.width * 0.48 && G < A.width * 0.64;
          Ze += tt
            ? (Math.sin(2 * Math.PI * 8 * ve) * 19 +
                Math.sin(2 * Math.PI * 19 * ve) * 7) *
              Math.sin(((G - A.width * 0.48) / (A.width * 0.16)) * Math.PI)
            : Math.sin(2 * Math.PI * 1.2 * ve) * 1.2;
        } else if (selectedKnowledgeTopic === "mixed") {
          const tt = Math.sin(2 * Math.PI * 1.15 * ve),
            Ve = 0.55 + 0.45 * (0.5 + 0.5 * tt);
          Ze +=
            tt * 29 +
            Math.sin(2 * Math.PI * 10 * ve + 0.4) * 15 * Ve +
            Math.sin(2 * Math.PI * 20 * ve) * 3;
        } else if (selectedKnowledgeTopic === "spindle") {
          const tt = Math.sin(Math.PI * clamp((ve - 0.2) / 1.6, 0, 1)) ** 2;
          Ze +=
            Math.sin(2 * Math.PI * me.frequency * ve) * 19 * tt +
            Math.sin(2 * Math.PI * 1.1 * ve) * 5;
        } else if (selectedKnowledgeTopic === "arousal") {
          const tt =
              smoothstep((ve - 0.58) / 0.16) *
              (1 - smoothstep((ve - 1.55) / 0.2)),
            Ve =
              Math.sin(2 * Math.PI * 1.1 * ve) * 17 +
              Math.sin(2 * Math.PI * 10.2 * ve + 0.4) * 8,
            L =
              Math.sin(2 * Math.PI * 21.5 * ve + 0.3) * 7 +
              Math.sin(2 * Math.PI * 31 * ve + 1.1) * 3;
          Ze += Ve * (1 - tt) + L * tt;
        } else if (selectedKnowledgeTopic === "alphaDropout") {
          const tt =
              smoothstep((ve - 0.56) / 0.15) *
              (1 - smoothstep((ve - 1.55) / 0.24)),
            Ve =
              Math.sin(2 * Math.PI * 1.15 * ve) * 18 +
              Math.sin(2 * Math.PI * 10.1 * ve + 0.4) * 13,
            L =
              Math.sin(2 * Math.PI * 1.15 * ve) * 11 +
              Math.sin(2 * Math.PI * 19.5 * ve + 0.5) * 4;
          Ze += Ve * (1 - tt) + L * tt;
        } else if (selectedKnowledgeTopic === "deltaArousal") {
          const tt =
              smoothstep((ve - 0.55) / 0.16) *
              (1 - smoothstep((ve - 1.62) / 0.24)),
            Ve =
              Math.sin(2 * Math.PI * 1.15 * ve) * 16 +
              Math.sin(2 * Math.PI * 10.1 * ve + 0.4) * 12,
            L =
              Math.sin(2 * Math.PI * 1.55 * ve + 0.2) * 29 +
              Math.sin(2 * Math.PI * 2.8 * ve + 1.1) * 8;
          Ze += Ve * (1 - tt) + L * tt;
        } else if (selectedKnowledgeTopic === "emg") {
          const tt =
              smoothstep((ve - 0.54) / 0.1) *
              (1 - smoothstep((ve - 1.62) / 0.16)),
            Ve =
              Math.sin(2 * Math.PI * 1.1 * ve) * 15 +
              Math.sin(2 * Math.PI * 10 * ve + 0.4) * 10,
            L =
              Math.sin(2 * Math.PI * 24 * ve + 0.3) * 8 +
              Math.sin(2 * Math.PI * 35.5 * ve + 1.1) * 7 +
              Math.sin(2 * Math.PI * 43 * ve + 2.2) * 4;
          Ze += Ve * (1 - tt) + L * tt;
        } else {
          const tt =
            selectedKnowledgeTopic === "delta"
              ? 31
              : selectedKnowledgeTopic === "theta"
                ? 23
                : selectedKnowledgeTopic === "alpha"
                  ? 18
                  : selectedKnowledgeTopic === "beta"
                    ? 10
                    : 6;
          Ze += Math.sin(2 * Math.PI * me.frequency * ve) * tt;
        }
        G === 0 ? R.moveTo(G, Ze) : R.lineTo(G, Ze);
      }
      R.stroke();
    }, [activePanel, selectedKnowledgeTopic, t]));
  const trendSamples = React.useMemo(() => {
      const A = dsaPeriodMinutes === 1 ? 60 : dsaPeriodMinutes * 60,
        R = trendHistory.slice(-(A + 1)),
        me = R[R.length - 1]?.seq ?? 0,
        G = me - A,
        ve = Math.max(1, Math.ceil(A / 180)),
        Ze = R.filter((tt) => tt.seq >= G && tt.seq % ve === 0),
        tt = R[R.length - 1];
      tt && Ze[Ze.length - 1]?.seq !== tt.seq && Ze.push(tt);
      return Ze.map((Ve) => ({
        ...Ve,
        trendX: clamp(((Ve.seq - G) / A) * 600, 0, 600),
      }));
    }, [trendHistory, dsaPeriodMinutes]),
    formatTimelineLabel = (A) => {
      if (A === 4) return t("timeline.now");
      if (dsaPeriodMinutes === 1) return `−${60 - A * 15} s`;
      const R = dsaPeriodMinutes - (A / 4) * dsaPeriodMinutes;
      return dsaPeriodMinutes >= 60
        ? `−${String(R / 60).replace(".", ",")} h`
        : `−${Math.round(R)} min`;
    },
    zt = React.useMemo(
      () =>
        SCENARIOS.find((A) => A.id === selectedScenarioId) ??
        NARKOSE_REISE().find((A) => A.scenario.id === selectedScenarioId)
          ?.scenario ??
        null,
      [selectedScenarioId],
    ),
    Du = classifyClinicalState(
      primaryDrug,
      primaryLevel,
      interpolateDrugProfile(
        DRUG_PROFILES[primaryDrug],
        EFFECT_LEVELS[primaryLevel],
      ).bs,
    ),
    xu =
      opioidDrug === "sufentanil"
        ? {
            ...Du,
          }
        : Du,
    $a = zt ?? xu,
    It =
      zt?.profile ??
      interpolateDrugProfile(
        DRUG_PROFILES[primaryDrug],
        EFFECT_LEVELS[primaryLevel],
      ),
    ja = Object.entries(It.bands).sort((A, R) => R[1] - A[1]),
    ju =
      zt?.simple === "Alpha/Delta" ||
      (It.bands.alpha >= 70 && It.bands.delta >= 70),
    eventKind = It.eventType ?? null,
    eventIsActive =
      getEventEnvelope(It, simulationStateRef.current.time) > 0.08,
    Ou =
      eventKind === "alphaDropout"
        ? tr("Alpha 8–13 Hz transient reduziert")
        : eventKind === "deltaArousal"
          ? tr("Delta 0,5–4 Hz ↑ · Alpha 8–13 Hz ↓")
          : eventKind === "emgArtifact"
            ? tr("Breitbandige schnelle Aktivität / EMG")
            : eventKind === "betaArousal" || eventKind === "nociceptiveBeta"
              ? tr("Alpha/Slow ↓ · Beta 12–25 Hz ↑")
              : (It.spindleStrength ?? 0) > 0.7
                ? tr("Slow/Delta + Spindles 12–16 Hz")
                : (It.arousalStrength ?? 0) > 0
                  ? tr("Alpha/Slow → Beta/Low-Gamma")
                  : It.suppressAlpha
                    ? tr("Delta 0,5–4 Hz · Alpha 8–13 Hz nicht erkennbar")
                    : ju
                      ? tr("Delta 0,5–4 Hz + Alpha 8–13 Hz")
                      : tr(
                          {
                            delta: "Delta · 0,5–4 Hz",
                            theta: "Theta · 4–8 Hz",
                            alpha: "Alpha · 8–13 Hz",
                            beta: "Beta · 13–30 Hz",
                            gamma: "Gamma · 30–45 Hz",
                          }[ja[0][0]],
                        ),
    Et = eventKind
      ? eventIsActive
        ? eventKind === "alphaDropout"
          ? tr("Alpha-Dropout · Reizantwort")
          : eventKind === "deltaArousal"
            ? tr("Paradoxes Delta-Arousal")
            : eventKind === "emgArtifact"
              ? tr("EMG-/Muskelartefakt")
              : eventKind === "nociceptiveBeta"
                ? tr("Ausgeprägte Aktivierungsreaktion")
                : tr("Beta-Arousal · Aktivierungsreaktion")
        : tr("Stabile Ausgangsaktivität · Reizantwort folgt")
      : It.bs > 12
        ? tr("Burst Suppression / Diskontinuität")
        : (It.spindleStrength ?? 0) > 0.7
          ? tr("Spindelpakete auf Slow/Delta")
          : (It.arousalStrength ?? 0) > 0
            ? tr("Transiente Aktivierungsreaktion")
            : It.suppressAlpha
              ? tr("Delta-dominant ohne Alpha-Peak")
              : ju
                ? tr("Alpha/Delta-Komplex")
                : zt?.simple === "Schnelle Aktivität"
                  ? tr("Schnelle Mischaktivität")
                  : zt?.simple === "Theta"
                    ? tr("Theta-betontes Muster")
                    : zt?.simple === "Delta"
                      ? tr("Delta-dominantes Muster")
                      : zt?.simple === "Suppression"
                        ? tr("Suppression")
                        : `${ja[0][0][0].toUpperCase()}${ja[0][0].slice(1)} dominant`,
    ki =
      $a.zone === "red"
        ? tr("Suppressionsmuster klinisch prüfen")
        : $a.zone === "yellow"
          ? tr("Übergang mit Verlauf und Klinik abgleichen")
          : tr("Kontinuierliches Zielbild"),
    _u = Object.keys(DRUG_PROFILES).filter(
      (A) => A !== "awake" && A !== primaryDrug,
    ),
    primaryDrugOptions = Object.keys(DRUG_PROFILES)
      .filter((drug) => drug !== "awake")
      .map((drug) => [drug, DRUG_PROFILES[drug].label]),
    analgesicOptions = Object.keys(ANALGESIC_PROFILES).map((drug) => [
      drug,
      ANALGESIC_PROFILES[drug].label,
    ]),
    medicationEffectLabels = {
      0: t("sim.effect.inactive"),
      1: t("sim.effect.low"),
      2: t("sim.effect.mid"),
      3: t("sim.effect.high"),
      4: t("sim.effect.overdose"),
    },
    medicationBolusLabels = {
      level: t("sim.level"),
      bolus: t("sim.bolusTrigger"),
      bolusActive: t("sim.bolusActive"),
      bolusDisabled: t("sim.bolusDisabled"),
      bolusHint: t("sim.bolusHint"),
      bolusDisabledHint: t("sim.bolusDisabledHint"),
    },
    ol = () => {
      (setJourneyRunning(!1),
        setJourneyPhase(t("journey.ready")),
        (scenarioProfileRef.current = null),
        (scenarioIndicesRef.current = null),
        setSelectedScenarioId(null),
        setSimulatorEnabled(!0));
    },
    ea = (A, R = !1) => {
      (R ||
        (setJourneyRunning(!1),
        setJourneyPhase(t("journey.ready")),
        setJourneyProgress(0)),
        (scenarioProfileRef.current = A.profile),
        (scenarioIndicesRef.current = A.indices),
        (bolusStartedAtRef.current.primary = null),
        (bolusStartedAtRef.current.adjunct = null),
        (bolusStartedAtRef.current.analgesia = null),
        setBolusEpochs({
          primary: null,
          adjunct: null,
          analgesia: null,
        }),
        (simulationStateRef.current.time = 0),
        setPrimaryDrug(A.drug),
        setPrimaryLevel(A.level),
        setAdjunctDrug(A.adjunct),
        setAdjunctLevel(A.adjunctLevel),
        setOpioidDrug(A.opioid),
        setOpioidLevel(A.opioidLevel),
        setSelectedScenarioId(A.id),
        setSimulatorEnabled(!1),
        setSimulationRunning(!0));
    },
    wi = () => {
      ea(SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]);
    },
    triggerMedicationBolus = (category) => {
      if (!simulatorEnabled) return;
      if (category === "adjunct" && adjunctDrug === "none") return;
      if (category === "analgesia" && opioidDrug === "none") return;
      bolusStartedAtRef.current[category] = performance.now();
      setBolusEpochs((current) => ({ ...current, [category]: Date.now() }));
      setBolusActive((current) => ({ ...current, [category]: !0 }));
      setBolusProgress((current) => ({ ...current, [category]: 0 }));
      ol();
    },
    changeRemoteRole = (role) => {
      const nextRole = REMOTE_ROLES.includes(role) ? role : "full";
      replaceRemoteUrl(nextRole, demoSession);
      setRemoteRole(nextRole);
    },
    changeDemoSession = (value) => {
      const nextDemo = parseDemoSession(value) ?? DEMO_SESSIONS[0];
      replaceRemoteUrl(remoteRole, nextDemo);
      setDemoSession(nextDemo);
    },
    controllerUrl = React.useMemo(
      () => buildRemoteUrl("controller", demoSession),
      [demoSession],
    ),
    displayUrl = React.useMemo(
      () => buildRemoteUrl("display", demoSession),
      [demoSession],
    ),
    qrCodeUrl = qrCodeDataUrl,
    Ji = (A) => {
      if (A === "active") {
        if (primaryDrug === "awake") {
          setPrimaryDrug("propofol");
          setPrimaryLevel(0);
        }
        simulatorEnabled || ol();
        return;
      }
      simulatorEnabled && ea(zt ?? DEFAULT_SCENARIO);
    },
    toggleLiveSync = () => {
      setLiveSync((A) => {
        if (A) {
          setDsaPeriodMinutes(originalDsaPeriod.current);
        } else {
          dsaPeriodMinutes !== 1 &&
            (originalDsaPeriod.current = dsaPeriodMinutes);
          setDsaPeriodMinutes(1);
        }
        return !A;
      });
    },
    toggleQconAlarm = () => {
      setQconAlarmEnabled((A) => !A);
    },
    changeQconAlarmMin = (A) => {
      setQconAlarmMin(Math.round(clamp(Number(A), 0, qconAlarmMax)));
    },
    changeQconAlarmMax = (A) => {
      setQconAlarmMax(Math.round(clamp(Number(A), qconAlarmMin, 100)));
    },
    selectDisplayChoice = (A) => {
      const R = displayChoices[A];
      R &&
        (setDisplayChoices((me) =>
          me.map((G, ve) => (ve === A ? displayView : G)),
        ),
        setDisplayView(R));
    },
    activateDirectView = (A) => {
      setDisplayChoices((R) => {
        const me = R.indexOf(A);
        if (me < 0) return R;
        const G = R.slice();
        return ((G[me] = displayView), G);
      });
      setDisplayView(A);
    },
    showSpectrogramOnly = () => {
      displayView !== "dsa-only" && (soloReturnView.current = displayView);
      activateDirectView("dsa-only");
    },
    returnToEeg = () => {
      const A = soloReturnView.current,
        R =
          A === "eeg-index" ||
          A === "eeg-dsa" ||
          A === "all" ||
          A === "eeg-only"
            ? A
            : "eeg-index";
      activateDirectView(R);
    },
    requestDisplayFullscreen = () => {
      const target = document.documentElement,
        request =
          target.requestFullscreen ??
          target.webkitRequestFullscreen ??
          target.webkitEnterFullscreen;
      try {
        request?.call(target)?.catch?.(() => {});
      } catch {}
    },
    openConoxView = (borderless = false) => {
      setBorderlessDisplay(borderless);
      requestDisplayFullscreen();
      changeRemoteRole("display");
      setLinkPanelOpen(!1);
    },
    closeConoxView = () => {
      const exit =
        document.exitFullscreen ??
        document.webkitExitFullscreen ??
        document.webkitCancelFullScreen;
      try {
        exit?.call(document)?.catch?.(() => {});
      } catch {}
      changeRemoteRole("full");
      setBorderlessDisplay(false);
      setLinkPanelOpen(!1);
    },
    Jr = () => {
      if (journeyRunning) {
        (setJourneyRunning(!1),
          setJourneyPhase(t("journey.stopped")),
          setJourneyProgress(0));
        return;
      }
      const A = NARKOSE_REISE();
      ((journeyStateRef.current = {
        elapsed: 0,
        last: performance.now(),
        step: 0,
      }),
        setJourneyRunning(!0),
        setJourneyPhase(A[0].phase),
        setJourneyProgress(0),
        ea(A[0].scenario, !0));
    };
  React.useEffect(() => {
    if (!journeyRunning) return;
    journeyStateRef.current.last = performance.now();
    const A = window.setInterval(() => {
      const R = performance.now(),
        me = journeyStateRef.current,
        G = Math.max(0, (R - me.last) / 1e3);
      if (((me.last = R), !simulationRunning)) return;
      me.elapsed += Math.min(G, 0.5);
      const ve = NARKOSE_REISE(),
        Ze = ve.reduce((tt, Ve, L) => (Ve.at <= me.elapsed ? L : tt), 0);
      (Ze !== me.step &&
        ((me.step = Ze),
        setJourneyPhase(ve[Ze].phase),
        ea(ve[Ze].scenario, !0)),
        setJourneyProgress(
          clamp((me.elapsed / NARKOSE_REISE_DAUER) * 100, 0, 100),
        ),
        me.elapsed >= NARKOSE_REISE_DAUER &&
          (setJourneyRunning(!1),
          setJourneyPhase(t("journey.done")),
          setJourneyProgress(100)));
    }, 250);
    return () => window.clearInterval(A);
  }, [journeyRunning, simulationRunning, NARKOSE_REISE, t]);
  React.useEffect(() => {
    let active = !0;
    QRCode.toDataURL(controllerUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 280,
      color: {
        dark: "#004f99",
        light: "#ffffff",
      },
    })
      .then((dataUrl) => {
        active && setQrCodeDataUrl(dataUrl);
      })
      .catch(() => {
        active && setQrCodeDataUrl("");
      });
    return () => {
      active = !1;
    };
  }, [controllerUrl]);
  const remoteSnapshot = React.useMemo(
    () => ({
      version: 1,
      activePanel,
      displayView,
      displayChoices,
      primaryDrug,
      primaryLevel,
      adjunctDrug,
      adjunctLevel,
      opioidDrug,
      opioidLevel,
      bolusEpochs,
      eegWindowSeconds,
      eegAmplitude,
      dsaPeriodMinutes,
      dsaColorScale,
      liveSync,
      qconAlarmEnabled,
      qconAlarmMin,
      qconAlarmMax,
      sef50Visible,
      sef95Visible,
      simulationRunning,
      simulatorEnabled,
      eegHintsEnabled,
      selectedScenarioId,
      selectedKnowledgeTopic,
      locale,
    }),
    [
      activePanel,
      displayView,
      displayChoices,
      primaryDrug,
      primaryLevel,
      adjunctDrug,
      adjunctLevel,
      opioidDrug,
      opioidLevel,
      bolusEpochs,
      eegWindowSeconds,
      eegAmplitude,
      dsaPeriodMinutes,
      dsaColorScale,
      liveSync,
      qconAlarmEnabled,
      qconAlarmMin,
      qconAlarmMax,
      sef50Visible,
      sef95Visible,
      simulationRunning,
      simulatorEnabled,
      eegHintsEnabled,
      selectedScenarioId,
      selectedKnowledgeTopic,
      locale,
    ],
  );
  React.useEffect(() => {
    remoteStateRef.current = remoteSnapshot;
  }, [remoteSnapshot]);
  const sendRemoteState = React.useCallback((targetPeer) => {
    const action = remoteActionRef.current,
      revision = remoteRevisionRef.current,
      known = remoteKnownStateRef.current;
    if (!action || !revision || !known.state) return;
    action
      .send(
        {
          type: "state",
          version: REMOTE_STATE_VERSION,
          clientId: remoteClientIdRef.current,
          revision,
          state: known.state,
        },
        targetPeer ? { target: targetPeer } : undefined,
      )
      ?.catch?.(() => {});
  }, []);
  const applyRemoteSnapshot = React.useCallback(
    (snapshot, revision) => {
      remoteRevisionRef.current = revision;
      remoteKnownStateRef.current = {
        json: JSON.stringify(snapshot),
        state: snapshot,
      };
      remoteApplyingUntilRef.current = Date.now() + REMOTE_APPLY_SETTLE_MS;
      const nextScenario =
        SCENARIOS.find((item) => item.id === snapshot.selectedScenarioId) ??
        NARKOSE_REISE().find(
          (item) => item.scenario.id === snapshot.selectedScenarioId,
        )?.scenario ??
        null;

      setActivePanel(snapshot.activePanel ?? "monitor");
      setDisplayView(snapshot.displayView ?? "eeg-dsa");
      setDisplayChoices(
        snapshot.displayChoices ?? ["eeg-index", "dsa-index", "all"],
      );
      setPrimaryDrug(snapshot.primaryDrug ?? "propofol");
      setPrimaryLevel(snapshot.primaryLevel ?? 2);
      setAdjunctDrug(snapshot.adjunctDrug ?? "none");
      setAdjunctLevel(snapshot.adjunctLevel ?? 0);
      setOpioidDrug(snapshot.opioidDrug ?? "none");
      setOpioidLevel(snapshot.opioidLevel ?? 0);
      if (snapshot.bolusEpochs) {
        const nextEpochs = {
          primary: snapshot.bolusEpochs.primary ?? null,
          adjunct: snapshot.bolusEpochs.adjunct ?? null,
          analgesia: snapshot.bolusEpochs.analgesia ?? null,
        };
        const now = Date.now();
        Object.entries(nextEpochs).forEach(([category, epoch]) => {
          const age = epoch === null ? Infinity : now - epoch;
          bolusStartedAtRef.current[category] =
            age >= 0 && age < MEDICATION_BOLUS_DURATIONS_MS[category]
              ? performance.now() - age
              : null;
        });
        setBolusEpochs(nextEpochs);
      }
      setEegWindowSeconds(snapshot.eegWindowSeconds ?? 4);
      setEegAmplitude(snapshot.eegAmplitude ?? 120);
      setDsaPeriodMinutes(snapshot.dsaPeriodMinutes ?? 30);
      setDsaColorScale(snapshot.dsaColorScale ?? 0);
      setLiveSync(Boolean(snapshot.liveSync));
      setQconAlarmEnabled(Boolean(snapshot.qconAlarmEnabled));
      setQconAlarmMin(snapshot.qconAlarmMin ?? 20);
      setQconAlarmMax(snapshot.qconAlarmMax ?? 80);
      setSef50Visible(Boolean(snapshot.sef50Visible));
      setSef95Visible(Boolean(snapshot.sef95Visible));
      setSimulationRunning(snapshot.simulationRunning !== !1);
      setSimulatorEnabled(Boolean(snapshot.simulatorEnabled));
      setEegHintsEnabled(snapshot.eegHintsEnabled !== !1);
      setSelectedScenarioId(snapshot.selectedScenarioId ?? null);
      setSelectedKnowledgeTopic(snapshot.selectedKnowledgeTopic ?? "alpha");
      setLocale(snapshot.locale ?? locale);

      scenarioProfileRef.current = nextScenario?.profile ?? null;
      scenarioIndicesRef.current = nextScenario?.indices ?? null;
    },
    [NARKOSE_REISE, SCENARIOS, locale],
  );
  remoteMessageHandlerRef.current = (message, peerId) => {
    if (
      message?.type !== "state" ||
      message.version !== REMOTE_STATE_VERSION ||
      message.clientId === remoteClientIdRef.current ||
      !isRemoteRevision(message.revision) ||
      !message.state ||
      !remoteRevisionRef.current
    )
      return;
    const order = compareRemoteRevisions(
      message.revision,
      remoteRevisionRef.current,
    );
    if (order > 0) applyRemoteSnapshot(message.state, message.revision);
    else if (order < 0) sendRemoteState(peerId);
  };
  React.useEffect(() => {
    try {
      window.localStorage.setItem(DEMO_STORAGE_KEY, String(demoSession));
    } catch {}
  }, [demoSession]);
  React.useEffect(() => {
    const joinedAt = Date.now();
    remoteJoinedAtRef.current = joinedAt;
    remoteRevisionRef.current = {
      rev: 0,
      joinedAt,
      author: remoteClientIdRef.current,
    };
    remoteKnownStateRef.current = {
      json: JSON.stringify(remoteStateRef.current),
      state: remoteStateRef.current,
    };
    setRemotePeers(0);
    setRemoteStatus("remote.status.waiting");

    const peers = new Set();
    const roomId = `${REMOTE_ROOM_PREFIX}${demoSession}`;
    const room = joinRoom(
      {
        appId: "com.nexio.conox-simulator",
        password: roomId,
      },
      roomId,
    );
    const stateAction = room.makeAction("simulator-state");
    remoteActionRef.current = stateAction;
    stateAction.onMessage = (message, context) =>
      remoteMessageHandlerRef.current?.(message, context?.peerId);
    const updatePeers = () => {
      setRemotePeers(peers.size);
      setRemoteStatus(
        peers.size ? "remote.status.connected" : "remote.status.waiting",
      );
    };
    // Every peer sends its state to a newcomer and the newcomer sends its own
    // back; the revision order decides which one is kept, so a fresh device
    // adopts the running demo instead of overwriting it.
    room.onPeerJoin = (peerId) => {
      peers.add(peerId);
      updatePeers();
      sendRemoteState(peerId);
    };
    room.onPeerLeave = (peerId) => {
      peers.delete(peerId);
      updatePeers();
    };
    // Periodic heartbeat heals lost messages; peers holding a newer state
    // answer with it, so every device catches up within one interval.
    const heartbeat = window.setInterval(() => {
      peers.size && sendRemoteState();
    }, REMOTE_HEARTBEAT_MS);
    const resync = () => {
      document.visibilityState !== "hidden" && peers.size && sendRemoteState();
    };
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("online", resync);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("online", resync);
      remoteActionRef.current = null;
      room.leave()?.catch?.(() => {});
    };
  }, [demoSession, sendRemoteState]);
  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const json = JSON.stringify(remoteSnapshot);
      if (json === remoteKnownStateRef.current.json) return;
      remoteKnownStateRef.current = { json, state: remoteSnapshot };
      // Follow-up updates caused by applying a remote state are not new edits.
      if (Date.now() < remoteApplyingUntilRef.current) return;
      remoteRevisionRef.current = {
        rev: (remoteRevisionRef.current?.rev ?? 0) + 1,
        joinedAt: remoteJoinedAtRef.current,
        author: remoteClientIdRef.current,
      };
      sendRemoteState();
    }, 80);
    return () => window.clearTimeout(timeoutId);
  }, [remoteSnapshot, sendRemoteState]);
  return (
    <main
      className={`sb-shell role-${remoteRole}${borderlessDisplay ? " display-borderless" : ""}${linkPanelOpen ? " link-open" : ""}`}
    >
      <header className="sb-header">
        <div className="sb-header-title">
          <strong>{"CONOX 2D EEG Simulator"}</strong>
          <small>{t("app.subtitle")}</small>
        </div>
        <div className="sb-header-actions">
          <div className="sb-remote-switch" aria-label={t("remote.aria")}>
            <div className="sb-remote-controls">
              <select
                value={remoteRole}
                onChange={(event) => changeRemoteRole(event.target.value)}
                aria-label={t("remote.role")}
              >
                <option value="full">{t("remote.role.full")}</option>
                <option value="display">{t("remote.role.display")}</option>
                <option value="controller">
                  {t("remote.role.controller")}
                </option>
              </select>
              <select
                className="sb-demo-select"
                value={demoSession}
                onChange={(event) => changeDemoSession(event.target.value)}
                aria-label={t("remote.demo")}
              >
                {DEMO_SESSIONS.map((demo) => (
                  <option key={demo} value={demo}>
                    {t("remote.demoName", { number: demo })}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="sb-link-button"
                onClick={() => {
                  requestDisplayFullscreen();
                  changeRemoteRole("display");
                  setLinkPanelOpen(!0);
                }}
              >
                {t("remote.link")}
              </button>
            </div>
            <small>
              {t(remoteStatus, {
                // Peers exclude this device; show the total in the demo.
                count: remotePeers + 1,
              })}
            </small>
          </div>
          <div className="sb-header-tools">
            <div className="sb-language-switch" aria-label="Language">
              {LOCALES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={locale === item.code ? "active" : ""}
                  title={item.name}
                  aria-pressed={locale === item.code}
                  onClick={() => setLocale(item.code)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              className="sb-btn"
              type="button"
              onClick={() => openConoxView()}
            >
              {t("remote.displayButton")}
            </button>
            <button
              className="sb-btn"
              type="button"
              onClick={() => openConoxView(true)}
            >
              {t("remote.fullscreenButton")}
            </button>
          </div>
        </div>
      </header>
      {remoteRole === "display" && !linkPanelOpen && (
        <button
          type="button"
          className="sb-display-exit"
          onClick={closeConoxView}
        >
          {t("remote.exitDisplay")}
        </button>
      )}
      {linkPanelOpen && (
        <div
          className="sb-link-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("remote.linkTitle")}
        >
          <div className="sb-link-dialog">
            <button
              type="button"
              className="sb-link-close"
              aria-label={t("remote.close")}
              onClick={() => setLinkPanelOpen(!1)}
            >
              {"×"}
            </button>
            <h2>{t("remote.linkTitle")}</h2>
            <p>{t("remote.linkCopy")}</p>
            {qrCodeUrl && <img src={qrCodeUrl} alt={t("remote.qrAlt")} />}
            <code>{controllerUrl}</code>
            <small>{t("remote.displayUrl", { url: displayUrl })}</small>
          </div>
        </div>
      )}
      <div className="sb-grid">
        <section className="sb-monitor-column">
          <div className="sb-monitor-wrap">
            <a
              className="sb-device-brand"
              href="https://www.fresenius-kabi.com/de-ch"
              target="_blank"
              rel="noreferrer"
              aria-label={t("brand.open")}
            >
              <img
                src="./images/fresenius-kabi-logo.png"
                alt="Fresenius Kabi"
              />
            </a>
            <span className="sb-device-led" aria-hidden="true" />
            <button
              type="button"
              className={`sb-live-switch ${liveSync ? "on" : "off"}`}
              aria-pressed={liveSync}
              aria-label={liveSync ? t("live.on") : t("live.off")}
              onClick={toggleLiveSync}
            >
              <span className="sb-live-dot" aria-hidden="true" />
              <strong>{"LIVE"}</strong>
              <small>
                {liveSync ? t("live.status.on") : t("live.status.off")}
              </small>
            </button>
            <button
              type="button"
              className={`sb-qcon-alarm-key ${qconAlarmEnabled ? "on" : "off"} ${qconAlarmTriggered ? "alert" : ""}`}
              aria-pressed={qconAlarmEnabled}
              aria-label={
                qconAlarmEnabled ? t("alarm.disable") : t("alarm.enable")
              }
              title={
                qconAlarmEnabled
                  ? t("alarm.activeTitle", {
                      min: qconAlarmMin,
                      max: qconAlarmMax,
                    })
                  : t("alarm.enable")
              }
              onClick={toggleQconAlarm}
            >
              <svg
                className="sb-frame-alarm-bell"
                viewBox="0 0 32 32"
                aria-hidden="true"
              >
                <path d="M7 23h18c-2.2-2.7-3.3-6.2-3.3-10.1 0-4.1-2.5-7-5.7-7s-5.7 2.9-5.7 7C10.3 16.8 9.2 20.3 7 23Z" />
                <path d="M13.2 25.4c.5 1.4 1.5 2.2 2.8 2.2s2.3-.8 2.8-2.2" />
                <path d="M14.2 5.8V4.2h3.6v1.6" />
              </svg>
            </button>
            <div className="sb-monitor-scroll">
              <div className="sb-monitor">
                <div className="sb-metrics">
                  <Metric label="SQI" value={currentIndices.sqi} tone="green" />
                  <Metric label="EMG" value={currentIndices.emg} tone="blue" />
                  <Metric label="BSR" value={currentIndices.bsr} tone="red" />
                  <Metric
                    label="qNOX"
                    value={currentIndices.qnox}
                    tone="yellow"
                  />
                </div>
                <section
                  className={`sb-rawbox ${["eeg-index", "eeg-dsa", "all", "eeg-only"].includes(displayView) ? "active" : ""} ${displayView === "all" ? "layout-all-top" : displayView === "eeg-only" ? "layout-full" : "layout-top"}`}
                  aria-label="Raw EEG"
                  aria-hidden={
                    !["eeg-index", "eeg-dsa", "all", "eeg-only"].includes(
                      displayView,
                    )
                  }
                >
                  <div className="sb-signal-caption">
                    <b>{"EEG"}</b>
                    <span>{t("eeg.frontal")}</span>
                    <em>
                      {eegWindowSeconds}
                      {" s"}
                    </em>
                  </div>
                  <div className="sb-raw-content">
                    <div className="sb-raw-scale">
                      <span>{"+"}</span>
                      <b>{eegAmplitude}</b>
                      <small>{"µV"}</small>
                      <span>{"−"}</span>
                    </div>
                    <canvas
                      ref={rawEegCanvasRef}
                      width={1e3}
                      height={170}
                      aria-label={t("eeg.rawLabel")}
                    />
                  </div>
                  {eegHintsEnabled && (
                    <div className="sb-eeg-detection" aria-live="polite">
                      <span>{Ou}</span>
                      <b>{Et}</b>
                    </div>
                  )}
                </section>
                <section
                  className={`sb-dsabox ${["dsa-index", "eeg-dsa", "all", "dsa-only"].includes(displayView) ? "active" : ""} ${displayView === "all" ? "layout-all-middle" : displayView === "dsa-only" ? "layout-full" : displayView === "eeg-dsa" ? "layout-bottom" : "layout-top"}`}
                  aria-label="DSA"
                  aria-hidden={
                    !["dsa-index", "eeg-dsa", "all", "dsa-only"].includes(
                      displayView,
                    )
                  }
                >
                  <div className="sb-signal-caption">
                    <b>{"DSA"}</b>
                    <span ref={eegStatusRef}>{t("eeg.status.active")}</span>
                    <em>{t("dsa.transition")}</em>
                    <div className="sb-dsa-caption-actions">
                      <button
                        type="button"
                        className={`sb-sef-toggle ${sef50Visible ? "active" : ""}`}
                        aria-pressed={sef50Visible}
                        onClick={() => setSef50Visible((A) => !A)}
                        title={t("dsa.sef50Title")}
                      >
                        {"SEF50"}
                        <i aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={`sb-sef-toggle sef95 ${sef95Visible ? "active" : ""}`}
                        aria-pressed={sef95Visible}
                        onClick={() => setSef95Visible((A) => !A)}
                        title={t("dsa.sef95Title")}
                      >
                        {"SEF95"}
                        <i aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="sb-view-direct"
                        onClick={
                          displayView === "dsa-only"
                            ? returnToEeg
                            : showSpectrogramOnly
                        }
                        title={
                          displayView === "dsa-only"
                            ? t("dsa.showEeg")
                            : t("dsa.onlyTitle")
                        }
                      >
                        {displayView === "dsa-only" ? "EEG" : t("dsa.only")}
                      </button>
                    </div>
                  </div>
                  <div className="sb-dsa-content">
                    <div className="sb-frequency-axis">
                      {[45, 40, 35, 30, 25, 20, 15, 10, 5, 0].map((A) => (
                        <span key={A}>{A}</span>
                      ))}
                      <b>{"Hz"}</b>
                    </div>
                    <div className="sb-dsa-canvas">
                      <canvas
                        ref={dsaCanvasRef}
                        width={900}
                        height={260}
                        aria-label={t("dsa.label")}
                      />
                      <canvas
                        ref={dsaOverlayRef}
                        className="sb-sef-overlay"
                        width={900}
                        height={260}
                        aria-label={t("dsa.sefLabel")}
                      />
                      <div className="sb-band-guides" aria-hidden="true">
                        <i
                          style={{
                            top: "33.3%",
                          }}
                        />
                        <i
                          style={{
                            top: "71.1%",
                          }}
                        />
                        <i
                          style={{
                            top: "82.2%",
                          }}
                        />
                        <i
                          style={{
                            top: "91.1%",
                          }}
                        />
                      </div>
                    </div>
                    <div className="sb-db-scale">
                      <div
                        className="sb-db-gradient"
                        role="img"
                        aria-label={t("dsa.scale")}
                      />
                      <div
                        className="sb-db-labels"
                        role="group"
                        aria-label={t("dsa.scaleLevel", {
                          level:
                            dsaColorScale > 0
                              ? `+${dsaColorScale}`
                              : String(dsaColorScale),
                        })}
                      >
                        <button
                          type="button"
                          title={t("dsa.scaleUp")}
                          aria-label={t("dsa.scaleUp")}
                          disabled={dsaColorScale >= DSA_SCALE_MAX}
                          onClick={() =>
                            setDsaColorScale((level) =>
                              Math.min(DSA_SCALE_MAX, level + 1),
                            )
                          }
                        >
                          {"+"}
                        </button>
                        {dsaColorScale !== 0 && (
                          <i
                            className="sb-db-level"
                            style={{
                              top: `${50 - (dsaColorScale / DSA_SCALE_MAX) * 32}%`,
                            }}
                            aria-hidden="true"
                          />
                        )}
                        <button
                          type="button"
                          title={t("dsa.scaleDown")}
                          aria-label={t("dsa.scaleDown")}
                          disabled={dsaColorScale <= DSA_SCALE_MIN}
                          onClick={() =>
                            setDsaColorScale((level) =>
                              Math.max(DSA_SCALE_MIN, level - 1),
                            )
                          }
                        >
                          {"−"}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="sb-timeline">
                    {Array.from(
                      {
                        length: 5,
                      },
                      (A, R) => (
                        <span key={R}>{formatTimelineLabel(R)}</span>
                      ),
                    )}
                  </div>
                </section>
                <section className="sb-qcon">
                  <div>
                    <svg
                      className="sb-qcon-bell"
                      viewBox="0 0 32 32"
                      aria-hidden="true"
                    >
                      <path d="M7 23h18c-2.2-2.7-3.3-6.2-3.3-10.1 0-4.1-2.5-7-5.7-7s-5.7 2.9-5.7 7C10.3 16.8 9.2 20.3 7 23Z" />
                      <path d="M13.2 25.4c.5 1.4 1.5 2.2 2.8 2.2s2.3-.8 2.8-2.2" />
                      <path d="M14.2 5.8V4.2h3.6v1.6" />
                    </svg>
                    {" qCON"}
                  </div>
                  <strong
                    className={
                      qconAlarmTriggered
                        ? qconAlarmFlash
                          ? "alarm-orange"
                          : "alarm-white"
                        : ""
                    }
                    aria-live="polite"
                  >
                    {currentIndices.qcon}
                  </strong>
                  <small>
                    {qconAlarmTriggered
                      ? currentIndices.qcon < qconAlarmMin
                        ? t("alarm.below", { min: qconAlarmMin })
                        : t("alarm.above", { max: qconAlarmMax })
                      : qconAlarmEnabled
                        ? t("alarm.active", {
                            min: qconAlarmMin,
                            max: qconAlarmMax,
                          })
                        : liveSync
                          ? t("alarm.sync")
                          : t("alarm.delayed")}
                  </small>
                </section>
                <div
                  className="sb-view-switch"
                  aria-label={t("display.viewAria", {
                    label: DISPLAY_VIEWS[displayView].label,
                  })}
                >
                  {displayChoices.map((A, R) => (
                    <button
                      key={`${R}-${A}`}
                      type="button"
                      className="sb-view-option"
                      onClick={() => selectDisplayChoice(R)}
                      title={DISPLAY_VIEWS[A].description}
                      aria-label={DISPLAY_VIEWS[A].label}
                    >
                      {DisplayViewIconFor(A)}
                      <small>{DISPLAY_VIEWS[A].label}</small>
                    </button>
                  ))}
                </div>
                <section
                  className={`sb-trendbox ${["eeg-index", "dsa-index", "all"].includes(displayView) ? "" : "hidden"} ${displayView === "all" ? "layout-all-bottom" : ""}`}
                  aria-label={t("display.trendAria")}
                  aria-hidden={
                    !["eeg-index", "dsa-index", "all"].includes(displayView)
                  }
                >
                  <div className="sb-trend-scale" aria-hidden="true">
                    <span>{"100"}</span>
                    <span>{"75"}</span>
                    <span>{"50"}</span>
                    <span>{"25"}</span>
                    <span>{"0"}</span>
                  </div>
                  <TrendChart samples={trendSamples} />
                  <div className="sb-trend-legend">
                    <b className="qcon">{"qCON"}</b>
                    <b className="qnox">{"qNOX"}</b>
                    <b className="bsr">{"BSR"}</b>
                    <b className="emg">{"EMG"}</b>
                  </div>
                  <div className="sb-trend-time">
                    {Array.from(
                      {
                        length: 5,
                      },
                      (A, R) => (
                        <span key={R}>{formatTimelineLabel(R)}</span>
                      ),
                    )}
                  </div>
                </section>
                <section className="sb-assistant sb-case-picker">
                  <h3>{t("cases.title")}</h3>
                  <label>
                    <span>{t("cases.select")}</span>
                    <select
                      value={selectedScenarioId ?? ""}
                      onChange={(A) => {
                        const R = SCENARIOS.find(
                          (me) => me.id === A.target.value,
                        );
                        R && ea(R);
                      }}
                      aria-label={t("cases.aria")}
                    >
                      {zt?.group === "journey" && (
                        <option value={zt.id}>
                          {t("cases.journey", { name: zt.name })}
                        </option>
                      )}
                      {!selectedScenarioId && (
                        <option value="">{t("cases.free")}</option>
                      )}
                      {SCENARIOS.map((A) => (
                        <option key={A.id} value={A.id}>
                          {A.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" onClick={wi}>
                    {t("cases.random")}
                  </button>
                  <button
                    type="button"
                    className={simulationRunning ? "" : "paused"}
                    aria-pressed={!simulationRunning}
                    onClick={() =>
                      setSimulationRunning(
                        (A) => ((simulationConfigRef.current.running = !A), !A),
                      )
                    }
                  >
                    {simulationRunning
                      ? t("control.pause")
                      : t("control.resume")}
                  </button>
                </section>
                <div
                  className={`sb-monitor-footer ${eegHintsEnabled ? "analysis-on" : "analysis-off"}`}
                  aria-label={t("analysis.aria")}
                >
                  {eegHintsEnabled ? (
                    <>
                      <span>
                        <b>{t("analysis.pattern")}</b>
                        {Et}
                      </span>
                      <span>
                        <b>{t("analysis.dominant")}</b>
                        {Ou}
                      </span>
                      <span>
                        <b>{t("analysis.assessment")}</b>
                        {ki}
                      </span>
                    </>
                  ) : (
                    <>
                      <span />
                      <span />
                      <span />
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="sb-device-wordmark" aria-label="CONOX">
              <img src="./images/conox-wordmark.png" alt="CONOX" />
            </div>
          </div>
          <div className="sb-device-actions" aria-label={t("docs.aria")}>
            <a
              href="#"
              data-embedded-pdf="conox-brochure-pdf"
              target="_blank"
              rel="noreferrer"
            >
              {t("docs.brochure")}
            </a>
            <a
              href="#"
              data-embedded-pdf="conox-datasheet-pdf"
              target="_blank"
              rel="noreferrer"
            >
              {t("docs.datasheet")}
            </a>
            <a
              href="#"
              data-conox-email-draft="true"
              title={t("docs.contactTitle")}
            >
              {t("docs.contact")}
            </a>
          </div>
          <section
            className="sb-simulator-launch sb-journey-launch"
            aria-label={t("journey.title")}
          >
            <div>
              <b>{t("journey.title")}</b>
              <span>
                {journeyRunning
                  ? t("journey.active", { phase: journeyPhase })
                  : journeyPhase === t("journey.done")
                    ? journeyPhase
                    : t("journey.default")}
              </span>
              <div className="sb-journey-progress">
                <i
                  style={{
                    width: `${journeyProgress}%`,
                  }}
                />
              </div>
            </div>
            <button type="button" className="sb-btn" onClick={Jr}>
              {journeyRunning ? t("journey.stop") : t("journey.start")}
            </button>
          </section>
          <section className="sb-simulator-launch" aria-label={t("sim.aria")}>
            <div>
              <b>{t("sim.title")}</b>
              <span>
                {simulatorEnabled ? t("sim.freeShown") : t("sim.hidden")}
              </span>
            </div>
            <label className="sb-simulator-mode">
              <span>{"SIMULATOR"}</span>
              <select
                value={simulatorEnabled ? "active" : "inactive"}
                onChange={(A) => Ji(A.target.value)}
                data-testid="simulator-mode"
                aria-label={t("sim.toggleAria")}
              >
                <option value="inactive">{t("sim.inactive")}</option>
                <option value="active">{t("sim.active")}</option>
              </select>
            </label>
          </section>
          {simulatorEnabled && (
            <section
              className="sb-simulator active"
              aria-label={t("sim.title")}
            >
              <header>
                <div>
                  <span>{"MEDIKAMENTENSIMULATOR"}</span>
                  <h2>{t("sim.heading")}</h2>
                </div>
              </header>
              <p>{t("sim.copy")}</p>
              <fieldset>
                <div className="sb-medication-grid">
                  <MedicationChannel
                    category="primary"
                    title={t("sim.primaryTitle")}
                    description={t("sim.primaryDescription")}
                    drugLabel={t("sim.primaryDrugLabel")}
                    drug={primaryDrug}
                    drugOptions={primaryDrugOptions}
                    onDrugChange={(drug) => {
                      setPrimaryDrug(drug);
                      if (drug === adjunctDrug) setAdjunctDrug("none");
                      ol();
                    }}
                    level={primaryLevel}
                    onLevelChange={(level) => {
                      setPrimaryLevel(level);
                      ol();
                    }}
                    bolusActive={bolusActive.primary}
                    bolusProgress={bolusProgress.primary}
                    onBolus={() => triggerMedicationBolus("primary")}
                    labels={medicationBolusLabels}
                    effectLabels={medicationEffectLabels}
                  />
                  <MedicationChannel
                    category="adjunct"
                    title={t("sim.adjunctTitle")}
                    description={t("sim.adjunctDescription")}
                    drugLabel={t("sim.adjunctDrugLabel")}
                    drug={adjunctDrug}
                    drugOptions={[
                      ["none", t("sim.noAdjunct")],
                      ..._u.map((drug) => [drug, DRUG_PROFILES[drug].label]),
                    ]}
                    onDrugChange={(drug) => {
                      setAdjunctDrug(drug);
                      ol();
                    }}
                    level={adjunctLevel}
                    onLevelChange={(level) => {
                      setAdjunctLevel(level);
                      ol();
                    }}
                    bolusActive={bolusActive.adjunct}
                    bolusProgress={bolusProgress.adjunct}
                    onBolus={() => triggerMedicationBolus("adjunct")}
                    bolusDisabled={adjunctDrug === "none"}
                    labels={medicationBolusLabels}
                    effectLabels={medicationEffectLabels}
                  />
                  <MedicationChannel
                    category="analgesia"
                    title={t("sim.analgesiaTitle")}
                    description={t("sim.analgesiaDescription")}
                    drugLabel={t("sim.analgesiaDrugLabel")}
                    drug={opioidDrug}
                    drugOptions={[
                      ["none", t("sim.noOpioid")],
                      ...analgesicOptions,
                    ]}
                    onDrugChange={(drug) => {
                      setOpioidDrug(drug);
                      ol();
                    }}
                    level={opioidLevel}
                    onLevelChange={(level) => {
                      setOpioidLevel(level);
                      ol();
                    }}
                    bolusActive={bolusActive.analgesia}
                    bolusProgress={bolusProgress.analgesia}
                    onBolus={() => triggerMedicationBolus("analgesia")}
                    bolusDisabled={opioidDrug === "none"}
                    labels={medicationBolusLabels}
                    effectLabels={medicationEffectLabels}
                  />
                </div>
                <div className="sb-simulator-note">
                  {opioidDrug !== "none"
                    ? t(`sim.analgesicSignature.${opioidDrug}`)
                    : t("sim.medicationNoteInactive")}
                  {t("sim.medicationNoteCommon")}
                </div>
                <div className="sb-simulator-actions">
                  <button
                    type="button"
                    onClick={() => setSimulationRunning((A) => !A)}
                  >
                    {simulationRunning ? t("sim.pause") : t("sim.resume")}
                  </button>
                </div>
              </fieldset>
            </section>
          )}
        </section>
        <aside className="sb-panel">
          <span className="sb-badge">{t("panel.badge")}</span>
          <h1>{t("panel.title")}</h1>
          <p className="sb-muted">{t("panel.copy")}</p>
          <nav className="sb-tabs" aria-label={t("panel.aria")}>
            {[
              ["monitor", t("tab.monitor")],
              ["learn", t("tab.learn")],
            ].map(([A, R]) => (
              <button
                key={A}
                type="button"
                className={activePanel === A ? "active" : ""}
                onClick={() => setActivePanel(A)}
              >
                {R}
              </button>
            ))}
          </nav>
          {activePanel === "monitor" && (
            <div className="sb-tab-panel">
              <h2>{t("cases.title")}</h2>
              <div className="sb-panel-cases">
                <SelectField
                  label={t("cases.select")}
                  value={selectedScenarioId ?? ""}
                  onChange={(value) => {
                    const nextScenario = SCENARIOS.find(
                      (scenario) => scenario.id === value,
                    );
                    nextScenario && ea(nextScenario);
                  }}
                  options={[
                    ...(zt?.group === "journey"
                      ? [[zt.id, t("cases.journey", { name: zt.name })]]
                      : []),
                    ...(!selectedScenarioId ? [["", t("cases.free")]] : []),
                    ...SCENARIOS.map((scenario) => [
                      scenario.id,
                      scenario.name,
                    ]),
                  ]}
                />
                <div className="sb-panel-case-actions">
                  <button type="button" onClick={wi}>
                    {t("cases.random")}
                  </button>
                  <button
                    type="button"
                    className={simulationRunning ? "" : "active"}
                    aria-pressed={!simulationRunning}
                    onClick={() =>
                      setSimulationRunning(
                        (running) => (
                          (simulationConfigRef.current.running = !running),
                          !running
                        ),
                      )
                    }
                  >
                    {simulationRunning
                      ? t("control.pause")
                      : t("control.resume")}
                  </button>
                </div>
              </div>
              <h2>{t("display.heading")}</h2>
              <div className="sb-form-grid">
                <SelectField
                  label={t("display.window")}
                  value={eegWindowSeconds}
                  onChange={(A) => setEegWindowSeconds(Number(A))}
                  options={[
                    ["2", t("display.seconds", { count: 2 })],
                    ["4", t("display.seconds", { count: 4 })],
                    ["8", t("display.seconds", { count: 8 })],
                  ]}
                />
                <SelectField
                  label={t("display.amplitude")}
                  value={eegAmplitude}
                  onChange={(A) => setEegAmplitude(Number(A))}
                  options={[
                    ["25", "25 µV"],
                    ["50", "50 µV"],
                    ["120", "120 µV"],
                    ["475", "475 µV"],
                  ]}
                />
                <SelectField
                  label={t("display.period")}
                  value={dsaPeriodMinutes}
                  disabled={liveSync}
                  onChange={(A) => {
                    const R = Number(A);
                    ((originalDsaPeriod.current = R), setDsaPeriodMinutes(R));
                  }}
                  options={
                    liveSync
                      ? [["1", t("display.live60")]]
                      : [
                          ["5", t("display.minutesDemo", { count: 5 })],
                          ["30", t("display.minutesConox", { count: 30 })],
                          ["120", t("display.hoursConox", { count: 2 })],
                          ["360", t("display.hoursConox", { count: 6 })],
                        ]
                  }
                />
                <div className="sb-readonly">
                  <label>{t("display.dsaScale")}</label>
                  <strong>{"0–45 Hz · −30/+50 dB"}</strong>
                </div>
              </div>
              <h2>{t("alarm.heading")}</h2>
              <div
                className={`sb-qcon-alarm-control ${qconAlarmEnabled ? "active" : ""} ${qconAlarmTriggered ? "triggered" : ""}`}
              >
                <div className="sb-qcon-alarm-head">
                  <div>
                    <strong>{t("alarm.label")}</strong>
                    <span>
                      {qconAlarmTriggered
                        ? t("alarm.limitExceeded")
                        : qconAlarmEnabled
                          ? t("alarm.active", {
                              min: qconAlarmMin,
                              max: qconAlarmMax,
                            })
                          : t("alarm.disabled")}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="sb-alarm-toggle"
                    aria-pressed={qconAlarmEnabled}
                    onClick={toggleQconAlarm}
                  >
                    {qconAlarmEnabled ? t("alarm.on") : t("alarm.off")}
                  </button>
                </div>
                <div className="sb-qcon-alarm-ranges">
                  <label>
                    <span>
                      {"Min"}
                      <b>{qconAlarmMin}</b>
                    </span>
                    <div>
                      <button
                        type="button"
                        onClick={() => changeQconAlarmMin(qconAlarmMin - 1)}
                        aria-label={t("alarm.minDown")}
                      >
                        {"−"}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={qconAlarmMin}
                        onChange={(A) => changeQconAlarmMin(A.target.value)}
                        aria-label={t("alarm.minRange")}
                      />
                      <button
                        type="button"
                        onClick={() => changeQconAlarmMin(qconAlarmMin + 1)}
                        aria-label={t("alarm.minUp")}
                      >
                        {"+"}
                      </button>
                    </div>
                  </label>
                  <label>
                    <span>
                      {"Max"}
                      <b>{qconAlarmMax}</b>
                    </span>
                    <div>
                      <button
                        type="button"
                        onClick={() => changeQconAlarmMax(qconAlarmMax - 1)}
                        aria-label={t("alarm.maxDown")}
                      >
                        {"−"}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={qconAlarmMax}
                        onChange={(A) => changeQconAlarmMax(A.target.value)}
                        aria-label={t("alarm.maxRange")}
                      />
                      <button
                        type="button"
                        onClick={() => changeQconAlarmMax(qconAlarmMax + 1)}
                        aria-label={t("alarm.maxUp")}
                      >
                        {"+"}
                      </button>
                    </div>
                  </label>
                </div>
                <small>{t("alarm.note")}</small>
              </div>
              <h2>{t("detection.heading")}</h2>
              <div className="sb-detection-control">
                <div>
                  <strong>{t("detection.title")}</strong>
                  <span>{t("detection.copy")}</span>
                </div>
                <label>
                  <input
                    type="checkbox"
                    checked={eegHintsEnabled}
                    onChange={(A) => setEegHintsEnabled(A.target.checked)}
                  />
                  <span>
                    {eegHintsEnabled ? t("sim.active") : t("sim.inactive")}
                  </span>
                </label>
              </div>
              <div className="sb-callout">{t("detection.callout")}</div>
            </div>
          )}
          {activePanel === "learn" && (
            <div className="sb-tab-panel">
              <h2>{t("learn.heading")}</h2>
              <SelectField
                label={t("learn.frequency")}
                value={selectedKnowledgeTopic}
                onChange={(A) => setSelectedKnowledgeTopic(A)}
                options={[
                  ["awake", EEG_KNOWLEDGE.awake.title],
                  ["delta", EEG_KNOWLEDGE.delta.title],
                  ["theta", EEG_KNOWLEDGE.theta.title],
                  ["alpha", EEG_KNOWLEDGE.alpha.title],
                  ["beta", EEG_KNOWLEDGE.beta.title],
                  ["gamma", EEG_KNOWLEDGE.gamma.title],
                  ["spindle", EEG_KNOWLEDGE.spindle.title],
                  ["arousal", EEG_KNOWLEDGE.arousal.title],
                  ["alphaDropout", EEG_KNOWLEDGE.alphaDropout.title],
                  ["deltaArousal", EEG_KNOWLEDGE.deltaArousal.title],
                  ["emg", EEG_KNOWLEDGE.emg.title],
                  ["mixed", EEG_KNOWLEDGE.mixed.title],
                  ["suppression", EEG_KNOWLEDGE.suppression.title],
                ]}
              />
              <canvas
                className="sb-mini-wave"
                ref={knowledgeCanvasRef}
                width={560}
                height={150}
              />
              <div className="sb-learning-card">
                <h2>{EEG_KNOWLEDGE[selectedKnowledgeTopic].title}</h2>
                <FactRow
                  label={t("learn.character")}
                  value={EEG_KNOWLEDGE[selectedKnowledgeTopic].morph}
                />
                <FactRow
                  label={t("learn.when")}
                  value={EEG_KNOWLEDGE[selectedKnowledgeTopic].when}
                />
                <FactRow
                  label={t("learn.meaning")}
                  value={EEG_KNOWLEDGE[selectedKnowledgeTopic].meaning}
                />
                <FactRow
                  label={t("learn.influence")}
                  value={EEG_KNOWLEDGE[selectedKnowledgeTopic].influence}
                />
                <div className="sb-drug-note">
                  <strong>{t("learn.drugNote")}</strong>
                  <span>{EEG_KNOWLEDGE[selectedKnowledgeTopic].drugNote}</span>
                </div>
              </div>
              <div className="sb-callout">{t("learn.callout")}</div>
            </div>
          )}
          <div className="sb-note">{t("note.medical")}</div>
        </aside>
      </div>
    </main>
  );
}
