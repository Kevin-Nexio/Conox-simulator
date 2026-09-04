import {
  DRUG_PROFILES as BASE_DRUG_PROFILES,
  EEG_KNOWLEDGE as BASE_EEG_KNOWLEDGE,
  NARKOSE_REISE as BASE_NARKOSE_REISE,
  SCENARIOS as BASE_SCENARIOS,
} from "../data/index.js";
import { DISPLAY_VIEWS as BASE_DISPLAY_VIEWS } from "../components/DisplayViewIcon.jsx";

export const LOCALES = [
  { code: "de", label: "DE", name: "Deutsch" },
  { code: "fr", label: "FR", name: "Français" },
  { code: "en", label: "EN", name: "English" },
];

const DEFAULT_LOCALE = "de";

const ui = {
  de: {
    "app.subtitle": "RAW EEG · DSA · qCON / qNOX · synthetische Lernsignale",
    "brand.open": "Fresenius Kabi Schweiz öffnen",
    "live.on": "LIVE an: RAW EEG, DSA und Indexwerte synchron",
    "live.off": "LIVE aus: Original-Latenzen aktiv",
    "live.status.on": "AN · SYNCHRON",
    "live.status.off": "AUS · ORIGINAL",
    "alarm.disable": "qCON-Hinweissignal deaktivieren",
    "alarm.enable": "qCON-Hinweissignal aktivieren",
    "alarm.activeTitle": "qCON-Alarm aktiv · {{min}}–{{max}}",
    "alarm.below": "qCON-Alarm · unter {{min}}",
    "alarm.above": "qCON-Alarm · über {{max}}",
    "alarm.active": "Alarm {{min}}–{{max}} aktiv",
    "alarm.sync": "Synchron · ohne Latenz",
    "alarm.delayed": "Anzeige verzögert ≈20 s",
    "alarm.heading": "qCON-Hinweissignal",
    "alarm.label": "Alarm qCON",
    "alarm.limitExceeded": "Grenzwert überschritten",
    "alarm.disabled": "Deaktiviert",
    "alarm.on": "AN",
    "alarm.off": "AUS",
    "alarm.minDown": "Unteren qCON-Grenzwert verringern",
    "alarm.minRange": "Unterer qCON-Grenzwert 0 bis 100",
    "alarm.minUp": "Unteren qCON-Grenzwert erhöhen",
    "alarm.maxDown": "Oberen qCON-Grenzwert verringern",
    "alarm.maxRange": "Oberer qCON-Grenzwert 0 bis 100",
    "alarm.maxUp": "Oberen qCON-Grenzwert erhöhen",
    "alarm.note":
      "Bei Grenzwertverletzung wechselt der qCON-Wert im Sekundentakt zwischen Weiss und Orange. Synthetische Hinweisfunktion, nicht zur unbeaufsichtigten Überwachung.",
    "eeg.status.active": "EEG · AKTIV",
    "eeg.status.suppression": "EEG · SUPPRESSION",
    "eeg.frontal": "Frontal · 0,5–45 Hz",
    "eeg.rawLabel": "Synthetisches frontales Raw EEG",
    "dsa.transition": "Übergang 2,8 s",
    "dsa.scale": "dB Farbskala",
    "dsa.label": "Synthetisches DSA von 0 bis 45 Hertz",
    "dsa.sefLabel": "SEF50- und SEF95-Trend im Spektrogramm",
    "dsa.sef50Title": "SEF50-Trend im Spektrogramm ein- oder ausblenden",
    "dsa.sef95Title": "SEF95-Trend im Spektrogramm ein- oder ausblenden",
    "dsa.showEeg": "EEG-Wellenform wieder anzeigen",
    "dsa.only": "Nur DSA",
    "dsa.onlyTitle": "Nur das Spektrogramm anzeigen",
    "timeline.now": "jetzt",
    "cases.title": "Fallbeispiele",
    "cases.select": "Situation auswählen",
    "cases.aria": "Fallbeispiel auswählen",
    "cases.journey": "Narkose-Reise · {{name}}",
    "cases.free": "Freie Simulation aktiv",
    "cases.random": "Zufällige Auswahl",
    "control.pause": "Pause",
    "control.resume": "Fortsetzen",
    "analysis.aria": "Mustererkennung",
    "analysis.pattern": "EEG-Muster",
    "analysis.dominant": "Dominant",
    "analysis.assessment": "Beurteilung",
    "docs.aria": "CONOX Dokumente und Kontakt",
    "docs.brochure": "Broschüre",
    "docs.datasheet": "Datenblatt",
    "docs.contact": "Kontakt",
    "docs.contactTitle": "Outlook-Template mit Broschüre und Datenblatt öffnen",
    "docs.toast":
      "Outlook-Template mit Broschüre und Datenblatt bereitgestellt. Bitte die heruntergeladene OFT-Datei öffnen und Empfänger sowie Anrede ergänzen.",
    "journey.title": "Narkose-Reise",
    "journey.default":
      "Wach → Einleitung → Spindles → Arousal → Suppression → Ausleitung",
    "journey.active": "Aktiv · {{phase}}",
    "journey.start": "Narkose-Reise starten",
    "journey.stop": "Reise beenden",
    "journey.ready": "Bereit",
    "journey.stopped": "Beendet",
    "journey.done": "Abgeschlossen · wach",
    "sim.title": "Medikamentensimulator",
    "sim.freeShown": "Freie Wirkstoffsimulation eingeblendet",
    "sim.hidden": "Ausgeblendet · Fallbeispiele steuern den Monitor",
    "sim.aria": "Simulatorsteuerung",
    "sim.toggleAria": "Simulator aktivieren oder deaktivieren",
    "sim.inactive": "Inaktiv",
    "sim.active": "Aktiv",
    "sim.heading": "Freie Simulation",
    "sim.copy": "Wirkstoffe und Wirkstufen frei verändern.",
    "sim.primary": "Hauptwirkstoff",
    "sim.level": "Wirkstufe",
    "sim.awakeNote": "Wachreferenz · keine Wirkstufe",
    "sim.adjunct": "Sedierendes Adjuvans",
    "sim.noAdjunct": "Kein Adjuvans",
    "sim.opioid": "Opioid",
    "sim.noOpioid": "Kein Opioid",
    "sim.adjunctLevel": "Adjuvans-Stufe",
    "sim.opioidLevel": "Opioid-Stufe",
    "sim.sufentanilNote":
      "Sufentanil: mit zunehmender Wirkung mehr Delta-/Theta-Leistung und weniger schnelle Aktivität. Analgesie und Bewusstsein bleiben getrennt zu beurteilen.",
    "sim.bolusAwakeAria": "Propofol-Bolus aus Wachzustand",
    "sim.bolus": "Bolus",
    "sim.bolusAwake": "Propofol-Bolus",
    "sim.bolusActive": "Bolus wirkt...",
    "sim.bolusAwakeHint": "Wach → Sedierung · weiche 2,8-s-Rampe",
    "sim.bolusHint": "kurzer Wirkungsanstieg · sanftes Abklingen",
    "sim.pause": "Simulation pausieren",
    "sim.resume": "Simulation fortsetzen",
    "panel.badge": "CONOX EEG & DSA",
    "panel.title": "CONOX Steuerung",
    "panel.copy": "Anzeige konfigurieren und EEG-Wissen gezielt einblenden.",
    "panel.aria": "CONOX Bereiche",
    "tab.monitor": "Anzeige",
    "tab.learn": "RAW EEG Knowledge",
    "display.heading": "Anzeige",
    "display.window": "RAW-Zeitfenster",
    "display.seconds": "{{count}} Sekunden",
    "display.amplitude": "Amplitude",
    "display.period": "DSA/Index Zeitraum",
    "display.live60": "Live · 60 Sekunden",
    "display.minutesDemo": "{{count}} Minuten · Demonstration",
    "display.minutesConox": "{{count}} Minuten · CONOX",
    "display.hoursConox": "{{count}} Stunden · CONOX",
    "display.dsaScale": "DSA-Skala",
    "display.viewAria": "Displayansicht · aktiv: {{label}}",
    "display.trendAria": "Indexverlauf",
    "detection.heading": "Mustererkennung",
    "detection.title": "EEG-Hinweise",
    "detection.copy":
      "Frequenzband und Muster im RAW EEG sowie im grauen Statusbalken anzeigen.",
    "detection.callout":
      "Die Anzeige benennt nur synthetisch erkannte Muster. Mit RAW EEG, DSA, Indizes, Medikamenten und klinischem Verlauf abgleichen.",
    "learn.heading": "RAW EEG Knowledge",
    "learn.frequency": "Frequenztyp",
    "learn.character": "Charakter",
    "learn.when": "Wann sichtbar",
    "learn.meaning": "Vereinfachte Aussage",
    "learn.influence": "Beeinflusst durch",
    "learn.drugNote": "Medikamentenhinweis",
    "learn.callout":
      "Einzelne Wellen nie isoliert bewerten. Entscheidend sind Muster, Kontinuität, Verlauf und Medikament.",
    "learn.canvasWindow": "2 Sekunden",
    "note.medical":
      "Synthetische Signale. Keine Dosierungsempfehlung, kein Ersatz für klinische Untersuchung, RASS/SAS, Analgesiebeurteilung, Hämodynamik, Beatmung oder ärztliche Entscheidung.",
    "popup.blocked":
      "Das CONOX Window wurde vom Browser blockiert. Bitte Pop-ups für diese Datei erlauben.",
    "popup.aria": "Gespiegelter CONOX Monitor",
  },
  fr: {
    "app.subtitle":
      "EEG brut · DSA · qCON / qNOX · signaux pédagogiques synthétiques",
    "brand.open": "Ouvrir Fresenius Kabi Suisse",
    "live.on": "LIVE actif: EEG brut, DSA et indices synchronisés",
    "live.off": "LIVE inactif: latences originales actives",
    "live.status.on": "ON · SYNCHRONE",
    "live.status.off": "OFF · ORIGINAL",
    "alarm.disable": "Désactiver le signal qCON",
    "alarm.enable": "Activer le signal qCON",
    "alarm.activeTitle": "Alarme qCON active · {{min}}–{{max}}",
    "alarm.below": "Alarme qCON · sous {{min}}",
    "alarm.above": "Alarme qCON · au-dessus de {{max}}",
    "alarm.active": "Alarme {{min}}–{{max}} active",
    "alarm.sync": "Synchrone · sans latence",
    "alarm.delayed": "Affichage retardé ≈20 s",
    "alarm.heading": "Signal qCON",
    "alarm.label": "Alarme qCON",
    "alarm.limitExceeded": "Seuil dépassé",
    "alarm.disabled": "Désactivé",
    "alarm.on": "ON",
    "alarm.off": "OFF",
    "alarm.minDown": "Diminuer le seuil qCON bas",
    "alarm.minRange": "Seuil qCON bas de 0 à 100",
    "alarm.minUp": "Augmenter le seuil qCON bas",
    "alarm.maxDown": "Diminuer le seuil qCON haut",
    "alarm.maxRange": "Seuil qCON haut de 0 à 100",
    "alarm.maxUp": "Augmenter le seuil qCON haut",
    "alarm.note":
      "En cas de dépassement, la valeur qCON alterne chaque seconde entre blanc et orange. Signal synthétique d'aide, pas destiné à une surveillance sans supervision.",
    "eeg.status.active": "EEG · ACTIF",
    "eeg.status.suppression": "EEG · SUPPRESSION",
    "eeg.frontal": "Frontal · 0,5–45 Hz",
    "eeg.rawLabel": "EEG frontal brut synthétique",
    "dsa.transition": "Transition 2,8 s",
    "dsa.scale": "Échelle couleur dB",
    "dsa.label": "DSA synthétique de 0 à 45 hertz",
    "dsa.sefLabel": "Tendance SEF50 et SEF95 dans le spectrogramme",
    "dsa.sef50Title":
      "Afficher ou masquer la tendance SEF50 dans le spectrogramme",
    "dsa.sef95Title":
      "Afficher ou masquer la tendance SEF95 dans le spectrogramme",
    "dsa.showEeg": "Réafficher la courbe EEG",
    "dsa.only": "DSA seul",
    "dsa.onlyTitle": "Afficher uniquement le spectrogramme",
    "timeline.now": "maintenant",
    "cases.title": "Cas pratiques",
    "cases.select": "Choisir une situation",
    "cases.aria": "Choisir un cas pratique",
    "cases.journey": "Parcours anesthésie · {{name}}",
    "cases.free": "Simulation libre active",
    "cases.random": "Sélection aléatoire",
    "control.pause": "Pause",
    "control.resume": "Reprendre",
    "analysis.aria": "Reconnaissance des motifs",
    "analysis.pattern": "Motif EEG",
    "analysis.dominant": "Dominant",
    "analysis.assessment": "Évaluation",
    "docs.aria": "Documents CONOX et contact",
    "docs.brochure": "Brochure",
    "docs.datasheet": "Fiche technique",
    "docs.contact": "Contact",
    "docs.contactTitle":
      "Ouvrir le modèle Outlook avec brochure et fiche technique",
    "docs.toast":
      "Modèle Outlook avec brochure et fiche technique prêt. Ouvre le fichier OFT téléchargé, puis complète le destinataire et la formule d'appel.",
    "journey.title": "Parcours anesthésie",
    "journey.default":
      "Éveil → induction → spindles → arousal → suppression → réveil",
    "journey.active": "Actif · {{phase}}",
    "journey.start": "Démarrer le parcours",
    "journey.stop": "Arrêter le parcours",
    "journey.ready": "Prêt",
    "journey.stopped": "Arrêté",
    "journey.done": "Terminé · éveil",
    "sim.title": "Simulateur de médicaments",
    "sim.freeShown": "Simulation libre des agents affichée",
    "sim.hidden": "Masqué · les cas pratiques pilotent le moniteur",
    "sim.aria": "Contrôle du simulateur",
    "sim.toggleAria": "Activer ou désactiver le simulateur",
    "sim.inactive": "Inactif",
    "sim.active": "Actif",
    "sim.heading": "Simulation libre",
    "sim.copy": "Modifier librement les agents et les niveaux d'effet.",
    "sim.primary": "Agent principal",
    "sim.level": "Niveau d'effet",
    "sim.awakeNote": "Référence éveil · aucun niveau d'effet",
    "sim.adjunct": "Adjuvant sédatif",
    "sim.noAdjunct": "Aucun adjuvant",
    "sim.opioid": "Opioïde",
    "sim.noOpioid": "Aucun opioïde",
    "sim.adjunctLevel": "Niveau adjuvant",
    "sim.opioidLevel": "Niveau opioïde",
    "sim.sufentanilNote":
      "Sufentanil: avec l'augmentation de l'effet, plus de puissance delta/thêta et moins d'activité rapide. Analgésie et conscience restent à évaluer séparément.",
    "sim.bolusAwakeAria": "Bolus de propofol depuis l'état éveillé",
    "sim.bolus": "Bolus",
    "sim.bolusAwake": "Bolus propofol",
    "sim.bolusActive": "Bolus actif...",
    "sim.bolusAwakeHint": "Éveil → sédation · rampe douce de 2,8 s",
    "sim.bolusHint": "hausse brève de l'effet · décroissance douce",
    "sim.pause": "Mettre la simulation en pause",
    "sim.resume": "Reprendre la simulation",
    "panel.badge": "CONOX EEG & DSA",
    "panel.title": "Contrôle CONOX",
    "panel.copy": "Configurer l'affichage et afficher les repères EEG.",
    "panel.aria": "Zones CONOX",
    "tab.monitor": "Affichage",
    "tab.learn": "RAW EEG Knowledge",
    "display.heading": "Affichage",
    "display.window": "Fenêtre EEG brut",
    "display.seconds": "{{count}} secondes",
    "display.amplitude": "Amplitude",
    "display.period": "Période DSA/indices",
    "display.live60": "Live · 60 secondes",
    "display.minutesDemo": "{{count}} minutes · démonstration",
    "display.minutesConox": "{{count}} minutes · CONOX",
    "display.hoursConox": "{{count}} heures · CONOX",
    "display.dsaScale": "Échelle DSA",
    "display.viewAria": "Vue d'affichage · active: {{label}}",
    "display.trendAria": "Courbe des indices",
    "detection.heading": "Reconnaissance des motifs",
    "detection.title": "Repères EEG",
    "detection.copy":
      "Afficher la bande de fréquence et le motif dans l'EEG brut ainsi que dans la barre d'état grise.",
    "detection.callout":
      "L'affichage ne nomme que des motifs synthétiquement reconnus. À confronter à l'EEG brut, au DSA, aux indices, aux médicaments et à l'évolution clinique.",
    "learn.heading": "RAW EEG Knowledge",
    "learn.frequency": "Type de fréquence",
    "learn.character": "Caractère",
    "learn.when": "Quand visible",
    "learn.meaning": "Lecture simplifiée",
    "learn.influence": "Influencé par",
    "learn.drugNote": "Note médicament",
    "learn.callout":
      "Ne jamais interpréter une onde isolément. Le motif, la continuité, l'évolution et le médicament sont déterminants.",
    "learn.canvasWindow": "2 secondes",
    "note.medical":
      "Signaux synthétiques. Pas de recommandation posologique, pas de substitut à l'examen clinique, RASS/SAS, évaluation de l'analgésie, hémodynamique, ventilation ou décision médicale.",
    "popup.blocked":
      "La fenêtre CONOX a été bloquée par le navigateur. Autorise les pop-ups pour ce fichier.",
    "popup.aria": "Moniteur CONOX dupliqué",
  },
  en: {
    "app.subtitle": "RAW EEG · DSA · qCON / qNOX · synthetic training signals",
    "brand.open": "Open Fresenius Kabi Switzerland",
    "live.on": "LIVE on: RAW EEG, DSA and index values synchronized",
    "live.off": "LIVE off: original latencies active",
    "live.status.on": "ON · SYNC",
    "live.status.off": "OFF · ORIGINAL",
    "alarm.disable": "Disable qCON signal",
    "alarm.enable": "Enable qCON signal",
    "alarm.activeTitle": "qCON alarm active · {{min}}–{{max}}",
    "alarm.below": "qCON alarm · below {{min}}",
    "alarm.above": "qCON alarm · above {{max}}",
    "alarm.active": "Alarm {{min}}–{{max}} active",
    "alarm.sync": "Synchronized · no latency",
    "alarm.delayed": "Display delayed ≈20 s",
    "alarm.heading": "qCON Signal",
    "alarm.label": "qCON Alarm",
    "alarm.limitExceeded": "Limit exceeded",
    "alarm.disabled": "Disabled",
    "alarm.on": "ON",
    "alarm.off": "OFF",
    "alarm.minDown": "Decrease lower qCON limit",
    "alarm.minRange": "Lower qCON limit 0 to 100",
    "alarm.minUp": "Increase lower qCON limit",
    "alarm.maxDown": "Decrease upper qCON limit",
    "alarm.maxRange": "Upper qCON limit 0 to 100",
    "alarm.maxUp": "Increase upper qCON limit",
    "alarm.note":
      "When a limit is exceeded, the qCON value alternates every second between white and orange. Synthetic advisory function, not for unattended monitoring.",
    "eeg.status.active": "EEG · ACTIVE",
    "eeg.status.suppression": "EEG · SUPPRESSION",
    "eeg.frontal": "Frontal · 0.5–45 Hz",
    "eeg.rawLabel": "Synthetic frontal raw EEG",
    "dsa.transition": "Transition 2.8 s",
    "dsa.scale": "dB color scale",
    "dsa.label": "Synthetic DSA from 0 to 45 hertz",
    "dsa.sefLabel": "SEF50 and SEF95 trend in the spectrogram",
    "dsa.sef50Title": "Show or hide the SEF50 trend in the spectrogram",
    "dsa.sef95Title": "Show or hide the SEF95 trend in the spectrogram",
    "dsa.showEeg": "Show EEG waveform again",
    "dsa.only": "DSA only",
    "dsa.onlyTitle": "Show only the spectrogram",
    "timeline.now": "now",
    "cases.title": "Case Examples",
    "cases.select": "Select situation",
    "cases.aria": "Select case example",
    "cases.journey": "Anesthesia journey · {{name}}",
    "cases.free": "Free simulation active",
    "cases.random": "Random selection",
    "control.pause": "Pause",
    "control.resume": "Resume",
    "analysis.aria": "Pattern detection",
    "analysis.pattern": "EEG Pattern",
    "analysis.dominant": "Dominant",
    "analysis.assessment": "Assessment",
    "docs.aria": "CONOX documents and contact",
    "docs.brochure": "Brochure",
    "docs.datasheet": "Data sheet",
    "docs.contact": "Contact",
    "docs.contactTitle": "Open Outlook template with brochure and data sheet",
    "docs.toast":
      "Outlook template with brochure and data sheet ready. Open the downloaded OFT file, then add the recipient and greeting.",
    "journey.title": "Anesthesia Journey",
    "journey.default":
      "Awake → induction → spindles → arousal → suppression → emergence",
    "journey.active": "Active · {{phase}}",
    "journey.start": "Start journey",
    "journey.stop": "Stop journey",
    "journey.ready": "Ready",
    "journey.stopped": "Stopped",
    "journey.done": "Finished · awake",
    "sim.title": "Drug Simulator",
    "sim.freeShown": "Free drug simulation visible",
    "sim.hidden": "Hidden · case examples control the monitor",
    "sim.aria": "Simulator control",
    "sim.toggleAria": "Enable or disable simulator",
    "sim.inactive": "Inactive",
    "sim.active": "Active",
    "sim.heading": "Free Simulation",
    "sim.copy": "Change drugs and effect levels freely.",
    "sim.primary": "Primary drug",
    "sim.level": "Effect level",
    "sim.awakeNote": "Awake reference · no effect level",
    "sim.adjunct": "Sedative adjunct",
    "sim.noAdjunct": "No adjunct",
    "sim.opioid": "Opioid",
    "sim.noOpioid": "No opioid",
    "sim.adjunctLevel": "Adjunct level",
    "sim.opioidLevel": "Opioid level",
    "sim.sufentanilNote":
      "Sufentanil: with increasing effect, more delta/theta power and less fast activity. Analgesia and consciousness still need separate assessment.",
    "sim.bolusAwakeAria": "Propofol bolus from awake state",
    "sim.bolus": "Bolus",
    "sim.bolusAwake": "Propofol bolus",
    "sim.bolusActive": "Bolus active...",
    "sim.bolusAwakeHint": "Awake → sedation · soft 2.8 s ramp",
    "sim.bolusHint": "brief effect increase · smooth decay",
    "sim.pause": "Pause simulation",
    "sim.resume": "Resume simulation",
    "panel.badge": "CONOX EEG & DSA",
    "panel.title": "CONOX Control",
    "panel.copy": "Configure the display and show targeted EEG knowledge.",
    "panel.aria": "CONOX sections",
    "tab.monitor": "Display",
    "tab.learn": "RAW EEG Knowledge",
    "display.heading": "Display",
    "display.window": "RAW time window",
    "display.seconds": "{{count}} seconds",
    "display.amplitude": "Amplitude",
    "display.period": "DSA/index period",
    "display.live60": "Live · 60 seconds",
    "display.minutesDemo": "{{count}} minutes · demonstration",
    "display.minutesConox": "{{count}} minutes · CONOX",
    "display.hoursConox": "{{count}} hours · CONOX",
    "display.dsaScale": "DSA scale",
    "display.viewAria": "Display view · active: {{label}}",
    "display.trendAria": "Index trend",
    "detection.heading": "Pattern Detection",
    "detection.title": "EEG hints",
    "detection.copy":
      "Show frequency band and pattern in the raw EEG and in the grey status bar.",
    "detection.callout":
      "The display only names synthetically detected patterns. Compare with raw EEG, DSA, indices, drugs and clinical course.",
    "learn.heading": "RAW EEG Knowledge",
    "learn.frequency": "Frequency type",
    "learn.character": "Character",
    "learn.when": "When visible",
    "learn.meaning": "Simplified reading",
    "learn.influence": "Influenced by",
    "learn.drugNote": "Drug note",
    "learn.callout":
      "Never assess individual waves in isolation. Pattern, continuity, trend and medication are decisive.",
    "learn.canvasWindow": "2 seconds",
    "note.medical":
      "Synthetic signals. No dosing recommendation, no replacement for clinical examination, RASS/SAS, analgesia assessment, hemodynamics, ventilation or medical decision-making.",
    "popup.blocked":
      "The CONOX window was blocked by the browser. Please allow pop-ups for this file.",
    "popup.aria": "Mirrored CONOX monitor",
  },
};

