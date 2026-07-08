# Produktverstaendnis: Essenplanner

## Ausgangspunkt

Die App wird fuer zwei Personen gebaut: Buğra und Sena.

Aktuell wird Essen weitgehend spontan geplant. Es gibt eine Einkaufsliste in Apple Erinnerungen, und manchmal wird versucht, die Woche grob zu planen. Das funktioniert teilweise, ist aber noch kein verlaessliches System.

Der wichtigste Wunsch ist, den mentalen Aufwand rund um Essen stark zu reduzieren: weniger taegliches Nachdenken, weniger Diskussion, weniger spontane Notloesungen.

## Hauptprobleme

1. Ideenfindung kostet zu viel Kraft
   - Jeden Tag neu entscheiden zu muessen, was gegessen wird, ist stressig.
   - Es fehlt ein System, das automatisch passende, abwechslungsreiche Vorschlaege macht.

2. Einkaufen fuehlt sich ineffizient und teuer an
   - Es wird vermutlich mehr Geld ausgegeben als noetig.
   - Es entstehen unnoetige Einkaeufe und Lebensmittelverschwendung.
   - Eine bessere Planung soll helfen, zielgerichteter einzukaufen und weniger wegzuwerfen.

3. Wochenplanung ist noch nicht stabil
   - Es gibt Versuche, die Woche zu planen, aber keine dauerhafte Routine.
   - Die Loesung muss alltagstauglich sein und darf nicht zu viel Pflegeaufwand erzeugen.

## Zielbild

Eine Anwendung mit schoener UI und KI-Unterstuetzung, die:

- die Geschmaecker beider Personen kennt,
- persoenliche Ziele beruecksichtigt,
- abwechslungsreiche Wochenplaene erstellt,
- Mahlzeiten konkreten Tagen zuordnet,
- Zutaten fuer jede Mahlzeit kennt,
- daraus eine gute Einkaufsliste erzeugt,
- beim Sparen hilft,
- Lebensmittelverschwendung reduziert,
- flexibel genug fuer verschiedene Planungsarten bleibt.

Die verbindliche visuelle Grundrichtung ist in [Designrichtung: Command 01](./design-direction.md) festgehalten.

Geplant werden soll zunaechst eine komplette Woche mit drei Mahlzeiten pro Tag:

- Fruehstueck,
- Mittagessen,
- Abendessen.

Wenn spontan auswaerts gegessen wird, soll eine geplante Mahlzeit oder ein geplanter Tag ausfallen bzw. uebersprungen werden koennen. Auswaerts essen wird fuer den Start nicht aktiv eingeplant.

Die App soll nicht zwingend vollstaendige Rezepte verwalten. Fuer den ersten produktiven Nutzen reicht es, wenn pro Mahlzeit klar ist:

- Was wird gegessen?
- Fuer welchen Tag ist es geplant?
- Fuer welche Person(en) ist es geplant?
- In welchem Kontext wird es gegessen: zuhause, Office, unterwegs, Meal Prep?
- Welche Zutaten werden benoetigt?
- Was muss eingekauft werden?

## Personen und Ziele

### Buğra

- Ziel: proteinreiche Ernaehrung.
- Ziel: Muskelaufbau weiter vorantreiben.
- Ziel: leicht Gewicht zunehmen.

### Sena

- Ziel: Gewichtsabnahme.
- Hat eigene Lieblingsessenssorten und Praeferenzen.

### Gemeinsame Ziele

- weniger Entscheidungsstress,
- bessere Einkaufsplanung,
- geringere Kosten,
- weniger Lebensmittel wegwerfen,
- trotzdem flexibel und abwechslungsreich essen,
- Fleisch ist erlaubt und beide sind beim Essen relativ offen.

## Einkaufskontext

Aktuelle Laeden:

- Netto fuer normale Einkaeufe,
- Lidl teilweise fuer Wocheneinkauf.

Offene Frage: Ob eher ein grosser Wocheneinkauf bei Lidl oder mehrere kleinere Einkaeufe bei Netto sinnvoller sind, soll die App perspektivisch mitdenken koennen.

Wichtig ist besonders die Einkaufsliste, weil sie der Hebel fuer Budget, Planung und weniger Verschwendung ist.

