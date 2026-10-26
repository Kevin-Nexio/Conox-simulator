export const RECORDING_UI = {
  de: {
    "recording.open": "Fall öffnen",
    "recording.title": "Aufgezeichneter Fall",
    "recording.back": "Zur Simulation",
    "recording.backNote": "Die Simulation startet danach neu.",
    "recording.local":
      "Nur auf diesem Gerät. Keine Übertragung in Demo-Sitzungen.",
    "recording.choose": "CXBIN-Datei auswählen",
    "recording.replace": "Anderen Fall öffnen",
    "recording.empty":
      "Einen CONOX-Fall öffnen, eine Passage auswählen und mit veränderbaren Skalen abspielen.",
    "recording.experimental":
      "Experimentelle Wiedergabe. Zuordnung der Indizes und µV-Skalierung noch nicht mit ConoxView bestätigt. Nicht für klinische Entscheidungen.",
    "recording.loading": "Fall und Spektrogramm werden vorbereitet…",
    "recording.cancel": "Abbrechen",
    "recording.play": "Abspielen",
    "recording.pause": "Pause",
    "recording.restart": "Zum Anfang",
    "recording.speed": "Geschwindigkeit",
    "recording.position": "Position im Fall",
    "recording.selection": "Passage",
    "recording.start": "Beginn",
    "recording.end": "Ende",
    "recording.markStart": "Hier beginnen",
    "recording.markEnd": "Hier beenden",
    "recording.fullCase": "Ganzer Fall",
    "recording.selectionNote":
      "Format Minuten:Sekunden. Die Wiedergabe stoppt am Ende der Passage.",
    "recording.invalidSelection":
      "Beginn und Ende als Minuten:Sekunden eingeben. Das Ende muss nach dem Beginn und innerhalb des Falls liegen.",
    "recording.eegWindow": "EEG-Zeitfenster",
    "recording.amplitude": "EEG-Amplitude (vorläufig)",
    "recording.dsaWindow": "DSA-Zeitfenster",
    "recording.whole": "Gesamter Fall",
    "recording.minutes": "{{count}} Minuten",
    "recording.color": "DSA-Farbskala",
    "recording.grid": "Hilfslinien EEG / DSA",
    "recording.eeg": "EEG · 0,5 bis 45 Hz · µV vorläufig",
    "recording.dsa": "DSA aus aufgezeichnetem EEG",
    "recording.dsaMethod":
      "2-s-Fenster · 1-s-Schritte · dB bezogen auf 1 µV²/Hz · keine originalgetreue CONOX-Farbkalibrierung",
    "recording.indices": "Aufgezeichnete Indizes · Zuordnung vorläufig",
    "recording.trends": "Indexverlauf",
    "recording.unavailable": "Keine gültigen Daten",
    "recording.duration": "Dauer",
    "recording.date": "Gerätezeit (Zeitzone unbekannt)",
    "recording.warning.previousCaseFramesExcluded":
      "{{count}} Blöcke eines anderen Falls am Dateianfang wurden ausgelassen.",
    "recording.warning.clockDiscontinuity":
      "Abweichung der Gerätezeit erkannt. Die Wiedergabe folgt dem kontinuierlichen Datenzähler.",
    "recording.warning.invalidIndices":
      "Nicht verfügbare oder noch ungeklärte Indexwerte werden als Lücke angezeigt, auch qCON/qNOX ab 100.",
    "recording.error":
      "Diese Datei konnte nicht gelesen werden. Bitte eine passende CONOX-CXBIN-Datei wählen.",
    "recording.error.TRUNCATED_FILE":
      "Die Datei endet in einem unvollständigen Datenblock. Bitte den Fall erneut vollständig exportieren.",
    "recording.error.COUNTER_GAP":
      "Die Datenzähler sind unterbrochen. Dieser Fall kann noch nicht zuverlässig abgespielt werden.",
    "recording.error.MIXED_CASES":
      "Die Datei enthält mehrere vermischte Fälle. Bitte einen einzelnen Fall exportieren.",
    "recording.error.TOO_LARGE":
      "Diese Datei ist für diese erste Version zu gross. Bitte einen kürzeren Fall wählen (max. 64 MB).",
    "grid.label": "Hilfslinien EEG / DSA",
  },
  fr: {
    "recording.open": "Ouvrir un cas",
    "recording.title": "Cas enregistré",
    "recording.back": "Retour à la simulation",
    "recording.backNote": "La simulation repartira à son état initial.",
    "recording.local":
      "Sur cet appareil uniquement. Aucun transfert vers les sessions de démo.",
    "recording.choose": "Choisir un fichier CXBIN",
    "recording.replace": "Ouvrir un autre cas",
    "recording.empty":
      "Ouvrir un cas CONOX, choisir un passage et le rejouer en ajustant les échelles.",
    "recording.experimental":
      "Lecture expérimentale. Correspondance des indices et échelle en µV encore à confirmer avec ConoxView. Ne pas utiliser pour une décision clinique.",
    "recording.loading": "Préparation du cas et du spectrogramme…",
    "recording.cancel": "Annuler",
    "recording.play": "Lecture",
    "recording.pause": "Pause",
    "recording.restart": "Retour au début",
    "recording.speed": "Vitesse",
    "recording.position": "Position dans le cas",
    "recording.selection": "Passage",
    "recording.start": "Début",
    "recording.end": "Fin",
    "recording.markStart": "Commencer ici",
    "recording.markEnd": "Terminer ici",
    "recording.fullCase": "Cas entier",
    "recording.selectionNote":
      "Format minutes:secondes. La lecture s’arrête à la fin du passage.",
    "recording.invalidSelection":
      "Saisir le début et la fin en minutes:secondes. La fin doit suivre le début et rester dans la durée du cas.",
    "recording.eegWindow": "Fenêtre EEG",
    "recording.amplitude": "Amplitude EEG (provisoire)",
    "recording.dsaWindow": "Fenêtre DSA",
    "recording.whole": "Cas entier",
    "recording.minutes": "{{count}} minutes",
    "recording.color": "Échelle des couleurs DSA",
    "recording.grid": "Repères EEG / DSA",
    "recording.eeg": "EEG · 0,5 à 45 Hz · µV provisoires",
    "recording.dsa": "DSA calculé depuis l’EEG enregistré",
    "recording.dsaMethod":
      "Fenêtre de 2 s · pas de 1 s · dB par rapport à 1 µV²/Hz · couleurs non étalonnées sur le CONOX",
    "recording.indices": "Indices enregistrés · correspondance provisoire",
    "recording.trends": "Évolution des indices",
    "recording.unavailable": "Données non disponibles",
    "recording.duration": "Durée",
    "recording.date": "Heure de l’appareil (fuseau inconnu)",
    "recording.warning.previousCaseFramesExcluded":
      "{{count}} blocs d’un autre cas au début du fichier ont été exclus.",
    "recording.warning.clockDiscontinuity":
      "Écart dans l’horloge de l’appareil. La lecture suit le compteur continu des données.",
    "recording.warning.invalidIndices":
      "Les indices indisponibles ou encore incertains apparaissent comme des lacunes, y compris qCON/qNOX à partir de 100.",
    "recording.error":
      "Impossible de lire ce fichier. Choisir un fichier CXBIN CONOX compatible.",
    "recording.error.TRUNCATED_FILE":
      "Le dernier bloc du fichier est incomplet. Réexporter le cas entier.",
    "recording.error.COUNTER_GAP":
      "Les compteurs de données sont interrompus. Ce cas ne peut pas encore être rejoué de façon fiable.",
    "recording.error.MIXED_CASES":
      "Le fichier mélange plusieurs cas. Exporter un seul cas.",
    "recording.error.TOO_LARGE":
      "Ce fichier est trop grand pour cette première version. Choisir un cas plus court (64 Mo maximum).",
    "grid.label": "Repères EEG / DSA",
  },
  en: {
    "recording.open": "Open a case",
    "recording.title": "Recorded case",
    "recording.back": "Back to simulation",
    "recording.backNote": "The simulation will restart from its initial state.",
    "recording.local":
      "On this device only. No transfer to shared demo sessions.",
    "recording.choose": "Choose a CXBIN file",
    "recording.replace": "Open another case",
    "recording.empty":
      "Open a CONOX case, choose a passage and replay it with adjustable scales.",
    "recording.experimental":
      "Experimental replay. Index mapping and µV scaling have not yet been confirmed against ConoxView. Not for clinical decisions.",
    "recording.loading": "Preparing the case and spectrogram…",
    "recording.cancel": "Cancel",
    "recording.play": "Play",
    "recording.pause": "Pause",
    "recording.restart": "Back to start",
    "recording.speed": "Speed",
    "recording.position": "Case position",
    "recording.selection": "Passage",
    "recording.start": "Start",
    "recording.end": "End",
    "recording.markStart": "Start here",
    "recording.markEnd": "End here",
    "recording.fullCase": "Whole case",
    "recording.selectionNote":
      "Use minutes:seconds. Playback stops at the end of the passage.",
    "recording.invalidSelection":
      "Enter start and end as minutes:seconds. The end must follow the start and stay within the case duration.",
    "recording.eegWindow": "EEG window",
    "recording.amplitude": "EEG amplitude (provisional)",
    "recording.dsaWindow": "DSA window",
    "recording.whole": "Whole case",
    "recording.minutes": "{{count}} minutes",
    "recording.color": "DSA colour scale",
    "recording.grid": "EEG / DSA guides",
    "recording.eeg": "EEG · 0.5 to 45 Hz · provisional µV",
    "recording.dsa": "DSA from recorded EEG",
    "recording.dsaMethod":
      "2-s window · 1-s steps · dB relative to 1 µV²/Hz · not calibrated to CONOX colours",
    "recording.indices": "Recorded indices · provisional mapping",
    "recording.trends": "Index trends",
    "recording.unavailable": "No valid data",
    "recording.duration": "Duration",
    "recording.date": "Device time (unknown time zone)",
    "recording.warning.previousCaseFramesExcluded":
      "{{count}} blocks from another case at the start of the file were excluded.",
    "recording.warning.clockDiscontinuity":
      "Device clock discrepancy detected. Playback follows the continuous data counter.",
    "recording.warning.invalidIndices":
      "Unavailable or unresolved index values appear as gaps, including qCON/qNOX values of 100 or more.",
    "recording.error":
      "This file could not be read. Choose a compatible CONOX CXBIN file.",
    "recording.error.TRUNCATED_FILE":
      "The final data block is incomplete. Export the entire case again.",
    "recording.error.COUNTER_GAP":
      "Data counters are interrupted. This case cannot yet be replayed reliably.",
    "recording.error.MIXED_CASES":
      "The file mixes several cases. Export a single case.",
    "recording.error.TOO_LARGE":
      "This file is too large for this first version. Choose a shorter case (64 MB maximum).",
    "grid.label": "EEG / DSA guides",
  },
};
