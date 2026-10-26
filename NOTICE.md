# Hinweise zur Nutzung

## Demonstrationscharakter

- Im Simulationsmodus werden EEG-, DSA- und Indexsignale synthetisch erzeugt.
- qCON- und qNOX-Verläufe bilden didaktische Reaktionen ab und reproduzieren keine proprietären Berechnungsalgorithmen.
- Die Oberfläche ist eine CONOX-nahe Schulungsdarstellung und nicht die originale Benutzeroberfläche des Medizinprodukts.
- Die Anwendung ist nicht für Diagnose, Therapie, Dosierung oder Patientenüberwachung bestimmt.
- Klinische Entscheidungen dürfen nicht auf den dargestellten Signalen oder Indexwerten beruhen.

## Experimentelle Fallwiedergabe

Der getrennte Fallmodus kann unterstützte CXBIN-Dateien lokal öffnen. Die Datei und ihre Inhalte verbleiben im Arbeitsspeicher des Browsers. Die gemeinsame Demo-Verbindung wird vor dem Import beendet. Es werden keine Aufzeichnungen oder daraus abgeleiteten Daten automatisch im Projekt, im Browser-Speicher oder auf einem Server gespeichert. Vom Benutzer ausgelöste PNG-, PDF- und Videoexporte werden lokal erzeugt und heruntergeladen. Die exportierten Ansichten enthalten keine Fallkennung oder Gerätezeit, aber die dargestellten Messdaten und den Hinweis auf die vorläufige Darstellung.

Das Binärformat wurde anhand einer Aufzeichnung untersucht. Die Zuordnung der Indizes und die Umrechnung in µV sind vorläufig. qCON/qNOX-Werte ab 100 und andere ungültige Indexwerte werden als fehlend dargestellt; die Rohwerte bleiben intern für spätere Validierung erhalten. Der berechnete DSA und die SEF-Werte reproduzieren keinen bestätigten Gerätealgorithmus. Ungewöhnliche Ausschläge werden nicht automatisch entfernt. Eine fachliche Prüfung gegen denselben Abschnitt in ConoxView ist erforderlich.

## Fachliche Einordnung

EEG-Muster wie Alpha-Dropout, Beta-Arousal oder Delta-Arousal sind unspezifische Verlaufsveränderungen. Sie beweisen weder Wachheit noch Schmerz und müssen in der klinischen Praxis immer zusammen mit Signalqualität, EMG, Medikamenten, Reizzeitpunkt, Hämodynamik und Patientenreaktion beurteilt werden.

## Marken, Gestaltung und Unterlagen

Produktnamen und Marken verbleiben bei ihren jeweiligen Rechteinhabern. Broschüre, Datenblatt und Outlook-Vorlage können zusätzlichen internen oder urheberrechtlichen Nutzungsbedingungen unterliegen.

Vor öffentlicher Bereitstellung, externer Weitergabe oder Einsatz bei Kunden ist eine entsprechende interne Freigabe einzuholen.

Für diesen Quellstand wurde bewusst keine Open-Source-Lizenz festgelegt.
