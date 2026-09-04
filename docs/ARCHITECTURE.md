# Architektur

## Anwendungseinstieg

`src/main.jsx` lädt die globalen Styles, initialisiert die Dokumentaktionen und rendert `App` über React `createRoot`.

## React-Oberfläche

`src/App.jsx` enthält den zustandsbehafteten Monitor und die Canvas-Lebenszyklen. Die wichtigsten Zustände tragen wieder lesbare Namen, beispielsweise:

- `primaryDrug`, `primaryLevel`, `adjunctDrug`, `opioidDrug`
- `simulationRunning`, `simulatorEnabled`
- `selectedScenarioId`, `currentIndices`, `trendHistory`
- `eegWindowSeconds`, `eegAmplitude`, `dsaPeriodMinutes`
- `journeyRunning`, `journeyPhase`, `journeyProgress`

Wiederverwendbare Darstellungselemente wurden nach `src/components/` ausgelagert.

## Datenmodell

Die statischen Inhalte befinden sich getrennt unter `src/data/`:

- Grundeinstellungen und Wirkstufen
- Medikamentenprofile
- EEG-Muster
- Fallbeispiele
- Narkose-Reise
- Lerninhalte
- DSA-Farbskala

`src/data/index.js` dient als zentraler Exportpunkt.

## Simulationsengine

`src/simulation/engine.js` ist unabhängig von React. Es enthält unter anderem:

- Begrenzung und weiche Interpolation
- Ereignishüllen für Dropouts und Arousals
- Anpassung der synthetischen Indizes
- gaußförmige Spektralkomponenten und Rauschen
- Umrechnung spektraler Leistung in DSA-dB/Farben
- Interpolation und Kombination von Wirkstoffprofilen
- Bolusverlauf und synthetische Indexberechnung

Die Exporte besitzen lesbare Namen wie `clamp`, `getEventEnvelope`, `dsaDbToRgb`, `interpolateDrugProfile` und `calculateIndices`.

## Assets

Statische Dateien liegen unter `public/`. Vite kopiert sie beim Build unverändert nach `dist/`. `base: "./"` macht den Produktionsbuild auch in einem GitHub-Pages-Unterpfad nutzbar.

## Weiterentwicklung

Die nächste sinnvolle Refaktorierungsstufe wäre, die drei grossen Canvas-Lebenszyklen aus `App.jsx` in eigene Hooks aufzuteilen:

- `useRawEegCanvas`
- `useDsaCanvas`
- `useKnowledgeCanvas`

Der jetzige Stand trennt bereits Daten, reine Berechnungen, UI-Bausteine, Dokumentaktionen und Styles, ohne das validierte Verhalten der Version 42 zu verändern.
