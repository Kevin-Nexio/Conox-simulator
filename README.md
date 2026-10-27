# CONOX 2D EEG Simulator – React/Vite-Quellprojekt

Rekonstruierter Entwicklungsstand des browserbasierten CONOX-2D-Schulungs- und Demonstrationssimulators. Die Anwendung erzeugt synthetische RAW-EEG-, DSA-, qCON-, qNOX-, SQI-, EMG- und BSR-Verläufe. Ein getrennter, experimenteller Modus erlaubt die lokale Wiedergabe unterstützter CONOX-CXBIN-Aufzeichnungen.

## Aufgezeichneten Fall öffnen

Im Header `Fall öffnen` wählen und eine `.cxbin`-Datei laden. Der Fall bleibt im Arbeitsspeicher dieses Browsers und wird weder hochgeladen noch an eine Demo-Sitzung übertragen. Die Simulation und ihre Geräteverbindung werden beim Öffnen des Fallmodus beendet. Beim Zurückkehren startet die Simulation neu.

Der Fallmodus bietet Wiedergabe/Pause, Geschwindigkeit, eine Passage mit Beginn und Ende in `Minuten:Sekunden`, Positionierung, EEG-Zeit-/Amplitudenskalen, DSA-Zeitraum und zuschaltbare Hilfslinien. Die Wiedergabe stoppt am Ende der gewählten Passage. Auf kleinen Bildschirmen lassen sich die Diagramme horizontal verschieben.

Beginn und Ende werden mit verschiebbaren Griffen auf der gesamten Zeitleiste gewählt. Der Abspielcursor ist unabhängig davon positionierbar. Die Zeitfelder bleiben für genaue Eingaben verfügbar. Passage und Export stehen in einer gemeinsamen kompakten Werkzeugleiste; die Anzeigeeinstellungen stehen dauerhaft im Vorschaukopf links neben Vollbild; Dateidetails und Hilfe lassen sich aufklappen. Auf Desktop-Bildschirmen passen Zeitleiste und Vorschau zusammen in die Fensterhöhe.

Drei direkt sichtbare Tasten wählen zwischen vier Bereichen und den Simulatoransichten mit und ohne Rahmen. Standard ist die Simulatoransicht mit Rahmen. Alle Ansichten verwenden dieselben Monitor-Komponenten und aufgezeichneten Daten. Ein Referenzwähler trennt ConoxView Android 2.4 von iOS 1.1. Android bietet 3/6/9 Sekunden, ±25/50/120/250/475 µV und seine lineare EEG-Projektion. iOS behält seine 2/4/8 Sekunden und seine eigene Float32-Projektion. Beide verwenden den empfangenen 128-Hz-Anzeigekanal. Vorschau, Sprünge und Exporte enthalten keine zukünftigen EEG-Samples.

PNG und PDF speichern die aktuelle Position mit den gewählten Skalen und der gewählten Ansicht. Der Videoexport enthält die markierte Passage mit der gewählten Geschwindigkeit. Je nach Browser stehen MP4 und/oder WebM zur Auswahl. Der Videoexport erfolgt in Echtzeit, mit Fortschritt und Abbruchmöglichkeit; der Tab muss sichtbar bleiben. Es wird kein Ton aufgezeichnet. Alle Exporte werden lokal erzeugt und heruntergeladen. Auch die Dateien enthalten den Hinweis auf die vorläufige Darstellung.

Die Vier-Bereiche-Ansicht zeichnet Beschriftungen und Kurven als SVG-Vektoren, damit sie beim Vergrössern scharf bleiben. Ihr PDF enthält auswählbaren Text und Vektorlinien; nur die DSA-Farbkarte ist ein eingebettetes Bild. PNG und Video sind formatbedingt Rasterdateien. Die originalen Simulatoransichten werden für Exporte aus ihren tatsächlich gerenderten Komponenten übernommen; dies benötigt SVG-HTML-Unterstützung im Browser. Diese Exporte wurden in Chrome geprüft. Unterstützt ein Browser die Aufnahme nicht, bleibt eine Fehlermeldung sichtbar.

Neue Originaldateien öffnen im Profil Android 2.4; ältere gespeicherte Fälle ohne Profil behalten iOS. Die Referenz kann gewechselt werden, ohne Quelle, Marken, Passage, Position oder Geschwindigkeit zu verlieren. Inkompatible Skalen wechseln auf den Standard des Zielprofils. Die Referenz wird mitgespeichert. Zusätzlich steht 3× zur Verfügung, passend zu den beschleunigten Vergleichsvideos; die Zeit des Originalfalls wird dabei nicht verändert.

Der Android-DSA wird aus dem Anzeige-EEG berechnet: Hamming-FFT mit 128 Punkten, 44 Bänder, logarithmische Glättung, native Kompression und Jet-Palette. Zustands- und Artefaktfelder steuern die Datenerfassung; alte FFT-Ausgaben können gehalten werden. Eine Spalte entspricht nominal einer Sekunde, die Anzeige wird in Fünfsekundengruppen veröffentlicht. 5/30/60 Minuten entsprechen echten Zeitfenstern, die zuerst von links gefüllt werden und danach gleiten; die Stundenansicht übernimmt jede zweite native Spalte. «Gesamter Fall» bleibt als zusätzliche Simulatoransicht verfügbar. iOS verwendet dagegen 45 empfangene Spektralbänder und abgeschlossene Fünfsekundenspalten. Beide Profile verwenden ihre originale Skalenressource. SEF und Farbversatz werden in diesen Referenzansichten nicht angeboten.

