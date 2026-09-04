# Rekonstruktionshinweis

## Ausgangslage

Für Version 42 lagen keine ursprünglichen React-Komponenten, kein früheres `package.json`, keine Vite-Konfiguration und keine Source Maps mehr vor. Verfügbar waren nur die Single-HTML-Ausgabe und das daraus getrennte Produktionsbundle.

## Vorgehen

Der anwendungsspezifische Teil wurde aus dem Bundle isoliert und in ein neues React/Vite-Projekt überführt. Dabei wurden:

1. React und ReactDOM durch reguläre Paketabhängigkeiten ersetzt,
2. JSX-Runtime-Aufrufe wieder in echten JSX-Code umgewandelt,
3. Zustände und Referenzen der Hauptkomponente teilweise semantisch benannt,
4. Datenkataloge in fachliche Module getrennt,
5. Simulationsberechnungen von React entkoppelt,
6. wiederverwendbare UI-Bausteine ausgelagert,
7. CSS, Bilder, PDFs und das Outlook-Template als normale Dateien eingebunden.

## Abgrenzung

Dieses Projekt ist eine funktionsgleiche Rekonstruktion des vorhandenen Stands, nicht die Wiederherstellung verlorener Originaldateien. Frühere interne Komponentennamen, Kommentare und Git-Historie lassen sich aus einem Produktionsbundle nicht zuverlässig zurückgewinnen.

Einzelne lokale Variablennamen innerhalb der komplexen Canvas-Zeichenroutinen stammen noch aus dem kompilierten Stand. Die öffentlichen Modulnamen, Hauptzustände und fachlichen Exporte wurden dagegen lesbar rekonstruiert.

## Verifikation

Das Projekt wird mit dem mitgelieferten `package-lock.json` installiert. `npm run check` prüft die erforderlichen Dateien, Dokument-Signaturen, Codeformatierung und den vollständigen Vite-Produktionsbuild.