Die KI soll von Anfang an direkt eine konkrete Einkaufsliste erzeugen. Es geht nicht darum, zuerst lange Einkaufshistorien aufzubauen. Der Zielablauf ist:

- Samstag bzw. vor dem Wocheneinkauf wird die naechste Woche geplant.
- Die App erzeugt Mahlzeiten fuer die Tage.
- Die App erzeugt daraus eine Einkaufsliste fuer die Woche.
- Die Einkaufsliste enthaelt grobe Mengenangaben.
- Die Mengen muessen alltagstauglich, aber nicht exakt wissenschaftlich sein.

Beispiel: Wenn fuer eine Mahlzeit 200 g Mehl gebraucht werden, ist klar, dass im Laden ggf. eine 500-g-Packung gekauft wird. Die App soll vor allem einen brauchbaren Leitfaden geben, damit das Noetigste zielgerichtet gekauft werden kann.

Aktuelles Einkaufsbudget:

- 500 EUR pro Monat.
- Das Budget muss nicht ausgereizt werden.
- Ziel ist ausdruecklich, moeglichst Geld zu sparen, ohne dass die Planung unpraktisch oder unattraktiv wird.

Bei vier Wochen entspricht das grob 125 EUR pro Woche. Bei durchschnittlich 4,33 Wochen pro Monat entspricht es grob 115 EUR pro Woche.

## Gewuenschte App-Rolle

Die App soll eher ein aktiver Assistent sein als nur eine manuelle Verwaltung.

Sie soll basierend auf Profilen, Zielen und Vorlieben Vorschlaege machen und daraus konkrete Plaene bauen. Der Nutzer soll nicht bei null anfangen muessen.

Gleichzeitig soll die App flexibel bleiben:

- nicht nur Meal Prep,
- nicht nur strikte Diaet,
- nicht nur Rezeptverwaltung,
- sondern ein alltagstaugliches Planungssystem.

Ein wichtiger Teil davon sind variable Wochenprofile. Vor der Wochenplanung soll eingetragen werden koennen, an welchen Tagen welche Person im Office ist. Daraus ergeben sich andere Anforderungen an Mahlzeiten:

- Office-Fruehstueck soll einfach vorzubereiten und gut transportierbar sein.
- Office-Mittagessen soll idealerweise als Meal Prep mitgenommen werden koennen.
- Fuer Montag bis Freitag soll eine einstellbare Anzahl unterschiedlicher Lunch-Batch-Gerichte reichen koennen, z. B. zwei Gerichte fuer die Arbeitswoche.
- Bei gemeinsamen Lunch-Batches duerfen Buğra und Sena unterschiedliche Portionsgroessen, Grammangaben und grobe kcal-Schaetzungen erhalten.
- Wenn Mitnehmen nicht klappt, kann Kantine oder auswaerts essen als spontane Alternative passieren.
- Homeoffice-Tage erlauben mehr Flexibilitaet bei Fruehstueck und Mittagessen.
- Abendessen ist die Hauptmahlzeit und soll als gemeinsames Essen geplant werden.
- Gemeinsame Abendessen duerfen bewusst fuer zwei aufeinanderfolgende Tage geplant werden, damit ein Kochlauf direkt einen Restetag abdeckt.

Die App sollte daher nicht nur Personenprofile, sondern auch Zeit- bzw. Tagesprofile kennen.

Der KI-Teil kann spaeter technisch unterschiedlich umgesetzt werden, z. B. ueber einen Agenten, ein LLM mit strukturierten Prompts oder eine andere Orchestrierung. Fachlich wichtig ist: Die KI muss nicht nur Gerichte vorschlagen, sondern strukturierte Ergebnisse liefern:

- Wochenplan,
- Mahlzeiten je Person und Kontext,
- Zutaten je Mahlzeit,
- konsolidierte Einkaufsliste mit groben Mengen.

## Moeglicher Zwischenstand

Falls eine komplette App am Anfang zu gross ist, ist auch ein Zwischenweg denkbar:

- Planung ueber Telegram,
- fuer einzelne Tage Gerichte vorschlagen,
- am Ende eine Einkaufsliste erzeugen,
- spaeter daraus eine vollwertige App bauen.

Das Ziel bleibt aber eine produktiv nutzbare Anwendung mit guter UI.

## Erste Produktprinzipien