qCON akzeptiert 0 bis 99. qNOX akzeptiert unter Android 0 bis 99, unter iOS auch 100; BSR/SQI/EMG akzeptieren 0 bis 100. Impedanzen +, − und REF akzeptieren Android 1 bis 14 kΩ und iOS 1 bis 10; 15 ist TH. Android-Statusregeln einschliesslich Sensorbyte 927 sowie leere Zahlen und gegebenenfalls gehaltene Indextrends bleiben getrennt von den Rohwerten. Jeder 1024-Byte-Block wird mit CRC-16/ARC geprüft. Die Prüfung von Zähler, Fallkennung und Zeit sowie alle Originalbytes bleiben erhalten.

Der synthetische Simulator behält ausschliesslich seine historische Darstellung, ohne iOS-/Android-Auswahl. Der EEG-Tracé verwendet standardmässig wieder den ursprünglichen überschreibenden Durchlauf mit Löschlücke und Cursor. «Laufende Kurve» bleibt separat wählbar, auch für Aufzeichnungen; die Wahl wird gespeichert und in Demo-Sitzungen synchronisiert. Die EEG-Fenster betragen 2/4/8 Sekunden. Der DSA verwendet weiterhin das bisherige pädagogische Spektrummodell. Eine gemeinsame Neuberechnung von EEG, DSA und Indizes bleibt eine spätere Aufgabe. Alte Android-Demo-Einstellungen werden auf kompatible historische Skalen begrenzt. Signalverstärkung, Medikamentenmodelle und Indizes bleiben pädagogische Modelle. Die App-Analyse liefert keine physische Kalibrierung und keine proprietären qCON-/qNOX-Algorithmen. Native Thread-Latenzen, App-Ausführung und ein Vergleich mit einem physischen Gerät sind nicht geprüft. Belege, Formeln und Grenzen stehen in [docs/CONOXVIEW-REFERENCE.md](docs/CONOXVIEW-REFERENCE.md).

Die technischen Annahmen und offenen Prüfungen stehen in [docs/RECORDINGS.md](docs/RECORDINGS.md).

Dieser Ordner enthält **keinen exportierten Single-HTML-Build**. Oberfläche, Daten, Simulationslogik, Styles und Assets liegen als getrennte Quelldateien vor.

## Zeitleiste und gespeicherte Fälle

Die Fallansicht blendet Indexkurven direkt in die Schnitt-Zeitleiste ein, ohne deren Höhe zu erhöhen. Die Legende schaltet einzelne Kurven um. Ein Klick im Diagramm positioniert den Abspielcursor. Kleine gerade grüne Griffe an beiden Auswahlrändern begrenzen die Passage. Ein einzelnes 10 × 8 Pixel grosses Dreieck mit dünner Linie kennzeichnet den Abspielcursor. Sichtbare Griffe und unsichtbare Greifbereiche sind getrennt; die Oberfläche verwendet keine runden Griffrahmen. «Gitternetz» bezeichnet ausschliesslich die Diagramm-Hilfslinien.

Mit «+ Marke» lässt sich die aktuelle Position als benanntes Ereignis markieren. Ereignismarken sind orange nummeriert und unabhängig von den grünen Passagegrenzen. Klicken springt zur Marke, Ziehen oder die Pfeiltasten verschieben sie. Doppelklick öffnet Name und genaue Zeit; die gleiche Fensteransicht enthält die Liste mit Bearbeiten, Anspringen und Löschen. Nicht gespeicherte Änderungen bleiben nur im Arbeitsspeicher.

«Fall speichern (.cxbin)» lädt eine einzige Datei mit dem ganzen Originalfall und dem Bearbeitungsstand herunter. Beim erneuten Öffnen werden Marken, Passage, Abspielposition, Geschwindigkeit, Ansicht, EEG-/DSA-Skalen, Gitternetz, SEF und Kurvenauswahl wiederhergestellt. Die Originalbytes bleiben vollständig erhalten; die Simulatorinformationen stehen in einer versionierten, integritätsgeprüften Erweiterung am Dateiende. Der gewählte Ausschnitt kürzt die aufgezeichneten Daten nicht. Eine erneute Speicherung ersetzt die Erweiterung. Die Kompatibilität dieser erweiterten Dateien mit ConoxView ist nicht geprüft. Unter «Datei und Hinweise» kann der unveränderte Original-CXBIN wieder heruntergeladen werden. Die ursprüngliche Datei auf dem Gerät wird nie überschrieben. Format und Prüfungen stehen in [docs/CASE-FILES.md](docs/CASE-FILES.md).

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

Die Branch `gh-pages` enthält den aus `dist/` erzeugten statischen Build. Der Quellcode wird getrennt auf den Entwicklungsbranches verwaltet.

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
