# Planungsmodell

Dieses Dokument beschreibt die erste fachliche Struktur fuer die Wochenplanung.

## Grundidee

Die App plant nicht nur Mahlzeiten fuer Tage, sondern passende Mahlzeiten fuer:

- Personen,
- Tageskontext,
- Mahlzeitentyp,
- persoenliche Ziele,
- Einkaufs- und Budgetlogik.

Damit kann dieselbe Mahlzeit je nach Situation passend oder unpassend sein. Skyr mit Haferflocken kann zum Beispiel fuer einen Office-Morgen sehr gut funktionieren, waehrend ein aufwendiges warmes Fruehstueck dort unpraktisch waere.

## Personen

Fuer den Start gibt es zwei Personen:

- Buğra,
- Sena.

Pro Person sollen spaeter gespeichert werden:

- Ziel,
- Vorlieben,
- Abneigungen,
- bevorzugte Portionsgroesse,
- Makro- oder Kalorienfokus,
- Mahlzeiten, die gut funktionieren,
- Mahlzeiten, die nicht gut funktionieren.

## Wochenkontext

Vor jeder Wochenplanung soll eingetragen werden:

- welche Person an welchem Tag im Office ist,
- welche Person an welchem Tag im Homeoffice ist,
- ob es besondere Termine oder Einschraenkungen gibt.

Die Tage sind nicht fest, sondern variabel. Deshalb darf die App nicht von festen Homeoffice-Tagen ausgehen.

## Mahlzeitentypen

### Fruehstueck

Fruehstueck soll je nach Tageskontext geplant werden.

Office-Tage:

- einfach vorzubereiten,
- gut transportierbar,
- idealerweise schnell essbar,
- z. B. Skyr, Haferflocken, Proteinpulver als moegliches Beispiel.

Homeoffice-Tage:

- flexibler,
- kann zuhause gegessen werden,
- darf etwas mehr Zubereitung erlauben.

### Mittagessen

Office-Tage:

- Meal Prep ist gern gesehen,
- Essen soll mitgenommen werden koennen,
- Kantine oder auswaerts essen ist eine spontane Ausweichoption.

Homeoffice-Tage:

- kann frisch gemacht oder vorbereitet sein,
- kann Reste vom Abendessen nutzen.

Lunch-Batch-Prep:

- fuer Montag bis Freitag kann eine Zielanzahl unterschiedlicher Lunch-Gerichte gesetzt werden,
- Standard sind zwei verschiedene Lunch-Gerichte pro Arbeitswoche,
- die Gerichte werden ueber die Werktage verteilt,
- Buğra und Sena koennen dasselbe Batch-Gericht bekommen, aber mit unterschiedlichen Gramm- und Kalorien-Schaetzungen,
- der Koch- oder Prep-Tag wird nicht im Wochenplan festgelegt.

### Abendessen

Abendessen ist die Hauptmahlzeit.

Eigenschaften:

- gemeinsames Essen fuer beide,
- groessere Variation,
- groesserer Einfluss auf Einkaufsliste,
- potenziell gute Quelle fuer Reste oder Meal Prep am naechsten Tag.

Dinner-Resteplanung:

- gemeinsame Abendessen sollen bei aktiver Regel bewusst fuer aufeinanderfolgende Tage geplant werden,
- Standard ist ein Kochlauf fuer zwei Abendessen, z. B. Montag frisch und Dienstag Restetag,
- zusammengehoerende Dinner erhalten eine stabile Gruppe,
- die UI kann frisch gekocht und Restetag sichtbar machen,
- echte Restebestaende oder ein nachtraegliches Tracking sind nicht Teil des MVP.

## Mahlzeiten-Kontexte

Eine Mahlzeit sollte spaeter Tags oder Eigenschaften haben wie:

- Office-geeignet,
- transportierbar,
- Meal Prep,
- schnell,
- proteinreich,
- kalorienarm,
- guenstig,
- gut fuer Reste,
- gemeinsames Abendessen,
- Einzelportion moeglich.

## Planungslogik

Die KI bzw. Planungslogik sollte beim Erstellen einer Woche:

- Office- und Homeoffice-Tage pro Person beachten,
- Fruehstueck und Mittag ggf. pro Person unterschiedlich planen,
- die dynamische Lunch-Batch-Anzahl fuer Montag bis Freitag beachten,
- gemeinsame Abendessen als Fresh/Rest-Paare fuer aufeinanderfolgende Tage planen,
- Abendessen eher gemeinsam planen,
- Meal Prep fuer Office-Tage bevorzugen,
- Zutaten mehrfach sinnvoll verwenden,
- nicht zu viel verderbliche Ware einplanen,
- Einkaufsliste konsolidieren,
- Budget im Blick behalten.

## Spontane Ausfaelle

Wenn eine geplante Mahlzeit ausfaellt, z. B. wegen Kantine oder auswaerts essen, muss das im MVP nicht in der App markiert werden.

Das ist eine bewusste Vereinfachung:

- Der erste Nutzen liegt in Wochenplanung und Einkaufsliste.
- Ausfaelle koennen im Alltag ausserhalb der App passieren.
- Es entsteht kein zusaetzlicher Pflegeaufwand.

Perspektivisch kann Ausfall- oder Restetracking spaeter dazukommen, falls es fuer weniger Verschwendung wirklich hilft.

## Persistenzmodell fuer den MVP

Die erste Persistenzschicht bildet die Planungsobjekte in SQLite ab. Sie ist bewusst klein gehalten und soll vor allem die spaetere OpenClaw-Antwort sauber speichern koennen.

Kernobjekte:

- `profiles`: genau die zwei MVP-Profile `bugra` und `sena` mit Ziel, groben Kalorien, strukturierten Praeferenzen und optionalem Markdown-Snapshot aus der Profil-Memory.
- `week_contexts`: eine konkrete Planungswoche mit optionalem Startdatum und Notizen.
- `week_context_person_days`: Office/Home/Away/Flex-Kontext pro Tag und Person.
- `planner_jobs`: laenger laufende Planungsauftraege mit Status `idle`, `running`, `success` oder `failed`.
- `week_plans`: gespeicherte Planner-Antworten mit Plan-Payload und konsolidierter Einkaufsliste als JSON.
- `planned_meals`: kleine, abfragbare Mahlzeitenprojektion je Plan, Tag, Typ, Kontext und Personen/Zutaten-JSON.
- `shopping_items`: kleine, abfragbare Einkaufslistenprojektion je Plan mit Menge, Einheit, Kategorie und Quellen.

Die App speichert die vollstaendige Planner-Antwort weiterhin als JSON nach `schemas/planner-response.schema.json`. Die zusaetzlichen Tabellen fuer Mahlzeiten und Einkaufsposten sind eine pragmatische Projektion fuer UI, Tests und spaetere Abfragen, nicht die neue fachliche Quelle der Wahrheit.

Fuer EP-002 wird die SQLite-Anbindung ohne neue npm-Abhaengigkeit ueber `node:sqlite` umgesetzt, weil das Ticket keinen Write-Scope fuer `package.json` enthaelt. Diese Node-Schnittstelle ist in der lokalen Node-Version verfuegbar, aber noch experimentell. Falls sich das im Betrieb als zu riskant erweist, sollte ein Folgeticket den Wechsel auf die BudgetBuddy-nahe `better-sqlite3`-Abhaengigkeit inklusive `package.json`-Scope vorsehen.
