# CONOX 2D EEG Simulator – React/Vite-Quellprojekt

Rekonstruierter Entwicklungsstand des browserbasierten CONOX-2D-Schulungs- und Demonstrationssimulators. Die Anwendung erzeugt synthetische RAW-EEG-, DSA-, qCON-, qNOX-, SQI-, EMG- und BSR-Verläufe inklusive klinisch fokussierter Mustererkennung und einer interaktiven Medikamentensimulation.

Dieser Ordner enthält **keinen exportierten Single-HTML-Build**. Oberfläche, Daten, Simulationslogik, Styles und Assets liegen als getrennte Quelldateien vor.

## Lokal starten

Voraussetzung: Node.js 20.19 oder neuer.

```bash
npm install
npm run dev
```

Vite zeigt danach die lokale Adresse im Terminal an.

## Produktionsbuild

```bash
npm run build
```

Der fertige Build entsteht in `dist/`.

## Online-Version

Die GitHub-Pages-Version wird über die Branch `gh-pages` veröffentlicht:

<https://kevin-nexio.github.io/Conox-simulator/>

Der Quellcode bleibt auf `main`. Die Branch `gh-pages` enthält nur den aus `dist/` erzeugten statischen Build.

## iPad/iPhone Demo

Für eine Demo mit zwei Geräten:

1. Auf dem iPad die Online-Version öffnen.
2. Auf beiden Geräten dieselbe feste Sitzung `Demo 1` bis `Demo 10` auswählen.
3. `CONOX View` antippen, damit das iPad nur den Monitor zeigt.
4. Optional `Link` antippen und den QR-Code mit einem weiteren Gerät scannen.

Die Sitzungen `Demo 1` bis `Demo 10` sind dauerhaft definiert. Es braucht keinen PIN, kein Login und kein Benutzerkonto. Die Live-Verbindung läuft peer-to-peer im Browser.
Alle Geräte in derselben Demo spiegeln denselben Zustand. Zusätzliche iPhones, iPads oder Computer können jederzeit derselben Demo beitreten. Die Modi `Normal`, `iPad Display` und `iPhone Control` ändern nur die Ansicht, nicht die Synchronisationsrechte.
In der `CONOX View` führt der Button `Normalansicht` zurück zur normalen Oberfläche.

Für echtes Vollbild auf dem iPad die Seite in Safari über `Zum Home-Bildschirm` speichern und danach über das neue CONOX-Icon starten.

Vollständige Struktur-, Formatierungs- und Build-Prüfung:

```bash
npm run check
```

Quellcode formatieren:

```bash
npm run format
```

## Projektstruktur

```text
.
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── jsconfig.json
├── public/
│   ├── documents/
│   │   ├── CONOX_2D_Datenblatt.pdf
│   │   ├── CONOX_2D_Kontaktvorlage.oft
│   │   └── CONOX_2D_Produktbroschuere.pdf
│   └── images/
│       ├── conox-icon.svg
│       ├── conox-wordmark.png
│       └── fresenius-kabi-logo.png
├── scripts/
│   └── check-project.mjs
├── legacy/
│   ├── CONOX_2D_EEG_Simulator_v42_Single.html
│   └── github-source-v42/
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── components/
    │   ├── DisplayViewIcon.jsx
    │   └── UiPrimitives.jsx
    ├── data/
    │   ├── defaults.js
    │   ├── drugProfiles.js
    │   ├── dsaPalette.js
    │   ├── eegPatterns.js
    │   ├── journey.js
    │   ├── knowledge.js
    │   ├── scenarioFactories.js
    │   ├── scenarios.js
    │   └── index.js
    ├── i18n/
    │   └── index.js
    ├── services/
    │   └── documentActions.js
    ├── simulation/
    │   └── engine.js
    └── styles/
        └── app.css
```

## Inhaltliche Aufteilung

- `src/App.jsx`: React-Oberfläche, Canvas-Lebenszyklus und Monitorsteuerung
- `src/components/`: wiederverwendbare Anzeige- und Formularbausteine
- `src/data/drugProfiles.js`: Wirkstoffprofile und spektrale Ankerpunkte
- `src/data/eegPatterns.js`: RAW-EEG-/DSA-Muster einschliesslich Arousals, Alpha-Dropout und Burst Suppression
- `src/data/scenarios.js`: auswählbare Fallbeispiele
- `src/data/journey.js`: zeitlicher Ablauf der Narkose-Reise
- `src/data/knowledge.js`: Inhalte von „RAW EEG Knowledge“
- `src/i18n/index.js`: Sprachumschaltung und Texte für Deutsch, Französisch und Englisch
- `src/simulation/engine.js`: Interpolation, Ereignishüllen, DSA-Farblogik, Spektral- und Indexberechnung
- `src/services/documentActions.js`: Broschüre, Datenblatt und Outlook-Kontaktvorlage
- `src/styles/app.css`: vollständiges Layout und Monitor-Styling
- `legacy/`: frühere Exportstände als Referenz; nicht als aktive Entwicklungsbasis verwenden

Weitere technische Hintergründe stehen in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) und [docs/RECONSTRUCTION.md](docs/RECONSTRUCTION.md).

## Hinweis zur Nutzung

Die Anwendung erzeugt ausschliesslich synthetische Lernsignale. Sie ist kein Medizinprodukt, keine validierte Gerätesoftware und kein Ersatz für klinische Beurteilung oder das originale CONOX-System.

Vor einer öffentlichen Veröffentlichung sollten interne Freigaben für Produktname, nachgebildete Bedienoberfläche, Produktunterlagen und Kundennutzung geklärt werden. Siehe [NOTICE.md](NOTICE.md).
