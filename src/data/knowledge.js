const wa = {
  awake: {
    title: "Wach · schnelle Mischaktivität",
    frequency: 20,
    morph:
      "Unregelmässige, eher niedrigamplitudige Aktivität mit schnellen Beta-Anteilen; frontales EMG kann sich überlagern.",
    when: "Vor Einleitung, bei leichter Sedierung oder während der Aufhellung.",
    meaning:
      "Wachaktivität ist variabel und wird nicht durch einen einzelnen Frequenzpeak definiert.",
    influence: "Augenstatus, Aufmerksamkeit, Alter, EMG und Elektrodenkontakt.",
    drugNote:
      "Die Wachreferenz dient dem Vergleich. Ein ähnlich schneller Verlauf unter Ketamin, Midazolam oder bei EMG beweist keine Wachheit.",
  },
  alpha: {
    title: "Alpha · 8–13 Hz",
    frequency: 10,
    morph: "Rhythmische Aktivität mit etwa 8–13 Schwingungen pro Sekunde.",
    when: "Unter Propofol häufig frontal und zusammen mit Slow/Delta.",
    meaning: "Typischer Teil des Propofol-Alpha/Delta-Komplexes.",
    influence: "Propofolwirkung, Alter, Grund-EEG und Ableitung.",
    drugNote:
      "Propofol kann frontale Alpha-Aktivität zusammen mit Slow/Delta deutlich verstärken. Bei sehr tiefer Wirkung nimmt die kontinuierliche Alpha-Struktur wieder ab.",
  },
  delta: {
    title: "Delta · 0,5–4 Hz",
    frequency: 1.5,
    morph: "Sehr langsame, meist amplitudenstarke Wellen.",
    when: "Bei Schlaf, Sedierung und tiefer hypnotischer Wirkung.",
    meaning: "Slow/Delta ist Aktivität – keine Suppression.",
    influence: "Sedierung, zerebrale Funktion, Alter und Stoffwechsel.",
    drugNote:
      "Propofol, Sevofluran und Dexmedetomidin können Slow/Delta verstärken. Auch stärkere Opioidwirkung kann das EEG verlangsamen, ersetzt aber keine Hypnosebeurteilung.",
  },
  theta: {
    title: "Theta · 4–8 Hz",
    frequency: 6,
    morph: "Mittellangsame Aktivität mit etwa 4–8 Schwingungen pro Sekunde.",
    when: "Bei Übergängen, Schlafnähe und verschiedenen Sedativa.",
    meaning: "Weniger spezifisch als ein klarer Alpha/Delta-Komplex.",
    influence: "Sedativum, Schlaf-Wach-Zustand und Grundaktivität.",
    drugNote:
      "Theta kann unter Sevofluran, Midazolam und Dexmedetomidin zunehmen. Das Band ist unspezifisch und muss mit den übrigen Frequenzen beurteilt werden.",
  },
  beta: {
    title: "Beta · 13–30 Hz",
    frequency: 20,
    morph: "Schnelle Aktivität mit meist niedrigerer Amplitude.",
    when: "Wach, bei Arousal, unter Benzodiazepinen oder Ketamin.",
    meaning: "Schnelle Aktivität ist nicht automatisch Wachheit.",
    influence: "EMG, Midazolam, Ketamin, Arousal und Elektrodenkontakt.",
    drugNote:
      "Midazolam kann Beta betonen. Niedrig dosiertes Ketamin erzeugt häufig schnelle Aktivität bis in den Bereich von etwa 25–32 Hz.",
  },
  gamma: {
    title: "Gamma · 30–45 Hz",
    frequency: 36,
    morph: "Sehr schnelle, niedrigamplitudige Aktivität.",
    when: "Bei Aktivierung, EMG-Einfluss und typischen Ketaminmustern.",
    meaning: "Gamma im frontalen Signal ist besonders artefaktanfällig.",
    influence: "Ketamin, Muskelaktivität, Bewegung und Elektrodenkontakt.",
    drugNote:
      "Ketamin kann High-Beta-/Low-Gamma-Aktivität erzeugen. Vor einer Interpretation müssen EMG und Artefakte ausgeschlossen werden.",
  },
  spindle: {
    title: "Spindles · 12–16 Hz",
    frequency: 13.2,
    morph:
      "Etwa 1–2 Sekunden lange, an- und abschwellende Pakete rhythmischer Sigma-Aktivität.",
    when: "Typisch bei schlafähnlicher Sedierung unter Dexmedetomidin.",
    meaning: "Im DSA als intermittierende, schmale Leistungsinseln sichtbar.",
    influence: "Dexmedetomidin-Dosis, Vigilanz, Grund-EEG und Ableitung.",
    drugNote:
      "Dexmedetomidin kann spindelartige 12–16-Hz-Episoden mit Slow/Delta erzeugen; bei tieferer Wirkung wird die langsame Aktivität meist stärker.",
  },
  arousal: {
    title: "Arousal · Beta-Aktivierung",
    frequency: 22,
    morph:
      "Kurze Abschwächung stabiler Slow-/Alpha-Aktivität mit Zunahme schneller 12–25-Hz-Aktivität.",
    when: "Bei Aktivierung, Aufhellung oder als Reaktion auf einen inneren oder äusseren Reiz.",
    meaning:
      "Ein Arousal ist eine Veränderung im Verlauf, aber kein sicherer Wachheitsnachweis.",
    influence:
      "Sedierungstiefe, Reize, Analgesie, EMG, Bewegung und Grund-EEG.",
    drugNote:
      "Unter Propofol kann ein Arousal als Alpha-Dropout, schnelle Beta-Aktivierung oder auch andersartig erscheinen. Immer Klinik und Artefakte einbeziehen.",
  },
  alphaDropout: {
    title: "Alpha-Dropout · transiente Reizantwort",
    frequency: 10,
    morph:
      "Vorübergehende Abschwächung oder Unterbrechung der frontalen 8–13-Hz-Alpha-Aktivität bei fortbestehender Grundaktivität.",
    when: "Kann zeitlich nach einem nozizeptiven oder anderen aktivierenden Reiz auftreten.",
    meaning:
      "Der Verlust eines Alpha-Peaks ist eine Verlaufsänderung, aber kein direkter Schmerz- oder Wachheitsnachweis.",
    influence: "Reiz, Analgesie, Hypnosetiefe, Alter, Ableitung und Artefakte.",
    drugNote:
      "Unter GABAergen Anästhetika kann ein stabiler frontaler Alpha-Peak bei einer Reizantwort vorübergehend abnehmen. Reizzeitpunkt und Gesamtkontext sind entscheidend.",
  },
  deltaArousal: {
    title: "Paradoxes Delta-Arousal",
    frequency: 1.6,
    morph:
      "Transiente Zunahme langsamer Delta-Aktivität, häufig zusammen mit einer Abnahme von Alpha- oder Spindelaktivität.",
    when: "Vor allem als mögliche Reizantwort bei tieferer Allgemeinanästhesie beschrieben.",
    meaning:
      "Mehr langsame Aktivität kann in diesem Kontext eine Reaktion und nicht einfach eine Vertiefung anzeigen.",
    influence: "Reizstärke, Hypnosetiefe, Analgesie, Wirkstoff und Grund-EEG.",
    drugNote:
      "Ein Delta-Arousal kann verarbeitete Hypnoseindizes paradox unverändert lassen oder senken. Deshalb RAW EEG, DSA und klinischen Verlauf gemeinsam betrachten.",
  },
  emg: {
    title: "EMG-/Muskelartefakt",
    frequency: 35,
    morph:
      "Unregelmässige, breitbandige schnelle Aktivität, oft rauer und weniger rhythmisch als kortikale Beta-Aktivität.",
    when: "Bei Stirnspannung, Bewegung, Schütteln, Kieferaktivität oder unzureichender Elektrodenruhe.",
    meaning:
      "Kann DSA-Leistung im hohen Frequenzbereich und verarbeitete Indizes künstlich anheben.",
    influence: "Muskelaktivität, Bewegung, Elektrodenposition und Filterung.",
    drugNote:
      "Vor einer Dosisanpassung bei plötzlichem Indexanstieg EMG, Signalqualität, RAW EEG und klinische Zeichen prüfen.",
  },
  mixed: {
    title: "Alpha/Delta-Komplex",
    frequency: 0,
    morph:
      "Langsame Delta-Welle mit überlagerter rhythmischer Alpha-Aktivität.",
    when: "Typisches frontales Propofolmuster bei kontinuierlicher Hypnose.",
    meaning: "Zwei getrennte Leistungsmaxima: Slow/Delta und Alpha.",
    influence: "Propofolwirkung, Alter, Dosisverlauf und Ableitung.",
    drugNote:
      "Der Alpha/Delta-Komplex ist eine typische Propofol-Signatur. Kombinationen mit Opioiden können die erforderliche hypnotische Wirkung und den Verlauf verändern.",
  },
  suppression: {
    title: "Suppression",
    frequency: 0,
    morph: "Sehr niedrige Aktivität, teils im Wechsel mit Bursts.",
    when: "Bei sehr tiefer Hirndämpfung oder gezielter Therapie.",
    meaning: "Warnmuster, sofern nicht therapeutisch beabsichtigt.",
    influence: "Sedativa, zerebraler Zustand, Temperatur und Stoffwechsel.",
    drugNote:
      "Hohe hypnotische Wirkung, beispielsweise durch Propofol oder volatile Anästhetika, kann Diskontinuität bis Burst Suppression auslösen.",
  },
};

export { wa };
export { wa as EEG_KNOWLEDGE };