const displayViews = {
  fr: {
    "eeg-index": ["EEG + indices", "Courbe EEG avec évolution des indices"],
    "dsa-index": ["DSA + indices", "L'EEG est remplacé par le spectrogramme"],
    "eeg-dsa": [
      "EEG + DSA",
      "L'évolution des indices est remplacée par le spectrogramme",
    ],
    all: ["Tous les graphiques", "EEG, spectrogramme et évolution des indices"],
    "dsa-only": ["DSA seul", "Afficher uniquement le spectrogramme"],
    "eeg-only": ["EEG seul", "Afficher uniquement la courbe EEG"],
  },
  en: {
    "eeg-index": ["EEG + indices", "EEG waveform with index trend"],
    "dsa-index": ["DSA + indices", "EEG is replaced by the spectrogram"],
    "eeg-dsa": ["EEG + DSA", "Index trend is replaced by the spectrogram"],
    all: ["All charts", "EEG, spectrogram and index trend"],
    "dsa-only": ["DSA only", "Show only the spectrogram"],
    "eeg-only": ["EEG only", "Show only the EEG waveform"],
  },
};

const drugText = {
  fr: {
    awake: { label: "Aucun hypnotique / éveil", short: "Éveil" },
    propofol: { label: "Propofol", short: "Propofol" },
    midazolam: { label: "Midazolam", short: "Midazolam" },
    dexmedetomidine: { label: "Dexmédétomidine", short: "Dex" },
    ketamine: { label: "Kétamine", short: "Kétamine" },
    sevoflurane: { label: "Sévoflurane", short: "Sévo" },
  },
  en: {
    awake: { label: "No hypnotic / awake", short: "Awake" },
    propofol: { label: "Propofol", short: "Propofol" },
    midazolam: { label: "Midazolam", short: "Midazolam" },
    dexmedetomidine: { label: "Dexmedetomidine", short: "Dex" },
    ketamine: { label: "Ketamine", short: "Ketamine" },
    sevoflurane: { label: "Sevoflurane", short: "Sevo" },
  },
};

