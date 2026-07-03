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

### Abendessen

Abendessen ist die Hauptmahlzeit.

Eigenschaften:

- gemeinsames Essen fuer beide,
- groessere Variation,
- groesserer Einfluss auf Einkaufsliste,
- potenziell gute Quelle fuer Reste oder Meal Prep am naechsten Tag.

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
