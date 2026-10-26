# Experimentelle CXBIN-Wiedergabe

Der Fallmodus ist unabhängig vom synthetischen Simulator. `App` montiert entweder `SimulatorApp` oder `RecordingPlayer`. Beim Wechsel werden sämtliche Simulator-Effekte und die Peer-Verbindung beendet. Es gibt keine gemeinsame Zustandsübertragung für Aufzeichnungen. Der Rückweg startet die synthetische Simulation neu.

## Lokale Verarbeitung

`RecordingPlayer` liest eine vom Benutzer gewählte Datei mit der File API. Ein dedizierter Worker dekodiert, filtert und berechnet das Spektrogramm. Datenpuffer werden zwischen Worker und Oberfläche übertragen. Abbrechen, Dateiersatz und Verlassen des Modus beenden den Worker und verwerfen verspätete Ergebnisse. Nur die Sprachwahl wird im localStorage gespeichert. Dateien sind auf 64 MiB begrenzt. Die ursprüngliche Aufzeichnung und abgeleitete Patientendaten gehören nicht in Repository, Tests oder öffentliche Builds.

## Unterstützte Struktur und Annahmen

Der Parser unterstützt zunächst eine abgeleitete Struktur mit 1024 Bytes pro Block und der Signatur `fff0050000540`. Der grosse Integer-Zähler bei Offset 13 wird als fortlaufender Big-Endian-Zähler gelesen. 256 Werte mit je 24 Bit bei Offset 26 ergeben nominal 0,25 Sekunden bei 1024 Hz. Die Umrechnung `(ADC - 0x800000) × 0,04458` in µV ist ausdrücklich vorläufig.

Die angenommenen Indexpositionen sind qCON 18, qNOX 19, BSR 20, SQI 21 und EMG 25. qCON/qNOX ab 100 und die übrigen Indizes über 100 erscheinen als Lücken, ohne Interpolation oder Ersatz durch simulierte Werte. Die Originalbytes bleiben als `rawIndices` verfügbar. Insbesondere die Bedeutung des Wertes 100 muss noch bestätigt werden.

Die Fallkennung wird bei Offset 883 gelesen, die Gerätezeit bei Offset 959. Die Zeit besitzt keinen Zeitzonenbezug. Maximal vier Anfangsblöcke eines einzigen vorherigen Falls können nach Warnung ausgeschlossen werden. Grössere oder vermischte Abschnitte werden abgewiesen. Zählerlücken und unvollständige Blöcke werden nicht übergangen. Die Wiedergabe folgt der nominalen Abtastrate, nicht einer sprunghaften Geräteuhr. Ein Blockzähler prüft keine vollständige Datenintegrität; die unbekannte Prüfsumme ist noch nicht validiert.

## Darstellung, Timeline und Export

`RecordingTimeline` zeigt die gesamte Aufzeichnung mit getrennten, per Maus, Touch oder Tastatur verschiebbaren Beginn-/Endmarkern und einem unabhängigen Abspielcursor. Marker können sich nicht kreuzen. Ungültige manuelle Passageeingaben sperren Wiedergabe und Videoexport, bis sie korrigiert werden. Die Zeitauflösung der Auswahl beträgt 0,01 Sekunden; die Mindestpassage ist 0,25 Sekunden oder die kürzere Gesamtdauer.

`renderPresentation` zeichnet dieselbe Komposition für Anzeige und Export. Die vier Bereiche haben 1600 × 1200 Pixel, CONOX mit Rahmen 1600 × 1120, CONOX ohne Rahmen 1600 × 900. Alle Ansichten verwenden die gespeicherten Indizes und dieselben EEG-/DSA-Daten, Skalen und Überlagerungen. Der Bildschirmmodus hat keine Demo-Verbindung. Ein Vollbild-Fallback funktioniert auch ohne native Fullscreen-API; Escape und eine sichtbare Rücktaste verlassen ihn.

