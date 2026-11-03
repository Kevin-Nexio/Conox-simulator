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
        scenarioId: "strong-suppression",
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
        id: "explore-quality",
        title: "Get a reliable signal",
        intro: "Investigate the measurement first.",
        scenarioId: "artifact-emg",
        kind: "scan",
        evidence: ["emg", "eeg"],
        prompt:
          "Choose the two clues that help investigate muscle contamination.",
        scene:
          "An existing simulator example shows muscle-related interference. Examine the measurement before interpreting the indices.",
        guide: "Compare EMG with the raw EEG and its frequency content.",
        question: "What is the appropriate next check?",
        options: options(
          "Check movement, electrode contact, SQI and clinical context.",
          [
            "Conclude that an index rise proves wakefulness.",
            "The index alone does not establish wakefulness.",
          ],
          [
            "Hide EMG so the indices are easier to read.",
            "EMG is useful context for interpreting the signal.",
          ],
        ),
        takeaway:
          "EMG, SQI and the EEG help you investigate a change in the measurement.",
        reference: "IFU \xA73.1, \xA73.7\u20133.8 \xB7 Signal interpretation.",
      },
      {
        id: "explore-trends",
        title: "Follow the trend",
        intro: "Open the combined display.",
        scenarioId: "target-a",
        kind: "views",
        prompt:
          "Open \u201CAll signals\u201D to bring the trend panel into view.",
        scene:
          "The reference signal is stable. Use the display controls to see how the indices are presented over time.",
        guide:
          "The combined view brings the EEG, DSA and index trends onto the same screen.",
        question: "What is the purpose of a trend display?",
        options: options(
          "Review how parameters change over time alongside other information.",
          [
            "Guarantee that the next values will remain stable.",
            "A trend describes the displayed history, not a guaranteed future.",
          ],
          [
            "Replace assessment of the current signal.",
            "Past values and current signal information are complementary.",
          ],
        ),
        takeaway:
          "Trends add a time dimension to the indices. Review them together with the signal and clinical events.",
        reference: "IFU \xA73.10 \xB7 Parameter trend graphs.",
      },
      {
        id: "explore-care",
        title: "During ICU care",
        intro: "Choose what to observe around a care event.",
        scenarioId: "target-a",
        kind: "scan",
        evidence: ["qcon", "qnox"],
        prompt:
          "Select the two indices you would review around a care event, in addition to the clinical assessment.",
        scene:
          "Prepare an observation checklist for an ICU care event. The monitor remains a reference signal; no care response is being simulated.",
        guide:
          "Keep consciousness and probability of response as separate questions.",
        question: "What should be included when reviewing a care event?",
        options: options(
          "The event timing, qCON/qNOX trends, signal quality and clinical observations.",
          [
            "An automatic opioid dose calculated from qNOX alone.",
            "qNOX alone does not specify a drug dose.",
          ],
          [
            "A conclusion about pain from one qNOX value.",
            "A single value is not a direct measure of perceived pain.",
          ],
        ),
        takeaway:
          "Observe the patient, the event and the monitoring information together. A reference signal cannot predict a particular patient\u2019s response.",
        reference: "Tang et al., 2026 \xB7 Observational ICU study.",
        url: "https://pubmed.ncbi.nlm.nih.gov/41818952/",
      },
      {
        id: "explore-suppression",
        title: "Spot suppression",
        intro: "Compare two existing signal examples.",
        scenarioId: "target-a",
        kind: "compare",
        prompt: "View both reference examples. Compare the EEG and the BSR.",
        scene:
          "Two separate simulator references, not successive stages of a patient\u2019s treatment.",
        guide:
          "In the second example, compare the quiet intervals with the suppression indicator.",
        question: "Which description fits the second reference?",
        options: options(
          "Bursts alternate with suppressed intervals; interpret the finding in context.",
          [
            "BSR confirms sufficient analgesia.",
            "BSR concerns EEG suppression, not analgesia.",
          ],
          [
            "The lowest qCON is always the desired result.",
            "The clinical goal cannot be determined from a low index alone.",
          ],
        ),
        takeaway:
          "EEG, DSA and BSR provide different views of the suppression pattern.",
        reference: "IFU \xA73.6, \xA73.9 \xB7 Suppression and EEG.",
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
        title: "Signal detective",
        intro: "Separate observation from assumption.",
        scenarioId: "artifact-emg",
        kind: "scan",
        evidence: ["emg", "eeg"],
        prompt:
          "Select the most relevant pair of clues for investigating this signal.",
        scene:
          "Fast activity is visible in this simulator reference. Start with the evidence on the display.",
        guide: "Compare the muscle-activity information with the EEG pattern.",
        question: "Which conclusion is supported?",
        options: options(
          "Muscle activity may contribute; check the signal and clinical context.",
          [
            "This display proves awareness.",
            "This signal pattern alone cannot establish awareness.",
          ],
          [
            "qNOX provides a definite pain score here.",
            "qNOX is not a direct pain-intensity measure.",
          ],
        ),
        takeaway:
          "A sound interpretation distinguishes what you observe from what the display cannot establish on its own.",
        reference: "IFU \xA73.1, \xA73.7\u20133.8.",
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
        title: "Find the change",
        intro: "Describe the difference between two references.",
        scenarioId: "target-a",
        kind: "compare",
        prompt: "Inspect both examples and identify the change in continuity.",
        scene:
          "Compare two independent reference patterns. Their order does not represent a patient trajectory or a drug response.",
        guide:
          "Look at continuity first, then check BSR. Do not infer a drug dose or a clinical cause.",
        question: "What can you conclude from this comparison?",
        options: options(
          "The second reference has more suppressed intervals; the cause is not established by the comparison.",
          [
            "The comparison tells us the exact dose to change.",
            "Independent signal examples do not define a treatment response.",
          ],
          [
            "The second reference guarantees a faster ICU discharge.",
            "This exercise contains no outcome information.",
          ],
        ),
        takeaway:
          "Describe the signal change precisely, then separate that description from a clinical explanation.",
        reference: "IFU \xA73.1, \xA73.6 \xB7 Context and suppression.",
      },
      {
        id: "challenge-reason",
        title: "Explain your decision",
        intro: "Build a complete observation checklist.",
        scenarioId: "target-a",
        kind: "scan",
        evidence: ["sqi", "eeg"],
        prompt:
          "Beyond qCON and qNOX, select the pair that adds signal quality and signal patterns.",
        scene:
          "A colleague asks whether the two indices alone provide a complete assessment. Build your answer from the available information.",
        guide:
          "Combine measurement quality, the signal, indices, trends and clinical assessment.",
        question: "Which explanation is complete?",
        options: options(
          "The indices add information; combine them with SQI, EEG, trends and the clinical assessment.",
          [
            "The indices alone guarantee an ideal state.",
            "A complete assessment needs more than two numbers.",
          ],
          [
            "If clinical context is needed, monitoring adds nothing.",
            "Monitoring contributes complementary information.",
          ],
        ),
        takeaway:
          "The strength of the display is the information you can bring together. Explain your observations and what still needs checking.",
        reference: "IFU \xA73.1 \xB7 Role of the monitor.",
      },
    ],
  },
];
export var STORAGE_KEY = "conox.challenge.pathways.v2";
export var ALL_MISSIONS = PATHS.flatMap((p) => p.missions);
export function parseProgress(raw) {
  try {
    const d = JSON.parse(raw);
    if (d?.version !== 2 || !d.results || typeof d.results !== "object")
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
