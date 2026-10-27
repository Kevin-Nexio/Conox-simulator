export const RECORDING_REFERENCE = {
  fr: {
    "recording.experimental":
      "Lecture selon le profil ConoxView choisi. Référence logicielle issue de l’app ; étalonnage physique et concordance avec un appareil non validés. Usage pédagogique.",
    "recording.experimentalShort": "Référence logicielle · usage pédagogique",
    "recording.provisional": "Référence ConoxView",
    "recording.amplitude": "Échelle EEG ConoxView",
    "recording.nextAmplitude": "Changer l’échelle EEG",
    "recording.eeg": "EEG d’affichage ConoxView · 128 Hz",
    "recording.dsa": "DSA ConoxView",
    "recording.dsaMethod":
      "45 bandes reçues · colonnes terminées de 5 s · palette ConoxView · temps du fichier conservé",
    "recording.indices": "Indices enregistrés",
    "recording.referenceScale": "Échelle d’affichage ConoxView",
    "recording.referenceSource":
      "ConoxView iOS 1.1 : EEG d’affichage 16 bits à 128 Hz et 45 bandes reçues, sans filtre ni nouvelle FFT.",
    "recording.integrity": "CRC-16/ARC vérifié sur {{count}} trames.",
    "recording.impedanceHelp":
      "Électrodes +, − et REF. iOS affiche 1 à 10 kΩ ; TH = trop élevée ; -- = valeur indisponible.",
    "recording.warning.invalidIndices":
      "Des indices reçus sont hors plage. Les chiffres sont laissés vides ou indisponibles ; Android peut conserver la dernière valeur dans les tendances.",
    "recording.error.FRAME_CRC_MISMATCH":
      "Une trame ne passe pas le contrôle CRC du CONOX. Le fichier semble endommagé ; réexporter le cas.",
    "recording.state.reading": "Lecture correcte",
    "recording.state.artifact": "Artéfact",
    "recording.state.impedanceTest": "Test des impédances",
    "recording.state.leadOff": "Électrode déconnectée",
    "recording.state.sensorInvalid": "Capteur non valide",
    "recording.state.sensorEndOfUse": "Capteur en fin d’utilisation",
    "recording.state.unknown": "État inconnu ({{code}})",
    "recording.nextEegWindow": "Changer la fenêtre EEG",
    "reference.profile": "Référence ConoxView",
    "reference.eegMotion": "Tracé EEG",
    "reference.sweep": "Balayage avec remplacement",
    "reference.scroll": "Défilement",
    "reference.legacyDsa": "DSA pédagogique d’origine",
    "reference.legacyDsaHelp":
      "Le DSA conserve le modèle pédagogique historique du simulateur.",
    "reference.eegChannel": "Canal d’affichage · 128 Hz",
    "reference.synthetic":
      "Signal et indices simulés à visée pédagogique. Les algorithmes cliniques du CONOX ne sont pas reproduits.",
    "reference.syntheticDsa":
      "FFT Android sur l’EEG simulé · calibration pédagogique",
    "recording.dsa.android-2.4": "DSA calculé selon ConoxView Android 2.4",
    "recording.dsa.ios-1.1": "DSA reçu du CONOX · profil iOS",
    "recording.dsaMethod.android-2.4":
      "FFT 128 points · 44 bandes · colonnes de 1 s · lissage Android · affichage par lots de 5 s",
    "recording.dsaMethod.ios-1.1":
      "45 bandes reçues · colonnes terminées de 5 s · palette ConoxView · temps du fichier conservé",
    "recording.referenceSource.android-2.4":
      "ConoxView Android 2.4 : EEG 16 bits à 128 Hz, FFT locale, Hamming 128 points et lissage logarithmique. La phase des threads est reconstruite sans données futures. Un DSA bleu peut aussi indiquer une sortie nulle ou maintenue.",
    "recording.referenceSource.ios-1.1":
      "ConoxView iOS 1.1 : EEG d’affichage 16 bits à 128 Hz et 45 bandes reçues, sans filtre ni nouvelle FFT.",
    "recording.impedanceHelp.android-2.4":
      "Électrodes +, − et REF. Android affiche 1 à 14 kΩ ; TH = trop élevée. Les états du capteur peuvent masquer les mesures.",
    "recording.impedanceHelp.ios-1.1":
      "Électrodes +, − et REF. iOS affiche 1 à 10 kΩ ; TH = trop élevée ; -- = valeur indisponible.",
    "recording.state.sensorExpired": "Capteur expiré",
  },
  de: {
    "recording.experimental":
      "Wiedergabe mit dem gewählten ConoxView-Profil. Softwarereferenz aus der App; physikalische Kalibrierung und Gerätevergleich nicht validiert. Für Schulungszwecke.",
    "recording.experimentalShort": "Softwarereferenz · für Schulungszwecke",
    "recording.provisional": "Referenz ConoxView",
    "recording.amplitude": "ConoxView-EEG-Skala",
    "recording.nextAmplitude": "EEG-Skala ändern",
    "recording.eeg": "ConoxView-Anzeige-EEG · 128 Hz",
    "recording.dsa": "ConoxView-DSA",
    "recording.dsaMethod":
      "45 empfangene Bänder · abgeschlossene 5-s-Spalten · ConoxView-Palette · Dateizeit bleibt erhalten",
    "recording.indices": "Aufgezeichnete Indizes",
    "recording.referenceScale": "ConoxView-Anzeigeskala",
    "recording.referenceSource":
      "ConoxView iOS 1.1: empfangenes 16-Bit-Anzeige-EEG mit 128 Hz und 45 Bänder, ohne zusätzlichen Filter oder neue FFT.",
    "recording.integrity": "CRC-16/ARC für {{count}} Datenblöcke geprüft.",
    "recording.impedanceHelp":
      "Elektroden +, − und REF. iOS zeigt 1 bis 10 kΩ; TH = zu hoch; -- = nicht verfügbar.",
    "recording.warning.invalidIndices":
      "Empfangene Indizes liegen ausserhalb des Wertebereichs. Zahlen bleiben leer oder nicht verfügbar; Android kann den letzten Wert im Trend beibehalten.",
    "recording.error.FRAME_CRC_MISMATCH":
      "Ein Datenblock besteht die CONOX-CRC-Prüfung nicht. Die Datei scheint beschädigt; den Fall erneut exportieren.",
    "recording.state.reading": "Messung korrekt",
    "recording.state.artifact": "Artefakt",
    "recording.state.impedanceTest": "Impedanztest",
    "recording.state.leadOff": "Elektrode getrennt",
    "recording.state.sensorInvalid": "Sensor ungültig",
    "recording.state.sensorEndOfUse": "Sensor-Nutzungsdauer beendet",
    "recording.state.unknown": "Unbekannter Status ({{code}})",
    "recording.nextEegWindow": "EEG-Zeitfenster ändern",
    "reference.profile": "ConoxView-Referenz",
    "reference.eegMotion": "EEG-Darstellung",
    "reference.sweep": "Überschreibender Durchlauf",
    "reference.scroll": "Laufende Kurve",
    "reference.legacyDsa": "Bisheriges pädagogisches DSA",
    "reference.legacyDsaHelp":
      "Das DSA behält das bisherige pädagogische Modell des Simulators.",
    "reference.eegChannel": "Anzeigekanal · 128 Hz",
    "reference.synthetic":
      "Simuliertes Signal und simulierte Indizes für Schulungszwecke. Die klinischen CONOX-Algorithmen werden nicht nachgebildet.",
    "reference.syntheticDsa":
      "Android-FFT des simulierten EEG · pädagogische Kalibrierung",
    "recording.dsa.android-2.4": "DSA nach ConoxView Android 2.4 berechnet",
    "recording.dsa.ios-1.1": "Vom CONOX empfangenes DSA · iOS-Profil",
    "recording.dsaMethod.android-2.4":
      "128-Punkt-FFT · 44 Bänder · 1-s-Spalten · Android-Glättung · Anzeige in 5-s-Gruppen",
    "recording.dsaMethod.ios-1.1":
      "45 empfangene Bänder · abgeschlossene 5-s-Spalten · ConoxView-Palette · Dateizeit bleibt erhalten",
    "recording.referenceSource.android-2.4":
      "ConoxView Android 2.4: 16-Bit-EEG mit 128 Hz, lokale FFT, Hamming mit 128 Punkten und logarithmische Glättung. Die Thread-Phase wird ohne zukünftige Daten rekonstruiert. Blau kann auch eine Nullausgabe oder einen gehaltenen Wert bedeuten.",
    "recording.referenceSource.ios-1.1":
      "ConoxView iOS 1.1: empfangenes 16-Bit-Anzeige-EEG mit 128 Hz und 45 Bänder, ohne zusätzlichen Filter oder neue FFT.",
    "recording.impedanceHelp.android-2.4":
      "Elektroden +, − und REF. Android zeigt 1 bis 14 kΩ; TH = zu hoch. Sensorzustände können die Messwerte ausblenden.",
    "recording.impedanceHelp.ios-1.1":
      "Elektroden +, − und REF. iOS zeigt 1 bis 10 kΩ; TH = zu hoch; -- = nicht verfügbar.",
    "recording.state.sensorExpired": "Sensor abgelaufen",
  },
  en: {
    "recording.experimental":
      "Replay using the selected ConoxView profile. Software reference from the app; physical calibration and device agreement are not validated. For education.",
    "recording.experimentalShort": "Software reference · for education",
    "recording.provisional": "ConoxView reference",
    "recording.amplitude": "ConoxView EEG scale",
    "recording.nextAmplitude": "Change EEG scale",
    "recording.eeg": "ConoxView display EEG · 128 Hz",
    "recording.dsa": "ConoxView DSA",
    "recording.dsaMethod":
      "45 received bands · completed 5-s columns · ConoxView palette · file timing preserved",
    "recording.indices": "Recorded indices",
    "recording.referenceScale": "ConoxView display scale",
    "recording.referenceSource":
      "ConoxView iOS 1.1: received 16-bit display EEG at 128 Hz and 45 received bands, without further filtering or FFT.",
    "recording.integrity": "CRC-16/ARC verified for {{count}} frames.",
    "recording.impedanceHelp":
      "Electrodes +, − and REF. iOS displays 1 to 10 kΩ; TH = too high; -- = unavailable.",
    "recording.warning.invalidIndices":
      "Some received indices are outside their range. Numbers remain blank or unavailable; Android may hold the last value in trends.",
    "recording.error.FRAME_CRC_MISMATCH":
      "A frame failed the CONOX CRC check. The file appears damaged; export the case again.",
    "recording.state.reading": "Reading OK",
    "recording.state.artifact": "Artifact",
    "recording.state.impedanceTest": "Impedance test",
    "recording.state.leadOff": "Lead off",
    "recording.state.sensorInvalid": "Sensor invalid",
    "recording.state.sensorEndOfUse": "Sensor end of use",
    "recording.state.unknown": "Unknown status ({{code}})",
    "recording.nextEegWindow": "Change EEG window",
    "reference.profile": "ConoxView reference",
    "reference.eegMotion": "EEG trace",
    "reference.sweep": "Overwrite sweep",
    "reference.scroll": "Scrolling",
    "reference.legacyDsa": "Original educational DSA",
    "reference.legacyDsaHelp":
      "DSA retains the simulator’s original educational model.",
    "reference.eegChannel": "Display channel · 128 Hz",
    "reference.synthetic":
      "Simulated signal and indices for education. The clinical CONOX algorithms are not reproduced.",
    "reference.syntheticDsa":
      "Android FFT of the simulated EEG · educational calibration",
    "recording.dsa.android-2.4": "DSA calculated as in ConoxView Android 2.4",
    "recording.dsa.ios-1.1": "DSA received from CONOX · iOS profile",
    "recording.dsaMethod.android-2.4":
      "128-point FFT · 44 bands · 1-s columns · Android smoothing · display in 5-s batches",
    "recording.dsaMethod.ios-1.1":
      "45 received bands · completed 5-s columns · ConoxView palette · file timing preserved",
    "recording.referenceSource.android-2.4":
      "ConoxView Android 2.4: 16-bit EEG at 128 Hz, local FFT, 128-point Hamming and logarithmic smoothing. Thread phase is reconstructed without future data. Blue can also mean zero output or a held spectrum.",
    "recording.referenceSource.ios-1.1":
      "ConoxView iOS 1.1: received 16-bit display EEG at 128 Hz and 45 received bands, without further filtering or FFT.",
    "recording.impedanceHelp.android-2.4":
      "Electrodes +, − and REF. Android displays 1 to 14 kΩ; TH = too high. Sensor states can hide measurements.",
    "recording.impedanceHelp.ios-1.1":
      "Electrodes +, − and REF. iOS displays 1 to 10 kΩ; TH = too high; -- = unavailable.",
    "recording.state.sensorExpired": "Sensor expired",
  },
};