PNG und PDF halten die aktuelle Position fest. PDF bettet die vollständige Ansicht proportional auf einer A4-Querformatseite ein. Video erfasst einen unabhängigen Canvas mit MediaRecorder/captureStream. Der Durchlauf folgt einer monotonen Uhr und dauert ungefähr `(Ende - Beginn) / Geschwindigkeit`; kleine Encoder-Latenzen bleiben möglich. MP4 und WebM werden nur bei nativer Unterstützung angeboten, ohne Umbenennen des Containers. Der Zieldatenstrom beträgt 2,5 Mbit/s. Bei langen Passagen wächst der Speicherbedarf; kurze Ausschnitte sind für Präsentationen zweckmässig. Abbrechen, Tabwechsel und Verlassen des Fallmodus stoppen die Aufnahme und verwerfen Teildateien. Der Export benötigt kein Backend und keine externe Bibliothek.

Die Dateien enthalten keine Fallkennung, Dateinamen oder absolute Gerätezeit. Die Messdaten und der Hinweis auf die vorläufige Rekonstruktion bleiben sichtbar. Die bisherigen CONOX-Validierungsvorbehalte gelten auch für exportierte Dateien. Browserprüfungen umfassen echte Downloads der drei Ansichten, PDF-Rendering, kurze MP4-/WebM-Clips, Auswahl, Geschwindigkeit, Abbruch und Vollbild. Dies bestätigt keine vollständige Aufnahme eines mehrstündigen Falls oder die Funktion auf einem physischen iPad.

## Rekonstruktion des EEG und DSA

Das EEG wird ohne Resampling durch einen kausalen Butterworth-Hochpass zweiter Ordnung bei 0,5 Hz und einen Tiefpass zweiter Ordnung bei 45 Hz gefiltert. Der Hochpass wird auf dem ersten Eingangswert initialisiert, um den Gleichspannungsanteil nicht als künstlichen Startimpuls anzuzeigen. Die Filter sind keine bestätigte Nachbildung der Gerätefilter; Phasenverschiebungen und Übergangseffekte bleiben möglich.

Das Spektrogramm verwendet eine FFT mit 2048 Punkten, Hann-Fenster, Mittelwertentfernung und einen Schritt von einer Sekunde. Die einseitige Leistungsdichte wird mit Fensterenergie und Abtastrate normiert. Die Farbeingabe ist `10 × log10(PSD / 1 µV²/Hz)`. Dargestellt werden 0 bis 45 Hz mit 0,5 Hz Abstand. SEF50 und SEF95 beziehen sich auf das rekonstruierte Band von 0,5 bis 45 Hz. Es werden kein künstliches Rauschen und keine Frequenzgewichtungen aus dem Simulator hinzugefügt.

Die Farbpalette wird aus der bestehenden Darstellung übernommen; dies bestätigt keine identische Farbkalibrierung mit CONOX. Der synthetische DSA bleibt im bisherigen Modus unverändert. Der Fallmodus berechnet einen eigenen DSA aus den Messdaten.

## Noch zu bestätigen

Für die Vergleichsprüfung werden Screenshots desselben Fallabschnitts in ConoxView mit sichtbarer Zeit-, Amplituden- und Farbskala benötigt. Dazu sind die Version von ConoxView und ein zweiter anonymisierter Fall hilfreich. Zu vergleichen sind Verlauf, Amplitude, Indexwerte, Lücken, auffällige Ausschläge und DSA-Banden. Für eine identische Reproduktion werden zusätzlich die Formatbeschreibung und die tatsächlichen Filter-, Fenster- und Farbparameter benötigt.

Die automatisierten Tests verwenden ausschliesslich erzeugte Testblöcke und analytische Sinussignale. Sie prüfen Dekodierung, Grenzen, Fehlerfälle, Zeitachsen, Wiedergabegrenzen, Übersetzungsparität und spektrale Normierung. Diese Tests ersetzen die Vergleichsprüfung mit ConoxView nicht.