- Die Einkaufsliste ist ein Kernfeature, kein Nebenprodukt.
- Die App soll Entscheidungen abnehmen, nicht neue Pflegearbeit erzeugen.
- Geschmack und Ziele muessen pro Person abbildbar sein.
- Mahlzeiten duerfen ohne vollstaendige Kochanleitung funktionieren.
- Planung muss flexibel genug fuer echte Wochen sein.
- Kosten, Wiederverwendung von Zutaten und Reste sollen bei der Planung eine Rolle spielen.

## Erste MVP-Idee

Ein sinnvoller erster MVP koennte bestehen aus:

1. Personenprofile
   - Ziele,
   - Vorlieben,
   - Abneigungen,
   - grobe Ernaehrungsrichtung.

2. Wochenkontext
   - pro Person einstellbar: Office oder Homeoffice je Tag,
   - daraus abgeleitete Mahlzeiten-Kontexte,
   - spontane Ausfaelle moeglich, wenn doch Kantine oder auswaerts gegessen wird.

3. Mahlzeiten-Datenbank
   - Name der Mahlzeit,
   - Zutaten,
   - Tags wie proteinreich, kalorienarm, schnell, Meal Prep, Fleisch, Office-geeignet, transportierbar,
   - grobe Eignung fuer beide Personen.

4. Wochenplan
   - Tage,
   - Mahlzeiten pro Tag,
   - ggf. pro Person unterschiedliche Mahlzeiten fuer Fruehstueck/Mittag,
   - gemeinsames Abendessen als Hauptmahlzeit,
   - manuell aenderbar,
   - KI-generiert oder KI-unterstuetzt.

5. Einkaufsliste
   - automatisch aus Wochenplan generiert,
   - Zutaten zusammengefasst,
   - Mengen soweit moeglich konsolidiert,
   - grobe Mengenangaben fuer den Wocheneinkauf,
   - alltagstaugliche Packungslogik perspektivisch denkbar,
   - optional nach Ladenbereich oder Einkauf sortiert.

6. KI-Planung
   - generiert Vorschlaege aus Profilen und Regeln,
   - achtet auf Abwechslung,
   - nutzt Zutaten mehrfach sinnvoll,
   - vermeidet zu teure oder verschwenderische Plaene.

## Noch offene Fragen

### Planungsumfang

- Snacks sind noch offen.
- Es gibt typischerweise zwei Homeoffice-Tage pro Woche, aber die Tage sind variabel.
- Es gibt keine festen Auswaerts-Essen-Tage.
- Fuer den Start soll eine ganze Woche geplant werden.
- Vor der Wochenplanung soll eingetragen werden, wer an welchen Tagen im Office ist.
- An Nicht-Homeoffice-Tagen wird aktuell versucht, Essen mitzunehmen.
- Wenn Mitnehmen nicht klappt, wird Kantine oder auswaerts gegessen.

### Einkaufslogik

- Soll die App Preise aktiv erfassen oder erst einmal nur sparsames Planen unterstuetzen?
- Gibt es ein Wochenbudget oder eine Zielspanne?
- Sollen Vorratszutaten wie Reis, Nudeln, Gewuerze, Oel und TK-Ware verwaltet werden?
- Soll die Einkaufsliste mit Apple Erinnerungen synchronisiert werden oder reicht zunaechst eine eigene Liste?

### Personalisierung

- Welche Gerichte esst ihr sehr gerne?
- Es gibt aktuell keine konkreten No-Gos bei Mahlzeiten.
- Welche Zutaten sind klare No-Gos?
- Welche Kuechenrichtungen moegt ihr besonders?
- Wie wichtig sind Makros, Kalorien und Portionsgroessen?

### Alltag

- Wie viel Kochzeit ist unter der Woche realistisch?
- Wie viel darf am Wochenende gekocht werden?
- Wie oft sollen Reste eingeplant werden?
- Wie viel Wiederholung ist okay, bevor es langweilig wird?

## Naechster Schritt

Als Naechstes sollte der reale Wochenalltag verstanden werden:

- typische Arbeitstage,
- wann gekocht wird,
- welche Mahlzeiten wirklich geplant werden muessen,
- welche Lieblingsgerichte schon existieren,
- welche Einkaufs- und Budgetziele realistisch sind.

Danach kann daraus ein konkreter MVP-Scope mit Datenmodell und erster UI-Struktur entstehen.