const scenarioNames = {
  fr: {
    "awake-reference": "Éveil · signal de référence",
    "alpha-dropout": "Réponse au stimulus · alpha-dropout",
    "arousal-beta": "Arousal · activation bêta",
    "arousal-nociceptive": "Arousal · stimulus fort / nociceptif",
    "arousal-delta": "Arousal · delta-arousal paradoxal",
    "artifact-emg": "Artéfact · EMG / activité musculaire",
    "target-a": "Cible A · alpha/delta continu",
    "target-b": "Cible B · composante alpha marquée",
    "target-c": "Cible C · alpha faible, plus de delta",
    "target-d": "Cible D · morphologie alpha large",
    "target-e": "Cible E · alpha visible par intermittence",
    "alpha-loss": "Transition · diminution de l'alpha",
    "arousal-activation": "Arousal · réaction d'activation transitoire",
    "theta-transition": "Transition · thêta dominant",
    "delta-deep": "Plus profond · delta dominant, encore continu",
    "delta-no-alpha": "Delta dominant · alpha non reconnaissable",
    discontinuous: "Signal d'alerte · discontinuité",
    "pre-suppression": "Signal d'alerte · début de burst suppression",
    "strong-suppression": "Signal d'alerte · burst suppression marquée",
    "suppression-recovery": "Récupération après suppression",
    "midazolam-fast": "Midazolam · activité rapide/variable",
    "midazolam-deep": "Midazolam · approfondissement cumulatif",
    "dex-spindle": "Spindles · 12–16 Hz",
    "dex-deep": "Dexmédétomidine · activité lente plus profonde",
    "ketamine-fast": "Kétamine faible · high-bêta/low-gamma",
    "ketamine-theta": "Kétamine · delta/hautes fréquences mixtes",
    "sufentanil-low": "Sufentanil · faible modification EEG",
    "sufentanil-high": "Sufentanil élevé · ralentissement delta/thêta",
    "prop-sufentanil-target": "Propofol + sufentanil · cible stable",
    "prop-sufentanil-deep": "Propofol + sufentanil · hypnose trop profonde",
    "prop-ketamine": "Propofol + kétamine · signature mixte",
    "prop-dex": "Propofol + dexmédétomidine",
    "mid-sufentanil": "Midazolam + sufentanil · sédation mixte profonde",
    "journey-awake-start": "Éveil",
    "journey-induction": "Induction",
    "journey-stable": "Anesthésie alpha/delta stable",
    "journey-spindle": "Épisode de spindles",
    "journey-after-spindle": "Anesthésie à nouveau stable",
    "journey-arousal": "Arousal transitoire",
    "journey-restabilized": "Anesthésie à nouveau stable",
    "journey-deepening": "Profondeur anesthésique croissante",
    "journey-burst-suppression": "Burst suppression marquée",
    "journey-recovery": "Récupération après suppression",
    "journey-emergence": "Réveil",
    "journey-awake-end": "Éveil après réveil",
  },
  en: {
    "awake-reference": "Awake · reference signal",
    "alpha-dropout": "Stimulus response · alpha dropout",
    "arousal-beta": "Arousal · beta activation",
    "arousal-nociceptive": "Arousal · strong / nociceptive stimulus",
    "arousal-delta": "Arousal · paradoxical delta arousal",
    "artifact-emg": "Artifact · EMG / muscle activity",
    "target-a": "Target A · continuous alpha/delta",
    "target-b": "Target B · strong alpha component",
    "target-c": "Target C · weak alpha, more delta",
    "target-d": "Target D · broad alpha morphology",
    "target-e": "Target E · intermittently visible alpha",
    "alpha-loss": "Transition · alpha decreases",
    "arousal-activation": "Arousal · transient activation response",
    "theta-transition": "Transition · theta dominant",
    "delta-deep": "Deeper · delta dominant, still continuous",
    "delta-no-alpha": "Delta dominant · alpha not recognizable",
    discontinuous: "Warning pattern · discontinuity",
    "pre-suppression": "Warning pattern · early burst suppression",
    "strong-suppression": "Warning pattern · marked burst suppression",
    "suppression-recovery": "Recovery from suppression",
    "midazolam-fast": "Midazolam · fast/variable activity",
    "midazolam-deep": "Midazolam · cumulative deepening",
    "dex-spindle": "Spindles · 12–16 Hz",
    "dex-deep": "Dexmedetomidine · deeper slow activity",
    "ketamine-fast": "Low ketamine · high-beta/low-gamma",
    "ketamine-theta": "Ketamine · mixed delta/high-frequency",
    "sufentanil-low": "Sufentanil · mild EEG change",
    "sufentanil-high": "High sufentanil · delta/theta slowing",
    "prop-sufentanil-target": "Propofol + sufentanil · stable target",
    "prop-sufentanil-deep": "Propofol + sufentanil · too deep hypnosis",
    "prop-ketamine": "Propofol + ketamine · mixed signature",
    "prop-dex": "Propofol + dexmedetomidine",
    "mid-sufentanil": "Midazolam + sufentanil · deep mixed sedation",
    "journey-awake-start": "Awake",
    "journey-induction": "Induction",
    "journey-stable": "Stable alpha/delta anesthesia",
    "journey-spindle": "Spindle episode",
    "journey-after-spindle": "Stable anesthesia again",
    "journey-arousal": "Transient arousal",
    "journey-restabilized": "Stable anesthesia again",
    "journey-deepening": "Increasing anesthetic depth",
    "journey-burst-suppression": "Marked burst suppression",
    "journey-recovery": "Recovery from suppression",
    "journey-emergence": "Emergence",
    "journey-awake-end": "Awake after emergence",
  },
};

