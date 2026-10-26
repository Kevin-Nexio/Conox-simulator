# CONOX 2D EEG Simulator – React/Vite-Quellprojekt

Rekonstruierter Entwicklungsstand des browserbasierten CONOX-2D-Schulungs- und Demonstrationssimulators. Die Anwendung erzeugt synthetische RAW-EEG-, DSA-, qCON-, qNOX-, SQI-, EMG- und BSR-Verläufe. Ein getrennter, experimenteller Modus erlaubt die lokale Wiedergabe unterstützter CONOX-CXBIN-Aufzeichnungen.

## Aufgezeichneten Fall öffnen

Im Header `Fall öffnen` wählen und eine `.cxbin`-Datei laden. Der Fall bleibt im Arbeitsspeicher dieses Browsers und wird weder hochgeladen noch an eine Demo-Sitzung übertragen. Die Simulation und ihre Geräteverbindung werden beim Öffnen des Fallmodus beendet. Beim Zurückkehren startet die Simulation neu.

Der Fallmodus bietet Wiedergabe/Pause, Geschwindigkeit, eine Passage mit Beginn und Ende in `Minuten:Sekunden`, Positionierung, EEG-Zeit-/Amplitudenskalen, DSA-Zeitraum und Farbskala sowie zuschaltbare Hilfslinien und SEF-Kurven. Die Wiedergabe stoppt am Ende der gewählten Passage. Auf kleinen Bildschirmen lassen sich die Diagramme horizontal verschieben.

Beginn und Ende werden mit verschiebbaren Markern auf der gesamten Zeitleiste gewählt. Der weisse Abspielcursor ist unabhängig davon positionierbar. Die Zeitfelder bleiben für genaue Eingaben verfügbar. Passage und Export stehen in einer gemeinsamen kompakten Werkzeugleiste; Anzeigeeinstellungen, Dateidetails und Hilfe lassen sich aufklappen. Auf Desktop-Bildschirmen passen Zeitleiste und Vorschau zusammen in die Fensterhöhe.

Zusätzlich zu vier Bereichen und den bisherigen CONOX-Ansichten mit und ohne Rahmen stehen die originalen Simulatoransichten mit und ohne Rahmen zur Auswahl. Sie verwenden dieselben Monitor-Komponenten wie die Simulation, zeigen jedoch ausschliesslich aufgezeichnete Daten. Die Monitor-Tasten schalten die Diagramme um; SEF und Farbskala bleiben bedienbar. Jede Ansicht lässt sich als Vollbild anzeigen.

PNG und PDF speichern die aktuelle Position mit den gewählten Skalen und der gewählten Ansicht. Der Videoexport enthält die markierte Passage mit der gewählten Geschwindigkeit. Je nach Browser stehen MP4 und/oder WebM zur Auswahl. Der Videoexport erfolgt in Echtzeit, mit Fortschritt und Abbruchmöglichkeit; der Tab muss sichtbar bleiben. Es wird kein Ton aufgezeichnet. Alle Exporte werden lokal erzeugt und heruntergeladen. Auch die Dateien enthalten den Hinweis auf die vorläufige Darstellung.

Die Vier-Bereiche-Ansicht zeichnet Beschriftungen und Kurven als SVG-Vektoren, damit sie beim Vergrössern scharf bleiben. Ihr PDF enthält auswählbaren Text und Vektorlinien; nur die DSA-Farbkarte ist ein eingebettetes Bild. PNG und Video sind formatbedingt Rasterdateien. Die originalen Simulatoransichten werden für Exporte aus ihren tatsächlich gerenderten Komponenten übernommen; dies benötigt SVG-HTML-Unterstützung im Browser. Diese Exporte wurden in Chrome geprüft. Unterstützt ein Browser die Aufnahme nicht, bleibt eine Fehlermeldung sichtbar.

Der DSA wird aus dem aufgezeichneten EEG neu berechnet. **Indexzuordnung, µV-Skalierung und Übereinstimmung mit ConoxView sind noch nicht validiert.** Ungeklärte Indexwerte erscheinen als Lücken. Der Import unterstützt zunächst nur das untersuchte 1024-Byte-Format und Dateien bis 64 MiB. Andere Formatversionen und unvollständige Dateien werden abgewiesen.

Die technischen Annahmen und offenen Prüfungen stehen in [docs/RECORDINGS.md](docs/RECORDINGS.md).

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

Es gibt zehn feste Demo-Sitzungen, `Demo 1` bis `Demo 10`. Für eine Demo mit mehreren Geräten:

1. Auf dem iPad die Online-Version öffnen und im Header eine freie Demo wählen, zum Beispiel `Demo 3`.
2. `CONOX View` antippen, damit das iPad nur den Monitor zeigt.
3. `Link` antippen und den QR-Code mit dem iPhone scannen.
4. Das iPhone öffnet automatisch dieselbe Demo als Controller.

Der QR-Code enthält die URL mit der gewählten Demo (`?role=controller&demo=3`). Weitere Geräte können dieselbe Demo auch direkt im Header wählen. Die zuletzt gewählte Demo wird im Browser gespeichert (`localStorage`). Es braucht kein Login und kein Benutzerkonto. Die Live-Verbindung läuft peer-to-peer im Browser.

Alle Geräte in derselben Demo teilen denselben Zustand, auch mit drei oder mehr Geräten. Die Modi `Normal`, `iPad Display` und `iPhone Control` ändern nur die Ansicht, nicht die Synchronisationsrechte.

Synchronisation:

- Jede Änderung erhält eine Revision. Bei gleichzeitigen Änderungen gewinnt überall dieselbe Version (höhere Revision, danach das Gerät, das der Demo zuerst beigetreten ist), deshalb laufen die Geräte nicht auseinander.
- Ein neu verbundenes Gerät übernimmt den laufenden Zustand der Demo, statt ihn zu überschreiben.
- Ein Heartbeat alle vier Sekunden und ein Abgleich beim Zurückkehren in den Browser (z. B. nach Standby) holen verpasste Änderungen nach.

DSA-Farbskalierung: Die Tasten `+` und `−` neben der dB-Farbskala verschieben die Farbzuordnung des Spektrogramms (gemäss Conox 2D IFU, Kap. 5.2.7). `+` erhöht die Farbsättigung Richtung Rot, `−` Richtung Blau. Es gibt je vier Stufen à 4 dB; eine weisse Markierung zeigt die aktuelle Stufe. Die Einstellung wird mit den anderen Geräten derselben Demo synchronisiert.

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

Der Simulationsmodus erzeugt synthetische Lernsignale. Der getrennte Fallmodus stellt importierte Aufzeichnungen experimentell dar. Die Anwendung ist kein Medizinprodukt, keine validierte Gerätesoftware und kein Ersatz für klinische Beurteilung oder das originale CONOX-2D-System.

Vor einer öffentlichen Veröffentlichung sollten interne Freigaben für Produktname, nachgebildete Bedienoberfläche, Produktunterlagen und Kundennutzung geklärt werden. Siehe [NOTICE.md](NOTICE.md).
