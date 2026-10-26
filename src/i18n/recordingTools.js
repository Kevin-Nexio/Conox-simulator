export const RECORDING_TOOLS = {
  de: {
    "recording.caseSave": "Fall speichern (.cxbin)",
    "recording.caseSaveHelp":
      "Den ganzen Fall mit Ereignismarken, Ansicht, Skalen, Passage und Abspielposition in einer Datei speichern. Beim erneuten Öffnen werden diese Einstellungen wiederhergestellt.",
    "recording.caseCompatibility":
      "Erweiterter CXBIN für diesen Simulator. Die Kompatibilität mit ConoxView ist nicht geprüft. Die ursprünglichen CXBIN-Daten bleiben vollständig enthalten.",
    "recording.caseOriginal": "Original-CXBIN herunterladen",
    "recording.error.CASE_DATA_INVALID":
      "Die Simulator-Erweiterung ist unvollständig oder ungültig. Bitte die vollständige gespeicherte Datei verwenden.",
    "recording.error.CASE_INTEGRITY_FAILED":
      "Die gespeicherte Datei wurde verändert oder beschädigt. Daten und Einstellungen konnten nicht zusammen geprüft werden.",
    "recording.error.CASE_STATE_INVALID":
      "Die gespeicherten Marken oder Einstellungen passen nicht zu diesem Fall. Der bereits geöffnete Fall bleibt erhalten.",
    "recording.error.CASE_VERSION_UNSUPPORTED":
      "Dieser Fall wurde mit einer neueren oder nicht unterstützten Speicherversion erstellt.",
    "recording.exportError.CASE_EXPORT_FAILED":
      "Der Fall konnte nicht gespeichert werden. Bitte erneut versuchen.",
    "recording.eventAdd": "Ereignismarke an der Abspielposition hinzufügen",
    "recording.eventShort": "Marke",
    "recording.eventMarkers": "Ereignismarken",
    "recording.eventName": "Name der Marke",
    "recording.eventTime": "Position (Minuten:Sekunden)",
    "recording.eventSave": "Speichern",
    "recording.eventClose": "Schliessen",
    "recording.eventEdit": "Bearbeiten",
    "recording.eventDelete": "Löschen",
    "recording.eventGo": "Zu dieser Marke springen",
    "recording.eventInvalid":
      "Einen Namen und eine gültige Position zwischen 0:00.00 und {{duration}} eingeben.",
    "recording.eventSessionOnly":
      "Mit «Fall speichern (.cxbin)» bleiben die Marken und Einstellungen auch nach dem Schliessen erhalten. Die Originaldatei bleibt unverändert.",
    "recording.eventMarkerHelp":
      "Klicken zum Springen, ziehen zum Verschieben, doppelklicken zum Bearbeiten. Die Pfeiltasten verschieben die Marke ebenfalls.",
    "recording.timeline": "Schnitt-Zeitleiste",
    "recording.timelineIndices": "Indexkurven in der Zeitleiste",
    "recording.timelineIndicesShort": "Kurven",
    "recording.timelineIndicesHelp":
      "Indexkurven ein- oder ausblenden. Eine Kurve anklicken, um zur Stelle zu springen. Die Legende schaltet einzelne Indizes um. Skala: 0 bis 100.",
    "recording.inMarker": "Beginn der Passage",
    "recording.outMarker": "Ende der Passage",
    "recording.playhead": "Abspielposition",
    "recording.timelineHelp":
      "Beginn und Ende an den grünen Griffen ziehen. Der Abspielcursor bestimmt die Position. Auch mit den Pfeiltasten bedienbar.",
    "recording.layout": "Ansicht für Anzeige und Export",
    "recording.layout.blocks": "Vier Bereiche",
    "recording.layout.simulator-frame": "Simulator mit Rahmen",
    "recording.layout.simulator-screen": "Simulator ohne Rahmen",
    "recording.toolbar": "Passage und Export",
    "recording.provisional": "Vorläufige Daten",
    "recording.fileDetails": "Datei und Hinweise",
    "recording.viewShort": "Ansicht",
    "recording.amplitudeShort": "Amplitude",
    "recording.colorShort": "Farben",
    "recording.gridShort": "Gitternetz",
    "recording.speedShort": "Tempo",
    "recording.videoShort": "Video",
    "recording.helpShort": "Hilfe",
    "recording.fullscreen": "Vollbild",
    "recording.exitFullscreen": "Vollbild verlassen",
    "recording.experimentalShort":
      "Experimentelle Wiedergabe · Werte und µV vorläufig · nicht für klinische Entscheidungen",
    "recording.export": "Export",
    "recording.exportImage": "Bild speichern (PNG)",
    "recording.exportPdf": "PDF speichern",
    "recording.exportVideo": "Passage als Video speichern",
    "recording.videoFormat": "Videoformat",
    "recording.exportViewNote":
      "Bild und PDF zeigen die aktuelle Position. Das Video enthält die markierte Passage mit der gewählten Geschwindigkeit und Ansicht.",
    "recording.videoNote":
      "Voraussichtliche Videodauer: {{duration}}. Der Export dauert etwa so lange; diesen Tab sichtbar lassen.",
    "recording.exportUnsupported":
      "Videoexport ist in diesem Browser nicht verfügbar. Bild und PDF bleiben verfügbar.",
    "recording.exportingVideo": "Videoexport: {{count}} %",
    "recording.exportingImage": "Datei wird vorbereitet…",
    "recording.exportProgress": "Fortschritt des Videoexports",
    "recording.exportError.EXPORT_FAILED":
      "Die Datei konnte nicht erstellt werden. Bitte erneut versuchen oder eine kürzere Passage wählen.",
    "recording.exportError.EXPORT_HIDDEN":
      "Der Videoexport wurde abgebrochen, weil der Tab nicht mehr sichtbar war. Den Export neu starten und den Tab sichtbar lassen.",
    "recording.exportError.UNSUPPORTED_VIDEO":
      "Dieses Videoformat wird vom Browser nicht unterstützt. Ein anderes Format oder einen anderen Browser wählen.",
  },
  fr: {
    "recording.caseSave": "Enregistrer le cas (.cxbin)",
    "recording.caseSaveHelp":
      "Conserve le cas entier avec les repères, la vue, les échelles, le passage et la position de lecture dans un seul fichier. Ces réglages sont restaurés à la réouverture.",
    "recording.caseCompatibility":
      "CXBIN enrichi pour ce simulateur. Sa compatibilité avec ConoxView n’est pas vérifiée. Les données CXBIN d’origine sont conservées intégralement.",
    "recording.caseOriginal": "Télécharger le CXBIN original",
    "recording.error.CASE_DATA_INVALID":
      "L’annexe du simulateur est incomplète ou invalide. Utiliser le fichier enregistré complet.",
    "recording.error.CASE_INTEGRITY_FAILED":
      "Le fichier enregistré a été modifié ou endommagé. Les données et réglages n’ont pas pu être vérifiés ensemble.",
    "recording.error.CASE_STATE_INVALID":
      "Les repères ou réglages enregistrés ne correspondent pas à ce cas. Le cas déjà ouvert reste disponible.",
    "recording.error.CASE_VERSION_UNSUPPORTED":
      "Ce cas a été enregistré avec une version plus récente ou non prise en charge du format de sauvegarde.",
    "recording.exportError.CASE_EXPORT_FAILED":
      "Impossible d’enregistrer le cas. Réessayer.",
    "recording.eventAdd": "Ajouter un repère à la position de lecture",
    "recording.eventShort": "Repère",
    "recording.eventMarkers": "Repères d’événement",
    "recording.eventName": "Nom du repère",
    "recording.eventTime": "Position (minutes:secondes)",
    "recording.eventSave": "Enregistrer",
    "recording.eventClose": "Fermer",
    "recording.eventEdit": "Modifier",
    "recording.eventDelete": "Supprimer",
    "recording.eventGo": "Aller à ce repère",
    "recording.eventInvalid":
      "Indiquer un nom et une position valide entre 0:00.00 et {{duration}}.",
    "recording.eventSessionOnly":
      "Utiliser « Enregistrer le cas (.cxbin) » pour conserver les repères et réglages après fermeture. Le fichier d’origine reste inchangé.",
    "recording.eventMarkerHelp":
      "Cliquer pour rejoindre ce moment, glisser pour déplacer, double-cliquer pour modifier. Les flèches déplacent aussi le repère.",
    "recording.timeline": "Timeline de montage",
    "recording.timelineIndices": "Courbes des indices dans la timeline",
    "recording.timelineIndicesShort": "Courbes",
    "recording.timelineIndicesHelp":
      "Afficher ou masquer les indices. Cliquer sur une courbe pour rejoindre ce moment. La légende active ou masque chaque indice. Échelle : 0 à 100.",
    "recording.inMarker": "Début du passage",
    "recording.outMarker": "Fin du passage",
    "recording.playhead": "Tête de lecture",
    "recording.timelineHelp":
      "Glisser les poignées vertes pour choisir le début et la fin. Le curseur règle la position de lecture. Les flèches du clavier fonctionnent aussi.",
    "recording.layout": "Vue affichée et exportée",
    "recording.layout.blocks": "Quatre blocs",
    "recording.layout.simulator-frame": "Simulateur avec cadre",
    "recording.layout.simulator-screen": "Simulateur sans cadre",
    "recording.toolbar": "Passage et export",
    "recording.provisional": "Données provisoires",
    "recording.fileDetails": "Fichier et remarques",
    "recording.viewShort": "Vue",
    "recording.amplitudeShort": "Amplitude",
    "recording.colorShort": "Couleurs",
    "recording.gridShort": "Quadrillage",
    "recording.speedShort": "Vitesse",
    "recording.videoShort": "Vidéo",
    "recording.helpShort": "Aide",
    "recording.fullscreen": "Plein écran",
    "recording.exitFullscreen": "Quitter le plein écran",
    "recording.experimentalShort":
      "Lecture expérimentale · valeurs et µV provisoires · aucune décision clinique",
    "recording.export": "Export",
    "recording.exportImage": "Enregistrer l’image (PNG)",
    "recording.exportPdf": "Enregistrer le PDF",
    "recording.exportVideo": "Exporter le passage en vidéo",
    "recording.videoFormat": "Format vidéo",
    "recording.exportViewNote":
      "L’image et le PDF reprennent la position actuelle. La vidéo reprend le passage marqué, avec la vitesse et la vue choisies.",
    "recording.videoNote":
      "Durée prévue de la vidéo : {{duration}}. L’export prend environ ce temps ; garder cet onglet visible.",
    "recording.exportUnsupported":
      "L’export vidéo n’est pas disponible dans ce navigateur. L’image et le PDF restent disponibles.",
    "recording.exportingVideo": "Export vidéo : {{count}} %",
    "recording.exportingImage": "Préparation du fichier…",
    "recording.exportProgress": "Progression de l’export vidéo",
    "recording.exportError.EXPORT_FAILED":
      "Impossible de créer le fichier. Réessayer ou choisir un passage plus court.",
    "recording.exportError.EXPORT_HIDDEN":
      "L’export vidéo a été annulé car l’onglet n’était plus visible. Relancer l’export et garder l’onglet visible.",
    "recording.exportError.UNSUPPORTED_VIDEO":
      "Ce format vidéo n’est pas pris en charge. Choisir un autre format ou un autre navigateur.",
  },
  en: {
    "recording.caseSave": "Save case (.cxbin)",
    "recording.caseSaveHelp":
      "Keep the entire case with event markers, view, scales, passage and playhead in one file. These settings are restored when reopening it.",
    "recording.caseCompatibility":
      "Extended CXBIN for this simulator. Compatibility with ConoxView has not been verified. All original CXBIN data is preserved.",
    "recording.caseOriginal": "Download original CXBIN",
    "recording.error.CASE_DATA_INVALID":
      "The simulator extension is incomplete or invalid. Use the complete saved file.",
    "recording.error.CASE_INTEGRITY_FAILED":
      "The saved file has changed or is damaged. Data and settings could not be verified together.",
    "recording.error.CASE_STATE_INVALID":
      "The saved markers or settings do not match this case. The case already open remains available.",
    "recording.error.CASE_VERSION_UNSUPPORTED":
      "This case uses a newer or unsupported save format version.",
    "recording.exportError.CASE_EXPORT_FAILED":
      "The case could not be saved. Try again.",
    "recording.eventAdd": "Add an event marker at the playhead",
    "recording.eventShort": "Marker",
    "recording.eventMarkers": "Event markers",
    "recording.eventName": "Marker name",
    "recording.eventTime": "Position (minutes:seconds)",
    "recording.eventSave": "Save",
    "recording.eventClose": "Close",
    "recording.eventEdit": "Edit",
    "recording.eventDelete": "Delete",
    "recording.eventGo": "Go to this marker",
    "recording.eventInvalid":
      "Enter a name and a valid position between 0:00.00 and {{duration}}.",
    "recording.eventSessionOnly":
      "Use “Save case (.cxbin)” to keep markers and settings after closing. The original file stays unchanged.",
    "recording.eventMarkerHelp":
      "Click to seek, drag to move, double-click to edit. Arrow keys also move the marker.",
    "recording.timeline": "Editing timeline",
    "recording.timelineIndices": "Index curves in the timeline",
    "recording.timelineIndicesShort": "Curves",
    "recording.timelineIndicesHelp":
      "Show or hide index curves. Click a curve to seek to that moment. The legend toggles individual indices. Scale: 0 to 100.",
    "recording.inMarker": "Passage start",
    "recording.outMarker": "Passage end",
    "recording.playhead": "Playhead",
    "recording.timelineHelp":
      "Drag the green handles to set the start and end. The playhead sets the playback position. Arrow keys also work.",
    "recording.layout": "Display and export view",
    "recording.layout.blocks": "Four blocks",
    "recording.layout.simulator-frame": "Simulator with frame",
    "recording.layout.simulator-screen": "Simulator without frame",
    "recording.toolbar": "Passage and export",
    "recording.provisional": "Provisional data",
    "recording.fileDetails": "File and notes",
    "recording.viewShort": "View",
    "recording.amplitudeShort": "Amplitude",
    "recording.colorShort": "Colours",
    "recording.gridShort": "Grid",
    "recording.speedShort": "Speed",
    "recording.videoShort": "Video",
    "recording.helpShort": "Help",
    "recording.fullscreen": "Full screen",
    "recording.exitFullscreen": "Exit full screen",
    "recording.experimentalShort":
      "Experimental replay · provisional values and µV · not for clinical decisions",
    "recording.export": "Export",
    "recording.exportImage": "Save image (PNG)",
    "recording.exportPdf": "Save PDF",
    "recording.exportVideo": "Export passage as video",
    "recording.videoFormat": "Video format",
    "recording.exportViewNote":
      "Image and PDF show the current position. Video uses the marked passage with the selected speed and view.",
    "recording.videoNote":
      "Expected video duration: {{duration}}. Export takes about this long; keep this tab visible.",
    "recording.exportUnsupported":
      "Video export is unavailable in this browser. Image and PDF remain available.",
    "recording.exportingVideo": "Video export: {{count}} %",
    "recording.exportingImage": "Preparing file…",
    "recording.exportProgress": "Video export progress",
    "recording.exportError.EXPORT_FAILED":
      "The file could not be created. Try again or choose a shorter passage.",
    "recording.exportError.EXPORT_HIDDEN":
      "Video export was cancelled because the tab was no longer visible. Restart and keep this tab visible.",
    "recording.exportError.UNSUPPORTED_VIDEO":
      "This video format is unsupported. Choose another format or browser.",
  },
};