const journeyPhases = {
  fr: {
    Wach: "Éveil",
    Einleitung: "Induction",
    "Stabile Narkose": "Anesthésie stable",
    Spindles: "Spindles",
    "Stabilisierung nach Spindles": "Stabilisation après spindles",
    Arousal: "Arousal",
    "Stabilisierung nach Arousal": "Stabilisation après arousal",
    "Zunehmende Tiefe": "Profondeur croissante",
    "Burst Suppression": "Burst suppression",
    "Erholung aus Suppression": "Récupération après suppression",
    Ausleitung: "Réveil",
  },
  en: {
    Wach: "Awake",
    Einleitung: "Induction",
    "Stabile Narkose": "Stable anesthesia",
    Spindles: "Spindles",
    "Stabilisierung nach Spindles": "Stabilization after spindles",
    Arousal: "Arousal",
    "Stabilisierung nach Arousal": "Stabilization after arousal",
    "Zunehmende Tiefe": "Increasing depth",
    "Burst Suppression": "Burst suppression",
    "Erholung aus Suppression": "Recovery from suppression",
    Ausleitung: "Emergence",
  },
};

const knowledgeText = {
  fr: {
    awake: {
      title: "Éveil · activité mixte rapide",
      morph:
        "Activité irrégulière, plutôt de faible amplitude, avec composantes bêta rapides; l'EMG frontal peut se superposer.",
      when: "Avant l'induction, lors d'une sédation légère ou pendant le réveil.",
      meaning:
        "L'activité d'éveil est variable et ne se définit pas par un seul pic de fréquence.",
      influence:
        "Ouverture des yeux, attention, âge, EMG et contact des électrodes.",
      drugNote:
        "La référence d'éveil sert de comparaison. Un tracé rapide sous kétamine, midazolam ou EMG ne prouve pas l'éveil.",
    },
    alpha: {
      title: "Alpha · 8–13 Hz",
      morph: "Activité rythmique d'environ 8 à 13 oscillations par seconde.",
      when: "Souvent frontale sous propofol, associée au slow/delta.",
      meaning: "Partie typique du complexe alpha/delta sous propofol.",
      influence: "Effet du propofol, âge, EEG de base et dérivation.",
      drugNote:
        "Le propofol peut renforcer nettement l'alpha frontal avec le slow/delta. À effet très profond, la structure alpha continue diminue à nouveau.",
    },
    delta: {
      title: "Delta · 0,5–4 Hz",
      morph: "Ondes très lentes, souvent de forte amplitude.",
      when: "Sommeil, sédation et effet hypnotique profond.",
      meaning: "Slow/delta est une activité, pas une suppression.",
      influence: "Sédation, fonction cérébrale, âge et métabolisme.",
      drugNote:
        "Propofol, sévoflurane et dexmédétomidine peuvent renforcer le slow/delta. Un opioïde plus fort peut aussi ralentir l'EEG, sans remplacer l'évaluation hypnotique.",
    },
    theta: {
      title: "Thêta · 4–8 Hz",
      morph:
        "Activité moyennement lente d'environ 4 à 8 oscillations par seconde.",
      when: "Transitions, proximité du sommeil et différents sédatifs.",
      meaning: "Moins spécifique qu'un complexe alpha/delta net.",
      influence: "Sédatif, état veille-sommeil et activité de base.",
      drugNote:
        "Le thêta peut augmenter sous sévoflurane, midazolam et dexmédétomidine. Cette bande reste peu spécifique.",
    },
    beta: {
      title: "Bêta · 13–30 Hz",
      morph: "Activité rapide, le plus souvent de plus faible amplitude.",
      when: "Éveil, arousal, benzodiazépines ou kétamine.",
      meaning: "Une activité rapide ne signifie pas automatiquement éveil.",
      influence: "EMG, midazolam, kétamine, arousal et contact des électrodes.",
      drugNote:
        "Le midazolam peut accentuer le bêta. La kétamine à faible dose produit souvent une activité rapide vers 25–32 Hz.",
    },
    gamma: {
      title: "Gamma · 30–45 Hz",
      morph: "Activité très rapide, de faible amplitude.",
      when: "Activation, influence EMG et profils typiques de kétamine.",
      meaning: "Le gamma frontal est particulièrement sensible aux artéfacts.",
      influence:
        "Kétamine, activité musculaire, mouvement et contact des électrodes.",
      drugNote:
        "La kétamine peut produire du high-bêta/low-gamma. Avant interprétation, EMG et artéfacts doivent être exclus.",
    },
    spindle: {
      title: "Spindles · 12–16 Hz",
      morph:
        "Paquets rythmiques sigma de 1 à 2 secondes, avec montée et décroissance.",
      when: "Typique d'une sédation proche du sommeil sous dexmédétomidine.",
      meaning:
        "Visible dans le DSA comme îlots de puissance étroits et intermittents.",
      influence:
        "Dose de dexmédétomidine, vigilance, EEG de base et dérivation.",
      drugNote:
        "La dexmédétomidine peut créer des épisodes de 12–16 Hz avec slow/delta; à effet plus profond, l'activité lente augmente souvent.",
    },
    arousal: {
      title: "Arousal · activation bêta",
      morph:
        "Brève atténuation du slow/alpha stable avec augmentation de l'activité rapide 12–25 Hz.",
      when: "Activation, réveil ou réaction à un stimulus interne ou externe.",
      meaning:
        "Un arousal est une modification de trajectoire, pas une preuve certaine d'éveil.",
      influence:
        "Profondeur de sédation, stimuli, analgésie, EMG, mouvement et EEG de base.",
      drugNote:
        "Sous propofol, un arousal peut apparaître comme alpha-dropout, activation bêta rapide ou autre forme. Toujours intégrer clinique et artéfacts.",
    },
    alphaDropout: {
      title: "Alpha-dropout · réponse transitoire",
      morph:
        "Atténuation ou interruption transitoire de l'alpha frontal 8–13 Hz avec activité de base persistante.",
      when: "Peut suivre un stimulus nociceptif ou autre stimulus activateur.",
      meaning:
        "La perte d'un pic alpha est un changement de trajectoire, pas une preuve directe de douleur ou d'éveil.",
      influence:
        "Stimulus, analgésie, profondeur hypnotique, âge, dérivation et artéfacts.",
      drugNote:
        "Sous anesthésiques GABAergiques, un pic alpha frontal stable peut diminuer temporairement lors d'une réponse au stimulus.",
    },
    deltaArousal: {
      title: "Delta-arousal paradoxal",
      morph:
        "Augmentation transitoire de l'activité delta lente, souvent avec baisse de l'alpha ou des spindles.",
      when: "Décrit surtout comme réponse possible au stimulus en anesthésie générale profonde.",
      meaning:
        "Dans ce contexte, plus d'activité lente peut signaler une réaction et pas seulement un approfondissement.",
      influence:
        "Intensité du stimulus, profondeur hypnotique, analgésie, agent et EEG de base.",
      drugNote:
        "Un delta-arousal peut laisser les indices d'hypnose inchangés ou les abaisser. Il faut donc lire EEG brut, DSA et évolution clinique ensemble.",
    },
    emg: {
      title: "EMG / artéfact musculaire",
      morph:
        "Activité rapide, irrégulière et large bande, souvent plus rugueuse et moins rythmique que le bêta cortical.",
      when: "Tension du front, mouvement, tremblement, mâchoire ou électrodes instables.",
      meaning:
        "Peut augmenter artificiellement la puissance haute fréquence dans le DSA et les indices traités.",
      influence:
        "Activité musculaire, mouvement, position des électrodes et filtrage.",
      drugNote:
        "Avant d'ajuster une dose sur hausse brutale d'indice, vérifier EMG, qualité du signal, EEG brut et signes cliniques.",
    },
    mixed: {
      title: "Complexe alpha/delta",
      morph: "Onde delta lente avec activité alpha rythmique superposée.",
      when: "Profil frontal typique du propofol pendant une hypnose continue.",
      meaning: "Deux maxima de puissance distincts: slow/delta et alpha.",
      influence: "Effet du propofol, âge, évolution de dose et dérivation.",
      drugNote:
        "Le complexe alpha/delta est une signature typique du propofol. Les associations avec opioïdes peuvent modifier l'effet hypnotique nécessaire et l'évolution.",
    },
    suppression: {
      title: "Suppression",
      morph: "Activité très basse, parfois alternant avec des bursts.",
      when: "Damping cérébral très profond ou traitement ciblé.",
      meaning: "Motif d'alerte, sauf intention thérapeutique.",
      influence: "Sédatifs, état cérébral, température et métabolisme.",
      drugNote:
        "Un effet hypnotique élevé, par exemple par propofol ou anesthésiques volatils, peut provoquer une discontinuité jusqu'à burst suppression.",
    },
  },
  en: {
    awake: {
      title: "Awake · fast mixed activity",
      morph:
        "Irregular, rather low-amplitude activity with fast beta components; frontal EMG can overlap.",
      when: "Before induction, during light sedation or during emergence.",
      meaning:
        "Awake activity is variable and is not defined by a single frequency peak.",
      influence: "Eye state, attention, age, EMG and electrode contact.",
      drugNote:
        "The awake reference is used for comparison. A similarly fast pattern under ketamine, midazolam or EMG does not prove wakefulness.",
    },
    alpha: {
      title: "Alpha · 8–13 Hz",
      morph: "Rhythmic activity with about 8 to 13 oscillations per second.",
      when: "Often frontal under propofol and together with slow/delta.",
      meaning: "Typical part of the propofol alpha/delta complex.",
      influence: "Propofol effect, age, baseline EEG and derivation.",
      drugNote:
        "Propofol can markedly strengthen frontal alpha together with slow/delta. At very deep effect, continuous alpha structure decreases again.",
    },
    delta: {
      title: "Delta · 0.5–4 Hz",
      morph: "Very slow waves, usually with high amplitude.",
      when: "Sleep, sedation and deep hypnotic effect.",
      meaning: "Slow/delta is activity, not suppression.",
      influence: "Sedation, cerebral function, age and metabolism.",
      drugNote:
        "Propofol, sevoflurane and dexmedetomidine can strengthen slow/delta. Stronger opioid effect can also slow the EEG, but does not replace hypnosis assessment.",
    },
    theta: {
      title: "Theta · 4–8 Hz",
      morph: "Medium-slow activity with about 4 to 8 oscillations per second.",
      when: "Transitions, sleep proximity and several sedatives.",
      meaning: "Less specific than a clear alpha/delta complex.",
      influence: "Sedative, sleep-wake state and baseline activity.",
      drugNote:
        "Theta can increase under sevoflurane, midazolam and dexmedetomidine. The band is unspecific and must be assessed with the other frequencies.",
    },
    beta: {
      title: "Beta · 13–30 Hz",
      morph: "Fast activity, usually with lower amplitude.",
      when: "Awake state, arousal, benzodiazepines or ketamine.",
      meaning: "Fast activity does not automatically mean wakefulness.",
      influence: "EMG, midazolam, ketamine, arousal and electrode contact.",
      drugNote:
        "Midazolam can emphasize beta. Low-dose ketamine often produces fast activity around 25–32 Hz.",
    },
    gamma: {
      title: "Gamma · 30–45 Hz",
      morph: "Very fast, low-amplitude activity.",
      when: "Activation, EMG influence and typical ketamine patterns.",
      meaning: "Gamma in the frontal signal is especially artifact-prone.",
      influence: "Ketamine, muscle activity, movement and electrode contact.",
      drugNote:
        "Ketamine can create high-beta/low-gamma activity. EMG and artifacts must be excluded before interpretation.",
    },
    spindle: {
      title: "Spindles · 12–16 Hz",
      morph:
        "Rhythmic sigma packets lasting about 1–2 seconds, waxing and waning.",
      when: "Typical in sleep-like sedation under dexmedetomidine.",
      meaning: "Visible in the DSA as intermittent narrow power islands.",
      influence:
        "Dexmedetomidine dose, vigilance, baseline EEG and derivation.",
      drugNote:
        "Dexmedetomidine can produce spindle-like 12–16 Hz episodes with slow/delta; at deeper effect the slow activity usually becomes stronger.",
    },
    arousal: {
      title: "Arousal · beta activation",
      morph:
        "Brief weakening of stable slow/alpha activity with an increase in fast 12–25 Hz activity.",
      when: "Activation, emergence or reaction to an internal or external stimulus.",
      meaning:
        "An arousal is a change over time, but not reliable proof of wakefulness.",
      influence:
        "Sedation depth, stimuli, analgesia, EMG, movement and baseline EEG.",
      drugNote:
        "Under propofol, arousal can appear as alpha dropout, fast beta activation or another pattern. Always include clinical context and artifacts.",
    },
    alphaDropout: {
      title: "Alpha dropout · transient stimulus response",
      morph:
        "Temporary weakening or interruption of frontal 8–13 Hz alpha activity while baseline activity persists.",
      when: "Can occur after a nociceptive or other activating stimulus.",
      meaning:
        "Loss of an alpha peak is a trend change, not direct proof of pain or wakefulness.",
      influence:
        "Stimulus, analgesia, hypnotic depth, age, derivation and artifacts.",
      drugNote:
        "Under GABAergic anesthetics, a stable frontal alpha peak can temporarily decrease during a stimulus response.",
    },
    deltaArousal: {
      title: "Paradoxical delta arousal",
      morph:
        "Transient increase in slow delta activity, often together with a decrease in alpha or spindle activity.",
      when: "Mainly described as a possible stimulus response during deeper general anesthesia.",
      meaning:
        "In this context, more slow activity can indicate a reaction and not simply deepening.",
      influence:
        "Stimulus strength, hypnotic depth, analgesia, drug and baseline EEG.",
      drugNote:
        "Delta arousal can leave processed hypnosis indices unchanged or lower them. Read raw EEG, DSA and clinical course together.",
    },
    emg: {
      title: "EMG / muscle artifact",
      morph:
        "Irregular broadband fast activity, often rougher and less rhythmic than cortical beta activity.",
      when: "Forehead tension, movement, shaking, jaw activity or insufficient electrode stability.",
      meaning:
        "Can artificially increase high-frequency DSA power and processed indices.",
      influence: "Muscle activity, movement, electrode position and filtering.",
      drugNote:
        "Before adjusting a dose after a sudden index increase, check EMG, signal quality, raw EEG and clinical signs.",
    },
    mixed: {
      title: "Alpha/delta complex",
      morph: "Slow delta wave with superimposed rhythmic alpha activity.",
      when: "Typical frontal propofol pattern during continuous hypnosis.",
      meaning: "Two separate power maxima: slow/delta and alpha.",
      influence: "Propofol effect, age, dose trend and derivation.",
      drugNote:
        "The alpha/delta complex is a typical propofol signature. Combinations with opioids can change the required hypnotic effect and the trend.",
    },
    suppression: {
      title: "Suppression",
      morph: "Very low activity, partly alternating with bursts.",
      when: "Very deep cerebral depression or targeted therapy.",
      meaning: "Warning pattern unless therapeutically intended.",
      influence: "Sedatives, cerebral condition, temperature and metabolism.",
      drugNote:
        "High hypnotic effect, for example from propofol or volatile anesthetics, can trigger discontinuity up to burst suppression.",
    },
  },
};

