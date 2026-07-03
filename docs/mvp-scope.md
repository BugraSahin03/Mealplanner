# MVP-Scope

Dieses Dokument beschreibt den ersten produktiv nutzbaren Stand der App.

## Ziel des MVP

Der MVP soll am Samstag oder vor dem Wocheneinkauf aus Profilen und Wochenkontext einen kompletten Plan fuer die naechste Woche erzeugen und daraus direkt eine brauchbare Einkaufsliste ableiten.

Der MVP ist erfolgreich, wenn Buğra und Sena damit eine Woche planen und danach mit der erzeugten Liste einkaufen koennen, ohne jeden Tag neu entscheiden zu muessen, was gegessen wird.

## Muss-Funktionen

### 1. Profile

Es gibt zwei Profile:

- Buğra,
- Sena.

Je Profil sollen mindestens gespeichert werden:

- Ziel,
- Tageskalorienziel als grober Richtwert,
- optionale Lieblingsgerichte,
- optionale Vorlieben,
- optionale Abneigungen,
- Hinweise fuer Fruehstueck, Mittagessen und Abendessen.

Beispiele fuer Ziele:

- Muskelaufbau,
- Gewichtszunahme,
- Fettverlust,
- Gewichtsabnahme,
- Gewicht halten.

Das Tageskalorienziel ist kein exakter medizinischer Wert, sondern eine Orientierung fuer die KI. Wenn Lieblingsgerichte nicht gepflegt sind, soll die KI frei passende Mahlzeiten fuer Ziel und Kalorienrahmen vorschlagen koennen.

### 2. Wochenkontext

Vor der Planung wird fuer jeden Tag der kommenden Woche eingetragen:

- ob Buğra im Office oder Homeoffice ist,
- ob Sena im Office oder Homeoffice ist.

Diese Angaben beeinflussen Fruehstueck und Mittagessen.

Der Wochenkontext soll als Kalenderwochen-Setup gedacht werden:

- Das Jahr ist in Kalenderwochen gegliedert.
- Pro Kalenderwoche wird festgelegt, welche Tage Homeoffice- bzw. Office-Tage sind.
- Standardannahme sind zwei Homeoffice-Tage pro Person und Woche.
- Die Anzahl soll pro Woche flexibel per Plus/Minus erhoeht oder reduziert werden koennen.
- Zielbild ist eine Drag-and-Drop-artige UI, in der Homeoffice-Tage auf konkrete Tage gelegt und verschoben werden koennen.
- Diese Auswahl wird als Input an die KI gegeben und beeinflusst besonders Fruehstueck und Mittagessen.

### 3. Wochenplan

Die App plant sieben Tage mit:

- Fruehstueck,
- Mittagessen,
- Abendessen.

Abendessen ist normalerweise die gemeinsame Hauptmahlzeit. Fruehstueck und Mittagessen koennen je nach Office/Homeoffice-Kontext pro Person unterschiedlich sein.

### 4. KI-Planung

Die KI soll strukturierte Planungsergebnisse erzeugen:

- Mahlzeiten fuer die Woche,
- Zuordnung zu Tagen,
- Zuordnung zu Personen, falls relevant,
- Zutaten je Mahlzeit,
- grobe Mengen je Zutat.

Die KI muss fuer den MVP keine perfekte Optimierung erreichen. Wichtig ist ein brauchbarer, konkreter Plan.

### 5. Einkaufsliste

Die Einkaufsliste ist ein Muss-Feature im MVP.

Sie soll:

- automatisch aus dem Wochenplan entstehen,
- Zutaten zusammenfassen,
- grobe Mengen enthalten,
- fuer den Wocheneinkauf nutzbar sein,
- helfen, nur das Noetige zu kaufen.

Die Mengen muessen nicht exakt sein. Die App darf z. B. mit Kochmengen arbeiten, auch wenn im Supermarkt groessere Packungen gekauft werden.

## Nicht im ersten MVP

- Einkaufshistorie,
- automatische Preisvergleiche,
- Supermarkt-API-Integration,
- exakte Kalorien- oder Makroberechnung,
- vollstaendige Rezeptverwaltung,
- Vorratsverwaltung mit Bestandsmengen,
- automatische Apple-Erinnerungen-Synchronisierung.
- Ausfall-Tracking fuer Mahlzeiten.

Diese Themen bleiben moegliche Ausbaustufen.

## Bewusste MVP-Entscheidung: kein Ausfall-Tracking

Wenn spontan eine Mahlzeit ausfaellt, z. B. durch Kantine oder Restaurant, muss das im MVP nicht in der App markiert werden.

Begruendung:

- Die App soll zuerst Planung und Einkauf vereinfachen.
- Ausfaelle koennen im Alltag ausserhalb der App passieren.
- Das Monitoring wuerde zusaetzliche Pflegearbeit erzeugen.
- Die Einkaufsliste bleibt trotzdem als Wochenleitfaden nuetzlich.

Spaeter kann optional eine einfache Ausfall- oder Restelogik hinzukommen, falls sich zeigt, dass dadurch wirklich weniger verschwendet wird.

## Technische Leitidee

Die KI-Komponente soll von Anfang an strukturierte Daten liefern, nicht nur Freitext.

Ein moeglicher Ablauf:

1. Profile und Wochenkontext werden gesammelt.
2. Die KI erzeugt einen Wochenplan als strukturierte Daten.
3. Die App prueft und speichert den Plan.
4. Die Einkaufsliste wird aus den Zutaten konsolidiert.
5. Der Nutzer kann Plan und Liste manuell anpassen.

Ob dahinter ein Agent, ein einzelner LLM-Aufruf oder eine spaetere Orchestrierung steckt, ist eine technische Entscheidung. Fuer das Produkt ist entscheidend, dass die Ausgabe verlaesslich strukturiert und editierbar ist.

Der Planner-Vertrag ist in `docs/planner-contract.md` beschrieben.

Maschinenlesbare Schemas:

- `schemas/profile.schema.json`
- `schemas/planner-request.schema.json`
- `schemas/planner-response.schema.json`

Die lebende Profil-Memory ist in `docs/profile-memory.md` beschrieben.

## Erste Screen-Reihenfolge

Die ersten Screens sollen in dieser Reihenfolge entstehen:

1. Profile
2. Kalenderwochen-/Wochen-Setup
3. Wochenplan
4. Einkaufsliste

Die Reihenfolge folgt dem Planungsfluss: erst Personeninformationen, dann Wochenkontext, dann Planerzeugung, dann Einkauf.
