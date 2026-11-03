import { PATTERN_REFERENCES } from "./scenarios.js";

export var SOURCE =
  "https://eifu.fresenius-kabi.com/medtech/conox-fixed/18958-2_CNX_SPEC_IFU_Conox2D_ENG.pdf";
export var METRICS = [
  {
    id: "qcon",
    label: "qCON",
    detail: "Consciousness",
    selector: ".sb-qcon",
  },
  {
    id: "qnox",
    label: "qNOX",
    detail: "Response probability",
    selector: ".sb-metric:nth-child(4)",
  },
  {
    id: "sqi",
    label: "SQI",
    detail: "Signal quality",
    selector: ".sb-metric:nth-child(1)",
  },
  {
    id: "emg",
    label: "EMG",
    detail: "Muscle activity",
    selector: ".sb-metric:nth-child(2)",
  },
  {
    id: "bsr",
    label: "BSR",
    detail: "Suppression",
    selector: ".sb-metric:nth-child(3)",
  },
  {
    id: "eeg",
    label: "EEG / DSA",
    detail: "Signal patterns",
    selector: ".sb-rawbox, .sb-dsabox",
  },
];
export var options = (correct, a, b) => [
  {
    id: "a",
    label: a[0],
    feedback: a[1],
  },
  {
    id: "b",
    label: correct,
    correct: true,
  },
  {
    id: "c",
    label: b[0],
    feedback: b[1],
  },
];
export var PATHS = [
  {
    id: "discover",
    title: "Discover EEG",
    audience: "I\u2019m new to EEG monitoring",
    tag: "A little guidance",
    color: "mint",
    icon: "sprout",
    description:
      "See what EEG adds to a clinical assessment. One step at a time.",
    support: "A guided demo \xB7 No quiz",
    outcome: "Get comfortable with the display and its main functions.",
    missions: [
      {
        id: "discover-signal",
        title: "Meet Conox",
        intro: "Start with the quality of the signal.",
        scenarioId: "target-a",
        kind: "scan",
        evidence: ["sqi", "eeg"],
        prompt:
          "Find SQI and EEG / DSA. Select both to locate them on the monitor.",
        scene:
          "Your first look at the Conox display. Explore an existing simulator reference signal.",
        guide:
          "Start with the measurement: SQI describes signal quality; EEG shows the signal itself.",
        question: "What should accompany your first look at the indices?",
        options: options(
          "Check the signal quality, electrode contact and the EEG.",
          [
            "Read qCON only.",
            "The surrounding information helps you assess the measurement.",
          ],
          [
            "Treat SQI as a sedation score.",
            "SQI describes signal quality, not sedation.",
          ],
        ),
        takeaway:
          "Conox brings indices and signal information together. Start by checking the measurement before interpreting the numbers.",
        reference:
          "IFU \xA73.8\u20133.11 \xB7 Signal quality, EEG and impedance.",
      },
      {
        id: "discover-indices",
        title: "Two numbers, two questions",
        intro: "Give qCON and qNOX their own roles.",
        scenarioId: "target-a",
        kind: "match",
        prompt:
          "Match each index to the information it is designed to provide.",
        scene:
          "The two large indices answer different questions. Their values are not interchangeable.",
        guide:
          "qCON relates to consciousness. qNOX relates to the probability of response to a noxious stimulus.",
        question: "How would you use these two indices together?",
        options: options(
          "Read each for its own purpose, alongside the signal and clinical assessment.",
          [
            "Use either number; they mean the same thing.",
            "The two indices have different intended functions.",
          ],
          [
            "Read qNOX as a pain-intensity score.",
            "qNOX is not a measure of perceived pain intensity.",
          ],
        ),
        takeaway:
          "qCON and qNOX provide two complementary pieces of information on one display.",
        reference: "IFU \xA73.4\u20133.5 \xB7 qCON and qNOX.",
      },
      {
        id: "discover-display",
        title: "Look beyond the number",
        intro: "Explore EEG, DSA and suppression.",
        scenarioId: "icu-suppression",
        kind: "scan",
        evidence: ["bsr", "eeg"],
        prompt:
          "Find the BSR and the EEG / DSA. Select both to see where they appear.",
        scene:
          "This existing simulator example contains bursts and quieter intervals. It is a pattern exercise, not a patient treatment target.",
        guide:
          "BSR summarises suppression. The raw EEG lets you examine the alternating activity.",
        question: "What does BSR describe?",
        options: options(
          "The proportion of flat EEG in the monitor\u2019s analysis window.",
          [
            "The strength of pain relief.",
            "BSR describes EEG suppression, not analgesia.",
          ],
          [
            "A score that should always be maximised.",
            "Suppression is a finding to interpret in context, not a universal goal.",
          ],
        ),
        takeaway:
          "The EEG and BSR help you recognise suppression rather than relying on a single consciousness value.",
        reference: "IFU \xA73.6 \xB7 Burst Suppression Ratio.",
      },
      {
        id: "discover-advisory",
        title: "Try the qCON advisory",
        intro: "Turn it on and see a threshold crossing.",
        scenarioId: "target-a",
        kind: "advisory",
        prompt:
          "Enable the advisory. Lower the upper limit below the displayed qCON to trigger a visual reminder.",
        scene:
          "A controls demonstration using the simulator\u2019s existing limits. These settings are not clinical targets. No sound is required for this exercise.",
        guide:
          "The advisory is linked to qCON. Change the upper limit while watching the qCON area.",
        question: "What does the advisory tell you?",
        options: options(
          "qCON has crossed a configured limit; assess the signal and patient.",
          [
            "It provides a diagnosis and a drug dose.",
            "A threshold crossing is not a prescription or diagnosis.",
          ],
          [
            "It allows the patient to be monitored unattended.",
            "The IFU excludes using this advisory for unattended parameter monitoring.",
          ],
        ),
        takeaway:
          "Configurable qCON limits provide an additional visual and acoustic reminder. They support, rather than replace, active monitoring.",
        reference: "IFU \xA75.2.8 \xB7 qCON advisory signal.",
      },
    ],
  },
  {
    id: "explore",
    title: "Explore Conox",
    audience: "I already use EEG monitoring",
    tag: "A closer look",
    color: "blue",
    icon: "compass",
    description:
      "Put the Conox features to work. Connect the numbers, patterns and context.",
    support: "Short briefings \xB7 Hints on request",
    outcome:
      "Practise reading the information together in an ICU learning context.",
    missions: [
      {
        id: "explore-goal",
        title: "Agree the sedation goal",
        intro: "Give the team a shared language.",
        scenarioId: "target-a",
        kind: "scan",
        evidence: ["qcon", "eeg"],
        prompt:
          "Select qCON and EEG / DSA to review alongside the documented clinical target.",
        scene:
          "At handover, a colleague proposes converting the displayed qCON directly into a RASS score. The team needs to agree what this patient requires and how it will reassess that goal.",
        guide:
          "RASS assesses the response to stimulation. qCON is an EEG-derived index. Read them together without treating them as the same scale.",
        question: "How would you describe the goal at handover?",
        options: [
          {
            id: "a",
            label: "Use qCON 65 as a universal equivalent of RASS −2.",
            feedback:
              "The relationship varies across patients, drugs and conditions. There is no fixed conversion.",
          },
          {
            id: "b",
            label:
              "State the clinical target and its reason, then discuss the index, EEG and patient response together.",
            correct: true,
          },
          {
            id: "c",
            label:
              "Aim for the lowest possible qCON in every ventilated patient.",
            feedback:
              "The target follows the current treatment situation; a lower number is not automatically better.",
          },
        ],
        takeaway:
          "A shared goal includes its clinical reason and when it will be reviewed. qCON adds a trend to that conversation; it does not assign a RASS score.",
        reference: "qCON–RASS observational study · No universal conversion.",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9067479/",
      },
      {
        id: "explore-trends",
        title: "Put changes on a timeline",
        intro: "Connect the display with treatment events.",
        scenarioId: "icu-continuous",
        kind: "views",
        prompt: "Open “All signals” to see EEG, DSA and index trends together.",
        scene:
          "At handover, the team asks when the EEG changed in relation to care, boluses or infusion adjustments. Practise finding the combined view on this reference display.",
        guide:
          "The raw EEG shows the current pattern. DSA and index trends help locate changes over time; clinical event times must be checked separately.",
        question: "What makes a trend useful for reviewing sedation?",
        options: [
          {
            id: "a",
            label:
              "Use the lowest index alone to calculate the correct infusion rate.",
            feedback: "The display does not calculate an individual dose.",
          },
          {
            id: "b",
            label:
              "Compare EEG and index changes with the timing of treatment and assessments.",
            correct: true,
          },
          {
            id: "c",
            label:
              "Diagnose drug tolerance or a ceiling effect from a plateau alone.",
            feedback:
              "A mismatch between dose and observed effect prompts a broader review; a plateau does not establish its cause.",
          },
        ],
        takeaway:
          "Use the timeline to ask when a change began and what else happened. Review drug delivery, medication effects and the patient before explaining a changing dose–effect relationship.",
        reference:
          "ICU pEEG consensus · Raw EEG, spectrogram and clinical context.",
        url: "https://link.springer.com/article/10.1007/s12028-022-01565-5",
      },
      {
        id: "explore-awakening",
        title: "Prepare an awakening trial",
        intro: "Revisit the goal as the situation changes.",
        scenarioId: "alpha-loss",
        kind: "scan",
        evidence: ["qcon", "eeg"],
        prompt:
          "Select qCON and EEG / DSA as additional observations during a planned reassessment.",
        scene:
          "Later in the ICU stay, the acute reason for deep sedation has resolved. The team is considering an awakening trial and first checks its local safety criteria.",
        guide:
          "Observe responsiveness and tolerance alongside the EEG and trend. A higher index does not establish orientation or readiness for extubation.",
        question: "How can EEG monitoring contribute to this trial?",
        options: [
          {
            id: "a",
            label:
              "Start an awakening trial as soon as qCON reaches a fixed number.",
            feedback:
              "Eligibility is a clinical decision; a numerical threshold does not replace the safety screen.",
          },
          {
            id: "b",
            label:
              "Add the EEG and index trend to clinical reassessment after the safety screen, using the team’s trial protocol.",
            correct: true,
          },
          {
            id: "c",
            label:
              "Treat the EEG as a guarantee that the patient can be extubated.",
            feedback:
              "Awakening and breathing readiness require their own assessments.",
          },
        ],
        takeaway:
          "Reassess the reason for sedation as the clinical situation evolves. EEG is an additional observation during a supervised trial, not its eligibility or stopping rule.",
        reference: "AHRQ · Coordinated awakening and breathing trials.",
        url: "https://www.ahrq.gov/hai/tools/mvp/modules/technical/sat-sbt-protocol.html",
      },
      {
        id: "explore-suppression",
        title: "Deep does not mean suppressed",
        intro: "Compare continuity, early gaps and suppression.",
        scenarioId: "icu-continuous",
        kind: "compare",
        references: PATTERN_REFERENCES,
        prompt:
          "Explore all three references. Compare continuity in the EEG with BSR and DSA.",
        scene:
          "Deep sedation may coexist with continuous activity. These three independent examples make the distinction from emerging discontinuity and longer suppressed intervals visible.",
        guide:
          "Watch each pattern over several seconds. Quieter intervals lengthen across the examples; the comparison is not a drug-dose response.",
        question: "Does a RASS of −4 or −5 require burst suppression?",
        options: [
          {
            id: "a",
            label:
              "Yes, burst suppression confirms the target for every deeply sedated patient.",
            feedback:
              "Deep sedation is not a universal indication for suppression.",
          },
          {
            id: "b",
            label:
              "No. The clinical response and the EEG pattern are separate observations; suppression needs its own context.",
            correct: true,
          },
          {
            id: "c",
            label: "No, because a continuous EEG proves the patient is awake.",
            feedback:
              "Continuous alpha/delta activity can occur with deep sedation in this context.",
          },
        ],
        takeaway:
          "Check whether suppression is intended. If it is unexpected, review the signal, possible causes and treatment goal with the team. Specific neurological indications need a separate specialist plan.",
        reference:
          "ICU pEEG consensus · Recognising and interpreting suppression.",
        url: "https://link.springer.com/article/10.1007/s12028-022-01565-5",
      },
    ],
  },
  {
    id: "challenge",
    title: "Conox Challenges",
    audience: "I know Conox",
    tag: "A curious mind",
    color: "lavender",
    icon: "sparkles",
    description:
      "Read the whole picture. Investigate clues and explain your decisions.",
    support: "Independent challenges \xB7 No time pressure",
    outcome:
      "Test your observation and reasoning with familiar simulator patterns.",
    missions: [
      {
        id: "challenge-artefact",
        title: "Look beyond ventilator tolerance",
        intro: "Investigate a cough, movement and fast activity.",
        scenarioId: "artifact-emg",
        kind: "scan",
        evidence: ["emg", "eeg"],
        prompt:
          "Choose the pair of clues that helps separate muscle activity from the EEG.",
        scene:
          "Another patient on pressure support triggers breaths, coughs and intermittently becomes asynchronous. Fast activity appears on the display. These signs need investigation, not an automatic increase in sedation.",
        guide:
          "Movement and EMG may contribute to fast activity and higher indices. Neither synchrony nor a high number alone establishes the patient’s conscious experience.",
        question: "What should happen before interpreting the index rise?",
        options: [
          {
            id: "a",
            label:
              "Assume coughing proves pain and deepen sedation immediately.",
            feedback:
              "Cough and asynchrony have several possible causes, including tube irritation; assess them in context.",
          },
          {
            id: "b",
            label:
              "Assess the patient, breathing interaction and signal quality; compare EMG with the raw EEG.",
            correct: true,
          },
          {
            id: "c",
            label:
              "Treat stable heart rate and SpO₂ as proof that sedation is adequate.",
            feedback:
              "These values matter for patient safety, but are not direct measures of sedation depth.",
          },
        ],
        takeaway:
          "Ventilator behaviour and haemodynamics are clinical clues. EEG adds information about brain activity; none of these observations should be turned into a diagnosis on its own.",
        reference: "ICU pEEG consensus · EMG, artefacts and interpretation.",
        url: "https://link.springer.com/article/10.1007/s12028-022-01565-5",
      },
      {
        id: "challenge-context",
        title: "Read the whole picture",
        intro: "Bring medication context into the interpretation.",
        scenarioId: "prop-ketamine",
        kind: "scan",
        evidence: ["qcon", "eeg"],
        prompt:
          "Select two display elements to review alongside the medication context.",
        scene:
          "This is the existing propofol/ketamine example from the simulator. Review the index and signal together.",
        guide:
          "The IFU describes a possible rise in the indices with ketamine that is not linked to the anaesthetic state.",
        question: "How should a higher index be interpreted in this context?",
        options: options(
          "Consider the medication effect, the signal and the patient before concluding wakefulness.",
          [
            "The index proves a return of consciousness.",
            "The medication context prevents that conclusion from the index alone.",
          ],
          [
            "Ignore all EEG information once ketamine is involved.",
            "The signal still contributes to a broader assessment.",
          ],
        ),
        takeaway:
          "Medication context matters. A number must be interpreted alongside the information that can influence it.",
        reference: "IFU \xA73.1 \xB7 Ketamine warning.",
      },
      {
        id: "challenge-change",
        title: "Notice the early gaps",
        intro: "Recognise a change before assuming its cause.",
        scenarioId: "icu-continuous",
        kind: "compare",
        references: PATTERN_REFERENCES,
        prompt:
          "Inspect all three references. Find the intermediate pattern as well as the marked suppression.",
        scene:
          "A clinical RASS assessment can remain unchanged while EEG continuity changes. These reference patterns let you practise noticing that difference.",
        guide:
          "Look for the early interruptions, then the longer quieter periods. A gradual change and an abrupt change after a bolus need a review of their timing and possible causes.",
        question: "What does a new discontinuous pattern justify?",
        options: [
          {
            id: "a",
            label: "Conclude that the clinical assessment is useless.",
            feedback:
              "The assessment describes the clinical response; EEG adds complementary information between assessments.",
          },
          {
            id: "b",
            label:
              "Check signal quality, the treatment timeline and other causes, then reassess the agreed sedation goal.",
            correct: true,
          },
          {
            id: "c",
            label: "Conclude that a specific propofol bolus must be the cause.",
            feedback:
              "Timing can suggest an association, but the pattern alone does not establish a drug or dose as its cause.",
          },
        ],
        takeaway:
          "Describe what changed before explaining why. EEG and DSA make changes in continuity visible; the patient and treatment history determine their meaning.",
        reference:
          "ICU pEEG consensus · Continuous observation and signal context.",
        url: "https://link.springer.com/article/10.1007/s12028-022-01565-5",
      },
      {
        id: "challenge-reason",
        title: "Make a useful handover",
        intro: "Explain the goal, the evidence and the next check.",
        scenarioId: "target-a",
        kind: "scan",
        evidence: ["sqi", "eeg"],
        prompt:
          "Beyond the indices, choose the pair that adds signal quality and the underlying EEG pattern.",
        scene:
          "A colleague reports stable blood pressure, heart rate and SpO₂. The team also needs to know the sedation goal, clinical response and what the brain monitoring has shown.",
        guide:
          "Haemodynamics reflect illness and drugs as well as other influences. They do not replace assessment of sedation or the EEG.",
        question: "Which handover gives the team a useful shared picture?",
        options: [
          {
            id: "a",
            label: "Stable blood pressure means the sedation target is met.",
            feedback:
              "Blood pressure is useful context, not a sedation-depth measurement.",
          },
          {
            id: "b",
            label:
              "Explain why sedation is needed, the clinical target and response, signal quality, EEG/index trends and the reassessment plan.",
            correct: true,
          },
          {
            id: "c",
            label:
              "The qCON advisory has not activated, so there is nothing to reassess.",
            feedback:
              "A configured reminder complements active observation; it cannot confirm a complete clinical assessment.",
          },
        ],
        takeaway:
          "Monitor the function you want to understand. Brain monitoring complements clinical assessment; a frontal EEG display is not a complete neurological diagnosis. Keep the clinical goal explicit.",
        reference: "ICU pEEG consensus · Multimodal assessment.",
        url: "https://link.springer.com/article/10.1007/s12028-022-01565-5",
      },
    ],
  },
];
export var STORAGE_KEY = "conox.challenge.pathways.v3";
export var ALL_MISSIONS = PATHS.flatMap((p) => p.missions);
export function parseProgress(raw) {
  try {
    const d = JSON.parse(raw);
    if (d?.version !== 3 || !d.results || typeof d.results !== "object")
      return {};
    const out = {};
    for (const m of ALL_MISSIONS) {
      const r = d.results[m.id];
      if (r && Number.isInteger(r.score) && r.score >= 0 && r.score <= 100)
        out[m.id] = {
          score: r.score,
        };
    }
    return out;
  } catch {
    return {};
  }
}
export function scoreFor(observationErrors, answerErrors) {
  return Math.max(0, 100 - 10 * observationErrors - 15 * answerErrors);
}
export function mergeResult(results, id, score) {
  return {
    ...results,
    [id]: {
      score: Math.max(results[id]?.score ?? 0, score),
    },
  };
}
export function isUnlocked(path, index, results) {
  return path.missions.slice(0, index).every((m) => results[m.id]);
}