const detectionText = {
  de: {},
  fr: {
    "Alpha 8–13 Hz transient reduziert": "Alpha 8–13 Hz transitoirement réduit",
    "Delta 0,5–4 Hz ↑ · Alpha 8–13 Hz ↓": "Delta 0,5–4 Hz ↑ · alpha 8–13 Hz ↓",
    "Breitbandige schnelle Aktivität / EMG":
      "Activité rapide large bande / EMG",
    "Alpha/Slow ↓ · Beta 12–25 Hz ↑": "Alpha/slow ↓ · bêta 12–25 Hz ↑",
    "Slow/Delta + Spindles 12–16 Hz": "Slow/delta + spindles 12–16 Hz",
    "Alpha/Slow → Beta/Low-Gamma": "Alpha/slow → bêta/low-gamma",
    "Delta 0,5–4 Hz · Alpha 8–13 Hz nicht erkennbar":
      "Delta 0,5–4 Hz · alpha 8–13 Hz non reconnaissable",
    "Delta 0,5–4 Hz + Alpha 8–13 Hz": "Delta 0,5–4 Hz + alpha 8–13 Hz",
    "Delta · 0,5–4 Hz": "Delta · 0,5–4 Hz",
    "Theta · 4–8 Hz": "Thêta · 4–8 Hz",
    "Alpha · 8–13 Hz": "Alpha · 8–13 Hz",
    "Beta · 13–30 Hz": "Bêta · 13–30 Hz",
    "Gamma · 30–45 Hz": "Gamma · 30–45 Hz",
    "Alpha-Dropout · Reizantwort": "Alpha-dropout · réponse au stimulus",
    "Paradoxes Delta-Arousal": "Delta-arousal paradoxal",
    "EMG-/Muskelartefakt": "EMG / artéfact musculaire",
    "Ausgeprägte Aktivierungsreaktion": "Réaction d'activation marquée",
    "Beta-Arousal · Aktivierungsreaktion":
      "Arousal bêta · réaction d'activation",
    "Stabile Ausgangsaktivität · Reizantwort folgt":
      "Activité de base stable · réponse au stimulus à venir",
    "Burst Suppression / Diskontinuität": "Burst suppression / discontinuité",
    "Spindelpakete auf Slow/Delta": "Paquets de spindles sur slow/delta",
    "Transiente Aktivierungsreaktion": "Réaction d'activation transitoire",
    "Delta-dominant ohne Alpha-Peak": "Delta dominant sans pic alpha",
    "Alpha/Delta-Komplex": "Complexe alpha/delta",
    "Schnelle Mischaktivität": "Activité mixte rapide",
    "Theta-betontes Muster": "Motif à dominante thêta",
    "Delta-dominantes Muster": "Motif à dominante delta",
    Suppression: "Suppression",
    "Suppressionsmuster klinisch prüfen":
      "Vérifier cliniquement le motif de suppression",
    "Übergang mit Verlauf und Klinik abgleichen":
      "Comparer la transition avec l'évolution et la clinique",
    "Kontinuierliches Zielbild": "Profil cible continu",
  },
  en: {
    "Alpha 8–13 Hz transient reduziert": "Alpha 8–13 Hz transiently reduced",
    "Delta 0,5–4 Hz ↑ · Alpha 8–13 Hz ↓": "Delta 0.5–4 Hz ↑ · alpha 8–13 Hz ↓",
    "Breitbandige schnelle Aktivität / EMG": "Broadband fast activity / EMG",
    "Alpha/Slow ↓ · Beta 12–25 Hz ↑": "Alpha/slow ↓ · beta 12–25 Hz ↑",
    "Slow/Delta + Spindles 12–16 Hz": "Slow/delta + spindles 12–16 Hz",
    "Alpha/Slow → Beta/Low-Gamma": "Alpha/slow → beta/low-gamma",
    "Delta 0,5–4 Hz · Alpha 8–13 Hz nicht erkennbar":
      "Delta 0.5–4 Hz · alpha 8–13 Hz not recognizable",
    "Delta 0,5–4 Hz + Alpha 8–13 Hz": "Delta 0.5–4 Hz + alpha 8–13 Hz",
    "Delta · 0,5–4 Hz": "Delta · 0.5–4 Hz",
    "Theta · 4–8 Hz": "Theta · 4–8 Hz",
    "Alpha · 8–13 Hz": "Alpha · 8–13 Hz",
    "Beta · 13–30 Hz": "Beta · 13–30 Hz",
    "Gamma · 30–45 Hz": "Gamma · 30–45 Hz",
    "Alpha-Dropout · Reizantwort": "Alpha dropout · stimulus response",
    "Paradoxes Delta-Arousal": "Paradoxical delta arousal",
    "EMG-/Muskelartefakt": "EMG / muscle artifact",
    "Ausgeprägte Aktivierungsreaktion": "Marked activation response",
    "Beta-Arousal · Aktivierungsreaktion": "Beta arousal · activation response",
    "Stabile Ausgangsaktivität · Reizantwort folgt":
      "Stable baseline activity · stimulus response follows",
    "Burst Suppression / Diskontinuität": "Burst suppression / discontinuity",
    "Spindelpakete auf Slow/Delta": "Spindle packets on slow/delta",
    "Transiente Aktivierungsreaktion": "Transient activation response",
    "Delta-dominant ohne Alpha-Peak": "Delta dominant without alpha peak",
    "Alpha/Delta-Komplex": "Alpha/delta complex",
    "Schnelle Mischaktivität": "Fast mixed activity",
    "Theta-betontes Muster": "Theta-emphasized pattern",
    "Delta-dominantes Muster": "Delta-dominant pattern",
    Suppression: "Suppression",
    "Suppressionsmuster klinisch prüfen":
      "Check suppression pattern clinically",
    "Übergang mit Verlauf und Klinik abgleichen":
      "Compare transition with trend and clinical context",
    "Kontinuierliches Zielbild": "Continuous target pattern",
  },
};

