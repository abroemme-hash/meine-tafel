# Meine digitale Tafel – Funktionsübersicht

Legende: ✔ voll machbar · ◐ eingeschränkt · ✘ nicht möglich
Priorität: **+** wichtig (MVP) · **o** nützlich (später) · **-** verzichtbar

## 1. Zeichnen & Schreiben
| Funktion | Web | App | Prio |
|---|---|---|---|
| Freihandstift (Farbe, Dicke) | ✔ | ✔ | + |
| Radierer (Strich / Fläche) | ✔ | ✔ | + |
| Rückgängig / Wiederholen | ✔ | ✔ | + |
| Textmarker (halbtransparent) | ✔ | ✔ | + |
| Touch- und Stiftbedienung, Multitouch (Zoomen/Verschieben) | ✔ | ✔ | + |
| Druckempfindlicher Stift | ◐ (Pointer Events) | ✔ | o |
| Handflächenerkennung (Palm Rejection) | ◐ | ◐ | o |
| Formerkennung (krakeliger Kreis → Kreis) | ✔ | ✔ | o |
| Handschrift → Text | ◐ (Bibliothek/KI) | ◐ | - |
| Lasso-Auswahl, Verschieben, Skalieren, Drehen | ✔ | ✔ | + |
| Laserpointer / Spotlight | ✔ | ✔ | o |

## 2. Objekte & Inhalte
| Funktion | Web | App | Prio |
|---|---|---|---|
| Formen, Linien, Pfeile | ✔ | ✔ | + |
| Textfelder | ✔ | ✔ | + |
| Bilder einfügen (Upload, Einfügen aus Zwischenablage) | ✔ | ✔ | + |
| PDF importieren und beschriften | ✔ | ✔ | + |
| Haftnotizen | ✔ | ✔ | o |
| Mathe/Lineal/Geodreieck/Zirkel, Koordinatensystem | ✔ | ✔ | + |
| Formeln (LaTeX) | ✔ | ✔ | o |
| Hintergründe (kariert, liniert, Notenlinien, Karten) | ✔ | ✔ | + |
| Videos / Audio einbetten | ✔ | ✔ | o |
| Webseiten / Widgets einbetten | ◐ (iframe-Sperren) | ✔ | o |
| Mindmap, Tabellen, Diagramme | ✔ | ✔ | - |
| Ebenen, Gruppieren, Sperren | ✔ | ✔ | o |

## 3. Seiten & Navigation
| Funktion | Web | App | Prio |
|---|---|---|---|
| Mehrere Seiten, Miniaturansicht, Reihenfolge | ✔ | ✔ | + |
| Unendliche Leinwand mit Zoom | ✔ | ✔ | o |
| Vollbild / Kioskmodus | ✔ | ✔ | + |
| Große, fingerfreundliche Bedienleiste (verschiebbar, links/rechts) | ✔ | ✔ | + |
| Vorhang / Abdeckung, Aufdecken | ✔ | ✔ | o |
| Dunkelmodus, Schultafel-Look | ✔ | ✔ | o |

## 4. Unterrichtswerkzeuge
| Funktion | Web | App | Prio |
|---|---|---|---|
| Timer, Stoppuhr, Ampel | ✔ | ✔ | + |
| Zufallsgenerator (Namen, Würfel, Gruppen) | ✔ | ✔ | o |
| Sitzplan / Klassenliste | ✔ | ✔ | o |
| Umfrage / Quiz mit QR-Code (Schüler-Geräte) | ✔ (braucht Server) | ✔ (braucht Server) | o |
| Vorlagen (Tafelbilder, Raster, Arbeitsblätter) | ✔ | ✔ | o |
| Mediathek / Bausteinsammlung (Bilder, Grafiken) | ✔ | ✔ | o |

## 5. Speichern & Teilen
| Funktion | Web | App | Prio |
|---|---|---|---|
| Automatisches Speichern (lokal im Browser) | ✔ | ✔ | + |
| Speichern/Laden als Datei | ◐ (Download/Upload, File System Access API nur Chromium) | ✔ | + |
| Export als PDF / PNG | ✔ | ✔ | + |
| Cloud-Speicher (eigenes Konto, Schul-Cloud, Nextcloud) | ✔ (braucht Server) | ✔ (braucht Server) | o |
| Teilen per Link / QR-Code | ✔ (braucht Server) | ◐ | o |
| Echtzeit-Zusammenarbeit (mehrere Nutzer) | ✔ (braucht Server) | ✔ (braucht Server) | - |
| Offline-Nutzung | ◐ (als PWA) | ✔ | o |
| Vollständiger Offline-Betrieb ohne Installation | ✘ | ✔ | o |

## 6. System & Betrieb an der Schule
| Funktion | Web | App | Prio |
|---|---|---|---|
| Läuft auf jedem Board ohne Installation (nur Browser) | ✔ | ✘ | + |
| Läuft auf Windows/Android/Linux-Boards | ✔ | ◐ (je Plattform bauen) | + |
| Bildschirm über beliebigen Programmen beschriften (Overlay) | ✘ | ✔ | o |
| Bildschirmaufnahme / Unterrichtsvideo | ◐ (Bildschirmaufnahme-API) | ✔ | - |
| Globale Tastenkürzel | ✘ | ✔ | - |
| Mehrere Fenster / 2. Bildschirm | ◐ | ✔ | - |
| Zugriff aufs lokale Dateisystem | ◐ | ✔ | o |
| Automatische Updates | ✔ (immer aktuell) | ◐ | + |
| Datenschutz: keine Konten, keine Schülerdaten (DSGVO) | ✔ | ✔ | + |
| Anmeldung / Lehrer-Profil | ✔ (braucht Server) | ✔ (braucht Server) | - |

## Empfehlung
1. **Zuerst die Web-Version** (PWA): läuft auf allen Boards ohne Installation, ein Update für alle.
2. **App-Version als Hülle um dieselbe Web-Version** (Electron oder Tauri): der Mehraufwand ist gering, der Gewinn sind Offline-Betrieb, Dateizugriff und Bildschirm-Overlay.
3. **MVP (alle „+")**: Stift, Radierer, Rückgängig, Formen, Text, Bilder, PDF, Seiten, Lineal/Geodreieck, Hintergründe, Timer, Autospeichern, Datei/PDF-Export, Vollbild.

## Quellen
- [OpenBoard (Features)](https://itsfoss.com/openboard/)
- [OpenBoard (Offizielle Seite)](https://openboard.ch/en)
- [Online-Whiteboards 2026 im Vergleich](https://www.goodnotes.com/blog/best-online-whiteboard-apps)
- [Whiteboard-Software im Vergleich (OMR)](https://omr.com/de/reviews/category/whiteboard)
- [Zoom Whiteboard](https://www.zoom.com/en/products/online-whiteboard/solutions/)
- [Online-Whiteboard-Funktionen (Atlassian)](https://www.atlassian.com/work-management/project-management/online-whiteboards)
- [ViewSonic Whiteboard Funktionen](https://www.viewsonic.com/solution/kb/de_DE/whiteboard-working-area/wb-features-comparison1)
