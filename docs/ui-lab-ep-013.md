# EP-013 UI-Lab

EP-013 lieferte eine interne Preview-Seite unter `/ui-lab`. Die Route wurde nach der Entscheidung wieder entfernt. Die dauerhafte Designentscheidung steht in [Designrichtung: Command 01](./design-direction.md).

## Entscheidung

Command 01: `Command Center` ist als verbindliche visuelle Grundlage ausgewaehlt.
Diese Designsprache soll fuer kuenftige und bestehende Screens herangezogen werden.
Die konkrete Anordnung und Funktionalitaet der echten App-Screens wird pro Folgeticket
besprochen und nicht blind aus dem UI-Lab uebernommen.

Leitplanken fuer die Designsprache:

- dunkle, produktive Arbeitsflaeche statt heller Kalender-/Admin-Anmutung,
- klare Statusachsen fuer Planner, Woche, Einkauf und Profile,
- kompakte operative Module statt ueberladener Kartenlisten,
- helle Akzentaktionen fuer primaere naechste Schritte,
- reduzierte Radien und ruhige, dichte Layouts.

## Varianten

### Command 01: Command Center

Ausgewaehlt. Operativ, dunkel, cockpitartig. Diese Richtung stellt die naechste Entscheidung, Planner-Status, Homeoffice-Slots, Wochen-Timeline und Einkauf nebeneinander. Sie ist am staerksten produktiv und am weitesten weg vom aktuellen Seitenleisten-Layout.

### Command 02: Ops Board

Ebenfalls operativ, aber anders aufgebaut: eine linke Rail, ein grosses Kontrollboard, Kanban-artige Planungsbereiche und eine Einkaufs-Kontrollspalte. Diese Richtung fuehlt sich mehr nach Leitstand und weniger nach Dashboard-Karten an.

### Command 03: Mission Map

Command-Charakter, aber als Ablaufkarte statt Kalender. Die Woche wird als Prozess mit Stationen gedacht: Pruefung, Einkauf, Kochen, Resteverwertung. Gut, wenn Essenplanner sich wie eine gefuehrte Planung anfuehlen soll.

### Market 01: Market Mobile

Mobile-first und einkaufsgetrieben. Diese Richtung stellt die Einkaufssituation und den naechsten Schritt in den Vordergrund. Wochenplan und Profile sind kompakter und dienen der Einkaufsliste zu.

### Market 02: Swipe Flow

Mobile-first wie eine Task-App. Immer eine Karte im Fokus, die naechste Einkaufsaktion steht gross im Vordergrund. Wochenplan und Kontext laufen daneben als kompakte Orientierung.

### Market 03: Shelf Mode

Einkaufslogik als Ladenstruktur: Bereiche, Gaenge und relevante Artikel bilden die Navigation. Diese Richtung ist am staerksten vom Kalender geloest.

## Empfehlung

Die Entscheidung ist getroffen: `Command Center` ist der robuste MVP-Pfad fuer die visuelle App-Richtung, weil Dashboard, Planner-Job, Wochenplan und Einkauf getrennt, aber auf einer Arbeitsflaeche sichtbar sind.

## Sinnvolle Folgetickets

1. Dashboard finalisieren.
2. App-Shell und Navigation auf die gewaehlte Richtung umstellen.
3. Wochenplan-UI mit Mahlzeitenkarten und Detaildialogen finalisieren.
4. Einkaufsliste als eigene Seite bauen.
5. Profile visuell an die neue Designsprache angleichen.
6. Mobile Visual QA fuer Dashboard, Wochenplan und Einkaufsliste.
