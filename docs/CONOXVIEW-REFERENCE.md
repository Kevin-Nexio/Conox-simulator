# ConoxView als Softwarereferenz

Zwei getrennte Profile stehen zur Verfügung: Android 2.4 und iOS 1.1. Die ersten Abschnitte dokumentieren iOS; der Android-Abschnitt beschreibt seine abweichenden Regeln. Neue Originalimporte verwenden Android, ältere gespeicherte Fälle ohne Profil behalten iOS. Die synthetische Simulation verwendet ausschliesslich ihre historische Darstellung ohne Profilwähler.

Stand: 27. Oktober 2026. Referenz ist die offizielle iOS-App [ConoxView](https://apps.apple.com/ch/app/conoxview/id6446486069), Store-Version 1.1, Bundle 1.1.1, Build 2, `com.quantiummedical.conoxview`. Das untersuchte arm64-Programm heisst `BM78 BLE UART`; SHA-256: `46173a925df37fdcd22551158dbe3187b028eaccc8efcd7b30b0cb89465d89cb`.

Die Regeln wurden mit REA und Ghidra 12.1.4 aus dem ausgelieferten Programm und seinen Ressourcen abgeleitet. Das ist eine statische Softwareprüfung. Eine zeitgleiche Gegenprüfung mit realem CONOX, Bluetooth und iOS ist damit nicht erbracht. Die untersuchten Routinen liegen ausserhalb der als verschlüsselt markierten Seite; es wurde keine Verschlüsselung umgangen.

## Empfangene Daten

| Bedeutung              | Offset im 1024-Byte-Block     | Regel                                                           |
| ---------------------- | ----------------------------- | --------------------------------------------------------------- |
| Präfix                 | 0 bis 2                       | ASCII `fff`                                                     |
| Zähler                 | 13 bis 16                     | uint32 Big Endian, nominal vier Pakete/s im unterstützten CXBIN |
| Sensorzustand          | 17                            | Zuordnung unten                                                 |
| qCON / EMG / BSR / SQI | 18 / 19 / 20 / 21             | qCON 0 bis 99, übrige 0 bis 100                                 |
| Impedanzen + / − / REF | 22 / 23 / 24                  | 1 bis 10 kΩ, 15 = TH, 128 = nicht verfügbar                     |
| qNOX                   | 25                            | 0 bis 100 gültig                                                |
| Getrenntes RAW24       | 26 bis 793                    | 256 Werte; bisheriger µV-Gain bleibt unbestätigt                |
| Anzeige-EEG            | 794 bis 857                   | 32 uint16 Big Endian, Zentrum 31000                             |
| Spektralgruppe         | 881                           | 0 bis 4 für 45 sichtbare Bänder                                 |
| Neun Spektralwerte     | 882, 928 bis 933, 941 bis 942 | `(Byte - 128) / 128`, Band `Gruppe × 9 + j + 1`                 |
| CRC                    | 1022 / 1023                   | CRC-16/ARC über 0 bis 1021, Ergebnis Big Endian                 |

CRC-16/ARC verwendet Init 0, reflektiertes Polynom `0xA001`, kein finales XOR. Die unabhängigen Prüfvektoren sind `123456789 → BB3D`, 1022-mal FF → B0FE und Bytes `i mod 256` über 1022 Positionen → A0FE. Der Import prüft zusätzlich Zählerfolge, unterstützte Fallkennung, vollständige Blöcke und Gerätezeit. Die Fallkennung bei 883 und Zeit bei 959 bleiben Eigenschaften des untersuchten CXBIN-Formats, keine vollständige native Dateiformatspezifikation.

Sensorzustände sind `00=Reading OK`, `80=Artifact`, `C8=Impedance Test`, `E1=Lead Off`, `D2=Sensor Invalid` und `84=Sensor End Of Use` (hexadezimal). Andere Codes bleiben unbekannt. Der App-Sonderfall C9 erhält keine erfundene klinische Bedeutung. Das iOS-Profil hält ungültige Indizes als Lücken; er übernimmt nicht das mögliche Fortschreiben alter globaler Trendwerte aus der App. Die Bezeichnungen +/−/REF bestätigen keine Positionierung auf der Stirn.

## EEG-Projektion und Zeit, iOS 1.1

Der Empfang startet `setupPathEEG:` alle 0,03125 Sekunden. Vier Punkte pro Tick ergeben 128 Hz. Die Fenster 2/4/8 Sekunden enthalten 256/512/1024 Punkte. Zuerst wächst die Kurve bei konstantem horizontalem Abstand; nach Füllung rücken jeweils vier Punkte nach links. Es gibt auf diesem Pfad keinen Kreisumlauf mit altem Signal rechts eines Löschcursors.

Für einen empfangenen Wert `raw` berechnet die App mit Float32-Arithmetik:

```text
D = float32(3.0757) = 3.075700044631958
q = clamp(trunc(float32(O + float32((raw - 31000) / D))), 0, M)
y / H = (120 - 100 × q / M) / 150
x_i = x_0 + i × W / (N - 1)
```

| App-Skala | O     | M     | y/H für raw 31000 |
| --------- | ----- | ----- | ----------------- |
| 25        | 531   | 1121  | 0,4842105263      |
| 50        | 1061  | 2243  | 0,4846485362      |
| 120       | 2552  | 5394  | 0,4845878136      |
| 475       | 10079 | 21307 | 0,4846419799      |

Die steigende Rohzahl bewegt die Kurve nach oben. Die beiden Sättigungen liegen bei y/H 20/150 und 120/150. Der Nullwert liegt absichtlich nicht bei H/2. Es erfolgt keine weitere Butterworth-Filterung dieses bereits vorbereiteten Kanals. Die App-Skala wird nicht als bestätigtes ±A oder als Kalibrierung des separaten RAW24-Kanals ausgegeben. Ein unabhängiges Float32-Modell wurde für alle 262144 Kombinationen aus uint16 und Skala ausgewertet; feste Punkte und Grenzfälle stehen zusätzlich in den Repository-Tests.

Die Dateiwiedergabe verwendet `4 × floor(32 × t)` Punkte und begrenzt sie auf die Quelle. Die reale Phase des Bluetooth-Timers fehlt im CXBIN. Der synthetische Generator verwendet ebenfalls 128 Hz und ein gleitendes Historium, behält jedoch seine pädagogischen Amplituden und Medikamentenmodelle. Seine Bildschirmposition und Begrenzungen sind angeglichen, ohne eine neue physische Gain-Kalibrierung zu behaupten.

## DSA, iOS 1.1

Die App empfängt neun Koeffizienten pro Paket. Wiederholte Gruppen ersetzen nur ihre neun Bänder in der aktuellen Spalte. Es gibt auf diesem Pfad weder FFT noch Mittelung noch Übernahme der 45 Bänder aus der vorherigen Spalte. Unbekannte Gruppen schreiben nicht ausserhalb des 45-Band-Bereichs. Fehlende Bänder bleiben im Simulator schwarz; ein empfangener Koeffizient 0 ist dagegen grün.

Für `x=(Byte-128)/128` gilt exakt:

```text
R = trunc(255 × clamp(1.5 - abs(2x - 1), 0, 1))
G = trunc(255 × clamp(1.5 - abs(2x),     0, 1))
B = trunc(255 × clamp(1.5 - abs(2x + 1), 0, 1))
```

Byte 0 ergibt RGB 0/0/127, 128 ergibt 127/255/127, 224 ergibt 255/0/0 und 255 ergibt 131/0/0. Die Legende stammt unverändert aus der App-Ressource `FFTNew.png`; lediglich Apples CgBI-Kodierung wurde mit `sips -s format png` nach Standard-PNG konvertiert. Sie liegt als `src/assets/conoxview-dsa-scale.png` vor. Ihre Zahlen 50/10/0/−10/−20/−30 belegen keine inverse Umrechnung in eine physische Leistungsdichte. Deshalb nennt die Oberfläche sie Anzeigeskala und behauptet nicht dB re 1 µV²/Hz.

Initialwerte sind Gate 1 s, nächste Grenze 5 s und Spalte 0. Ab Gate schreibt jedes Paket zuerst seine neun Werte in die aktuelle Spalte. Danach wird bei `nächsteGrenze <= floor(Empfangszeit)` genau eine Spalte weitergeschaltet. Der Renderer zeigt nur abgeschlossene Spalten. Der Simulator reproduziert diese Reihenfolge anhand der kontinuierlichen Dateizeit: vor 5 s und am offenen Dateiende wird keine unfertige Spalte gezeigt. Dies verhindert zukünftige Werte auch bei Sprüngen und im unabhängig gerenderten Video.

Die reale App liest den letzten Empfangszeitwert aus einem zusätzlichen Timer. Eine exakte Zuordnung desselben Grenzpakets ist ohne synchronisierten Lauf nicht beweisbar. Die nativen Kapazitäten 450/1800/5400 Spalten und die Beschriftungen 30/120/360 Minuten passen mit dem beobachteten 5-s-Takt rechnerisch nicht exakt zusammen. Die Dateiwiedergabe behält deshalb die tatsächliche Zeitbasis und streckt sie nicht nach den Beschriftungen.

Eine physische Koeffizientenumrechnung, ein nativer Farbversatz und SEF50/95 sind auf diesem Pfad nicht bestätigt. Entsprechende gespeicherte Einstellungen bleiben erhalten, werden für empfangene Spektren aber nicht angewendet. Die frühere rekonstruierte PSD und ihre SEF-Berechnung bleiben getrennt in `spectrum.js`. Die Legende des historischen synthetischen Spektrums folgt dessen pädagogischer Pixelpalette. Der Android-Fallleser verwendet stattdessen die nachfolgend dokumentierte FFT.

## Android 2.4 als getrenntes Profil

Das Android-Profil basiert auf `qm.display.qnoxqcon`, Version 2.4, Build 18, vom25.10.2023. APK-SHA-256: `f7576a552ed77c96655baf4188f6f20390bfa5dcccb2c73b2bb4059898881b7b`. Das APK wurde über einen Spiegel bezogen und mit REA 6.8.0/JADX statisch untersucht. Hash und JAR-v1-Signatur wurden geprüft; eine unabhängige Bestätigung des Herausgeberzertifikats und eine Ausführung auf Android fehlen. Der ergänzende JADX-Dump ist in den lokalen Belegen gesondert gekennzeichnet. Diese Regeln werden nicht stillschweigend auf iOS angewandt.

### EEG und Skalen

Android übernimmt dieselben32 uint16-Werte bei 794..857, ohne den vorbereiteten Kanal nochmals zu filtern. Die vorhandene IIR-Routine hat im geprüften Pfad keine Aufrufer. Die App zeichnet Rohwerte mit einem Zentrum von 31000 und linearen Grenzen. Fenster sind3/6/9 s mit 384/768/1152 Werten, Standard9 s und±120 µV. Der Anfang wächst von rechts, `x=(N−sichtbareWerte+i)×W/N`, der letzte Punkt liegt bei`W−W/N`. Die adaptive FIFO-/Thread-Kadenz ist nicht aus dem CXBIN rekonstruierbar; der Nachbau verwendet nominal 128 Hz.

| Skalenbeschriftung | Untergrenze | Obergrenze |
| ------------------ | ----------- | ---------- |
| ±25 µV             | 29276       | 32724      |
| ±50 µV             | 27551       | 34449      |
| ±120 µV            | 22723       | 39277      |
| ±250 µV            | 13755       | 48245      |
| ±475 µV            | −1767       | 63767      |

Die Android-App benennt die Amplitude ausdrücklich als`+/-`, auch in der Pinch-Berechnung. Die Vermutung,50 µV meine±25 µV, gilt für diese Software nicht. Das bestätigt ihre Darstellungsabsicht, keine elektrische Kalibrierung. Die120-Skala enthält im nativen Pinch-Text eine Abweichung8227 statt8277; nachgebaut werden die belegten Preset-Grenzen, nicht dieser Textfehler.

### FFT und DSA

Android liest nicht die neun iOS-Spektralkoeffizienten. Nur positive EEG-Werte bei Statusbyte17 gleich 0 und Artefaktbytes 992..996 alle0 füllen das 128-Werte-Fenster. Ein ungültiger Wert setzt die Akkumulation zurück. Die Mittelwertbereinigung, Hamming-Fensterung und FFT verwenden:

```text
w[i] = 0.53836 − 0.46164 cos(2πi/127)
x[i] = (raw[i] − Mittelwert(raw)) w[i]
P[k] = |FFT(x)[k]|² / 1000000, k=1..44
erste FFT: L = 10 log10(P) für P>0, sonst0; Ausgabe bleibt Byte 0
danach: L = 0.8 L + 0.2 × 10 log10(P) für P>0, sonst L halten
D = L − 3
B = trunc(clamp(D>27.6 ? 0.3333D+235.8 : D>17.6 ? 4.5D+120.8 : 4.953D+112.3, 0, 255))
```

Die Palette übernimmt die oben dokumentierte Jet-Funktion mit`x=(B−128)/128`.44 Bänder werden in eine mit 0..45 Hz beschriftete Fläche gestreckt. Das Original nennt die Legende «FFT (dB)», ohne eine bestätigte Leistungsdichte inµV²/Hz zu liefern. Die neue Datei`src/assets/conoxview-android-dsa-scale.png` ist eine Standard-PNG-Konvertierung der APK-Ressource`fftcolorbar.bmp`, deren Originalhash`8076f2e9d34580d6f601dc3b198f49d4f923bfde33cfee54831dbc11d85eaf1c` lautet. Der Hintergrund ist Byte 0, RGB0/0/127; blau kann auch Initialisierung, Reset oder einen alten Wert bedeuten.

Die App liest den letzten verfügbaren FFT-Wert bei Paketzähler modulo 4 gleich 0. Die Hauptansicht hat1-s-Spalten, das Stundenbitmap nimmt jede zweite Ausgabe bei modulo 8 mit 2-s-Zellen. Das Menü bietet5/30/60 min; die unaufgerufenen2 h/6 h-Zweige sind kein Nachweis nutzbarer Einstellungen. Der Zeichenthread wird in Fünfergruppen des 1-s-Timers geweckt. Ein qCON-Wert128 setzt die FFT-Ausgabe zurück. Andere ungültige Abschnitte können das letzte Spektrum halten. Die CXBIN-Prüfung lehnt Zählerlücken weiterhin ab; verlorene Bluetooth-Pakete und Disconnect-Timer werden deshalb nicht simuliert.

Die exakte asynchrone Reihenfolge ist nicht belegt. Der Nachbau liest konservativ das vorige FFT-Ergebnis vor Verarbeitung des Grenzpakets, setzt dessen früheste Verfügbarkeit auf das Paketende und veröffentlicht am nächsten vollständigen5-s-Raster. Der letzte offene Batch bleibt verborgen. Native Start-Gates hängen zusätzlich von UI-Zuständen ab und werden nicht behauptet; die anfänglichen Nullspalten bleiben erhalten. Es werden weder zukünftige Samples noch unvollständig verfügbare Farben verwendet.

### Indizes, Zustände und Speicherung

qCON und qNOX akzeptieren unter Android 0..99, BSR/SQI/EMG0..100. Impedanzen1..14 sind numerisch,15 ist TH. Sensorbyte17 behandelt0..100 als Normalzustand;133 ergänzt132. Bei normalem Zustand oder Artefakt überschreibt Sensorbyte927 mit 124..131 den Text als Nutzungsdauer überschritten,180 als abgelaufen. Unbekannte Statuscodes können den vorherigen Text behalten. Rohcode und übernommener Text bleiben getrennt.

Ungültige Zahlen sind leer. Die1-s-Trends können vorherige gültige Indexwerte halten, solange ihre Anzeigeflags aktiv sind; Artefakte oder gesperrte Zustände erzeugen Lücken. Impedanzen werden vor der qCON-Reaktivierung gezeichnet, SQI danach. Nicht beobachtete Startwerte bleiben im Nachbau unbekannt. Kein Teil dieses Codes beweist einen klinischen qCON-/qNOX-Default für unbekannte EEG-Muster.

Neue Originalimporte starten mit Android. Die synthetische Simulation behält ihr historisches Modell ohne Profilwahl. Gespeicherte Fälle ohne Profil bleiben iOS. Profilwechsel erhalten Originalbytes, Marken, Passage, Position und Geschwindigkeit; nur inkompatible Skalen werden normalisiert. Die zusätzliche3×-Geschwindigkeit entspricht den erwähnten beschleunigten Videos, verändert aber nie die Dateizeit. Der isolierte Vergleichsbaustein `simulation/androidDsa.js` wurde mit demselben128-Hz-Generator geprüft, ist aber in der veröffentlichten Simulation nicht aktiv. Seine nominale Zuordnung31000+µV×3449/50 ist eine pädagogische Konvention. Der Generator ersetzt weder den ADC noch die proprietären Indizes.

| Regel                                   | Native Methode          | REA Evidence                                                        |
| --------------------------------------- | ----------------------- | ------------------------------------------------------------------- |
| Felder, Artefakte, Indizes, Sensorflags | extractDataBy3BProtocol | ev_097232e9f61bfabee90a764910125746abd36639099ba69b282a0660ebd6f161 |
| EEG-Skalen                              | EEG Y scale             | ev_9fccdf5a24c48786f896ef427ce58b3e272a901f79e01a9214db70b4397d3da5 |
| ±µV-Beschriftung                        | EEG pinch               | ev_a54e85b73234132988a2526e522ca2ee0926b778c431f429a5efa74701e2d40d |
| FFT und Kompression                     | FFTCalculation          | ev_90264152f4d29aed2eaa3533bdfabe1edd0a503e630196c29efdd74422adc6b3 |
| Palette und Bandraster                  | image draw              | ev_acc6d75e9dba0397dfe9be33538244b3811c4189755f310400c9b88caea9e93d |
| 5/30/60-Minuten-Bitmaps                 | getSpectrIMG            | ev_09d0b01672716366fe24ea74ff3c35b85c061b17144a24d3b2d1a59629c0f72d |
| Timer und gehaltene Werte               | UiTimerTask.run         | ev_c9ccf3e8d6fc291914b15395225097be3db2d2938155e1ed20be3c4b3a3499e6 |

## Nachvollziehbare Belege, iOS 1.1

| Regel                                    | Funktion / Adresse                      | REA Evidence                                                                                                                              |
| ---------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Feldpositionen, Grenzen, Spektralgruppen | extractDataBy3BProtocol: / 0x1000250c4  | ev_3d3a9a271fb6665d0f3a97a7cbb7aa4677b392aca77e26368fd39646f7853ad3                                                                       |
| Empfang und 32-Hz-EEG-Timer              | didReceiveTransparentData / 0x10002c010 | ev_c5f51d13707822e30c1a5cd72c7a4d40e1b1e2e5ec7bb23e77a6b9738ec4a2ff                                                                       |
| Default 4 s / 120, DSA-Gates             | viewDidAppear: / 0x1000230d4            | ev_77e30f02588af22674fcf52f2b93fd086003c4ab103c6c45032044172eba18d1                                                                       |
| EEG-Gain und Bildschirmgeometrie         | setupEEG / drawEEG                      | ev_96adaae858306c7c7377909aadb5a93e915c1c78305cf991d86c91f2c0e796af / ev_34bcaae1794fb48bcbfe94ceb68c346e64502fa7f9d741f3cb793ceebf798fbc |
| Fensterpuffer und Verschiebung           | setupPathEEG:                           | ev_431ca18fc1ae3b5e127e69292b608b65130ef76652b7e51f0e3c1044012a9b8a                                                                       |
| DSA-Palette                              | setupPathSpectro / 0x10002ac28          | ev_c6abf98448f04fbe7defbfc0b8408dacaf0cc1c46990b592a32e4631eb2d5498                                                                       |
| Frequenzachse 1 bis 45                   | setupSpectro / 0x100028764              | ev_38e9687dc1d38aab378e326a6c7f881d8e4f40b68eef56b6b28167e1b15a9cd7                                                                       |

Die vollständigen lokalen REA-Ergebnisse bleiben ausserhalb des Repositories. Keine private Aufzeichnung oder daraus abgeleiteten Messkurven werden als Tests oder öffentliche Assets hinzugefügt. Die bisherige erweiterte CXBIN-Speicherung hält sämtliche Originalbytes unverändert; ihre Kompatibilität mit dem nativen ConoxView-Dateileser ist weiterhin nicht geprüft.

## Verifikation

Die Tests verwenden synthetische Protokollblöcke und feste Referenzwerte. Sie prüfen CRC und jede einzelne Bitposition, EEG-Grenzen/Polarität, Fensterfüllung und Gleiten, Pause und Fortsetzen, Spektralgruppen/Überschreiben, Fünfsekundengrenzen, fehlende Bänder, Farbendpunkte, Sprachparität und das Wiederöffnen gespeicherter Originalquellen. PDF-Bilder werden verlustfrei als RGB/Flate eingebettet; die JPEG-bedingte Farbverschmierung schmaler DSA-Spalten entfällt.

Browserprüfungen decken einen künstlichen Fall mit qNOX 100, TH, Sensorzuständen, 2- und 10-Hz-EEG und definierten Spektralbändern ab. Die drei Ansichten, Vollbild und PNG/PDF/kurze Videoexporte werden lokal geprüft. Eine erfolgreiche Softwareprüfung ersetzt keine klinische Validierung oder die Messung der realen Bluetooth-Latenz.

## Zusätzliche mathematische Gegenprüfung

Am27.10.2026 wurde die vollständige dekompilierte Android-Klasse FFTCalculationThread ohne Änderung ihrer Mathematik in einem isolierten Java-Harness kompiliert. Konstruktor, FFTCalculation und realft stimmen ohne Leerraum mit den oben genannten REA-Belegen überein. four1 stammt aus einer zusätzlichen Extraktion mit demselben JADX-JAR; dafür wird kein neuer REA-Beleg behauptet. Das APK wurde nicht gestartet.

1346 deterministische Fenster ergeben59224 identische Ausgabebytes. Geprüft wurden DC, ganzzahlige und nicht ganzzahlige Sinusfrequenzen, Amplituden, Impulse, Mischsignale, Rauschen, Nullleistung, Übergänge und Reset. Der maximale Leistungsfehler geteilt durch max(1,Java-Leistung) beträgt8,03×10⁻¹³. Dies bestätigt die getestete Arithmetik, weder Android-Thread-Timing noch Eingangskalibrierung oder klinische Übereinstimmung.

Die beiden tatsächlich korrigierten Renderfehler betrafen den Start bei der linken Bitmapkante und überlappende Spalten, wenn eine Sekunde weniger als einen Bildschirmpixel belegt. Die Daten liegen jetzt zuerst im nativen Zeitraster; es folgt eine einzige Skalierung mit aktivierter Bildfilterung. getSpectrIMG(5) verlangt diese Filterung ausdrücklich. Replay-Fenster werden wie das Bitmap erst mit einem veröffentlichten5-s-Batch weitergeschoben. Native Zähler-/Thread-Phasen und UI-Start-Gates bleiben rekonstruierte Annahmen.

Die Simulation bietet ausschliesslich das ursprüngliche pädagogische Spektrummodell und trägt keine iOS-Bezeichnung. Nur der Fallleser bietet die beiden Referenzen: empfangener iOS-DSA und berechneter Android-DSA. Eine gemeinsame Neuberechnung der synthetischen Signale und Indizes bleibt eine spätere Aufgabe.
