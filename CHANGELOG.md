# Änderungsverlauf

## Unveröffentlicht – feste Demo-Sitzungen

- zufällige Sitzungs-PINs durch zehn feste Sitzungen `Demo 1` bis `Demo 10` ersetzt
- zuletzt gewählte Demo im `localStorage`, QR-Code und Links enthalten `demo=<n>`
- Synchronisation mit Revisionen und einheitlicher Konfliktauflösung für drei und mehr Geräte
- neue Geräte übernehmen den laufenden Zustand; Heartbeat und Abgleich nach Standby
- funktionierende `+`/`−`-Tasten der DSA-Farbskala (Sättigung Richtung Rot/Blau, ±4 Stufen à 4 dB)

## Version 43 – Medikamentensteuerung

- getrennte Kanäle für primäres Sedativum, sekundäre Sedierung/Adjuvans und Analgesie
- Wirkstufen `0` bis `4`, wobei `0` tatsächlich inaktiv ist
- separater Bolus pro Kategorie mit Anstieg, Plateau und Abklingen
- gekoppelte Effekte auf qCON, qNOX, BSR, RAW EEG und DSA
- opioidtypische Spektralsignaturen für Remifentanil, Fentanyl und Sufentanil ohne künstliche Burst Suppression
- automatisierte Modelltests für Stufe 0, Bolus, Analgesie, Spektralsignatur und BSR ergänzt

## Version 42 – rekonstruierte React/Vite-Entwicklungsstruktur

- echtes `package.json` mit React, ReactDOM, Vite und reproduzierbarem Lockfile
- JSX-Runtime-Ausgabe in editierbaren JSX-Code zurückgeführt
- Hauptzustände und Referenzen der React-App semantisch benannt
- Medikamentenprofile, EEG-Muster, Szenarien, Narkose-Reise, Lerninhalte und DSA-Palette getrennt
- Simulationsberechnung in ein React-unabhängiges Modul ausgelagert
- UI-Bausteine und Dokumentaktionen als eigene Module
- CSS, Bilder, PDFs und Outlook-Template als normale Assets
- Vite-Konfiguration mit Source Maps und relativem Produktionspfad
- automatische Struktur-, Formatierungs- und Build-Prüfung ergänzt

## Version 42

- Wachreferenz mit deutlich reduzierter Delta-Aktivität
- Slow-Anteil im Wachsignal als schwache unregelmässige Drift statt kontinuierlicher Delta-Wellen
- stärkere Alpha- und Slow/Delta-Abnahme während Beta-Arousal
- ausgeprägtere Reaktion beim simulierten starken/nozizeptiven Reiz
- gezielte Delta-Zunahme beim paradoxen Delta-Arousal
- deutlich geringere spektrale Restleistung zwischen Bursts während Burst Suppression