function interpolate(template, values = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? "");
}

function localizeById(items, map, localizeItem) {
  return items.map((item) => localizeItem(item, map?.[item.id]));
}

function localizeScenario(scenario, text) {
  return text ? { ...scenario, name: text } : scenario;
}

function localizeJourneyStep(step, locale) {
  const phase = journeyPhases[locale]?.[step.phase] ?? step.phase;
  return {
    ...step,
    phase,
    scenario: localizeScenario(
      step.scenario,
      scenarioNames[locale]?.[step.scenario.id],
    ),
  };
}

function localizeRecordById(record, map = {}) {
  return Object.fromEntries(
    Object.entries(record).map(([id, value]) => [id, { ...value, ...map[id] }]),
  );
}

export function normalizeLocale(locale) {
  return LOCALES.some((item) => item.code === locale) ? locale : DEFAULT_LOCALE;
}

export function getInitialLocale() {
  const saved = window.localStorage.getItem("conox.locale");
  if (saved) return normalizeLocale(saved);

  const browserLocale = window.navigator.language?.slice(0, 2).toLowerCase();
  return normalizeLocale(browserLocale);
}

export function translateStatic(key) {
  const activeLocale = normalizeLocale(
    window.localStorage.getItem("conox.locale"),
  );
  return ui[activeLocale]?.[key] ?? ui.de[key] ?? key;
}

export function createI18n(locale) {
  const activeLocale = normalizeLocale(locale);
  const dictionary = ui[activeLocale] ?? ui.de;

  const t = (key, values) =>
    interpolate(dictionary[key] ?? ui.de[key] ?? key, values);
  const tr = (text) => detectionText[activeLocale]?.[text] ?? text;

  return {
    locale: activeLocale,
    t,
    tr,
    displayViews: Object.fromEntries(
      Object.entries(BASE_DISPLAY_VIEWS).map(([id, value]) => {
        const text = displayViews[activeLocale]?.[id];
        return [
          id,
          text ? { ...value, label: text[0], description: text[1] } : value,
        ];
      }),
    ),
    drugProfiles: localizeRecordById(
      BASE_DRUG_PROFILES,
      drugText[activeLocale],
    ),
    eegKnowledge: localizeRecordById(
      BASE_EEG_KNOWLEDGE,
      knowledgeText[activeLocale],
    ),
    scenarios: localizeById(
      BASE_SCENARIOS,
      scenarioNames[activeLocale],
      localizeScenario,
    ),
    getJourney: () =>
      BASE_NARKOSE_REISE().map((step) =>
        localizeJourneyStep(step, activeLocale),
      ),
  };
}
