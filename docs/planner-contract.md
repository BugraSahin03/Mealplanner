# Planner Contract

Dieses Dokument beschreibt die gemeinsame Sprache zwischen Essenplanner-App und OpenClaw fuer konkrete Planungsauftraege und Planungsergebnisse.

## Grundsatz

Das Planner-JSON ist ein versionierter Vertrag.

Es ist wichtig genug, um stabil zu sein, aber es ist nicht fuer immer eingefroren. Wir planen bewusst ein, dass waehrend der Entwicklung neue Ideen entstehen.

Das maschinenlesbare Response-Schema liegt hier:

```text
schemas/planner-response.schema.json
```

Weitere verwandte Schemas:

```text
schemas/profile.schema.json
schemas/planner-request.schema.json
```

Die Profil-Memory ist separat beschrieben in:

```text
docs/profile-memory.md
```

## Warum Versionierung wichtig ist

Die App speichert Plaene, zeigt sie in der UI an und erzeugt Einkaufslisten daraus. Wenn sich die Struktur unkontrolliert aendert, brechen UI, Validierung oder spaetere Migrationen.

Deshalb enthaelt jede Planner-Antwort:

```json
{
  "schemaVersion": "1.0"
}
```

Die App kann dadurch spaeter unterscheiden:

- alter Plan nach v1.0,
- neuer Plan nach v1.1,
- groesserer Bruch nach v2.0.

## Evolution-Regeln

### Patch / kompatible Aenderung

Erlaubt innerhalb von `1.0` oder als `1.1`:

- optionale Felder hinzufuegen,
- neue Tags erlauben,
- neue optionale Notizen hinzufuegen,
- neue Einkaufslisten-Hinweise hinzufuegen.

Beispiel:

- `buyingHint` fuer Packungsgroessen,
- `plannerNotes`,
- `warnings`.

### Minor Version

Nutzen wir fuer abwaertskompatible Erweiterungen, die die App bewusst kennen soll.

Beispiel:

- `schemaVersion: "1.1"`
- neue optionale Felder fuer Vorrat oder Budget.

### Major Version

Nutzen wir, wenn bestehende Felder anders heissen, anders typisiert werden oder Pflichtfelder verschwinden.

Beispiel:

- `ingredients` wird fundamental anders modelliert,
- Shopping-Liste wird in mehrere Einkaeufe aufgeteilt,
- Personenstruktur wird komplett geaendert.

Dann braucht die App eine Migration oder einen separaten Parser.

## MVP-Antwortstruktur

Eine OpenClaw-Antwort soll fuer den MVP so aussehen:

```json
{
  "schemaVersion": "1.0",
  "plan": {
    "title": "Wochenplan",
    "summary": "Kurzbeschreibung",
    "days": []
  },
  "shoppingList": [],
  "plannerNotes": [],
  "warnings": []
}
```

## Request vs. Response vs. Profile

Es gibt bewusst drei getrennte Strukturen:

- `profile.schema.json`: langfristige Profilinformationen je Person.
- `planner-request.schema.json`: konkreter Auftrag an OpenClaw fuer eine Woche.
- `planner-response.schema.json`: konkretes Ergebnis von OpenClaw.

Diese Trennung verhindert, dass ein Wochenplan versehentlich zur dauerhaften Profilwahrheit wird.

Pflicht:

- `schemaVersion`
- `plan.days`
- `shoppingList`

Optional:

- `plan.title`
- `plan.summary`
- `plannerNotes`
- `warnings`

## Tagesstruktur

Ein Tag enthaelt:

- `dayId`
- `date` optional,
- `weekday`,
- `meals`.

`date` ist optional, weil wir am Anfang auch abstrakt Montag bis Sonntag planen koennen. Sobald die App echte Wochen startet, kann sie konkrete ISO-Daten verwenden.

## Mahlzeitenstruktur

Eine Mahlzeit enthaelt:

- `mealId`,
- `mealType`,
- `title`,
- `people`,
- `context`,
- `ingredients`.

`mealType`:

- `breakfast`,
- `lunch`,
- `dinner`,
- `snack`.

`context`:

- `office`,
- `home`,
- `shared`,
- `meal_prep`,
- `flex`.

Fuer den MVP planen wir primaer:

- Fruehstueck,
- Mittagessen,
- Abendessen.

Snacks sind im Schema erlaubt, aber muessen nicht genutzt werden.

## Personen

Personen werden mit stabilen IDs referenziert:

- `bugra`
- `sena`

Die Anzeige in der UI kann daraus `Buğra` und `Sena` machen.

Warum IDs statt Namen?

- stabiler fuer Code,
- keine Probleme mit Sonderzeichen,
- spaeter leichter migrierbar.

## Zutaten

Zutaten haben:

- `name`,
- `amount`,
- `unit`,
- optionale Kategorie,
- optionale Hinweise.

Mengen sind pragmatische Kochmengen, keine perfekte Einkaufsrealitaet.

Beispiel:

```json
{
  "name": "Haferflocken",
  "amount": 120,
  "unit": "g",
  "category": "dry_goods"
}
```

## Einkaufsliste

Die Einkaufsliste wird von OpenClaw bereits konsolidiert geliefert, aber die App darf spaeter zusaetzlich nachkonsolidieren.

Ein Einkaufsposten kann enthalten:

- `sourceMealIds`, um zu sehen, aus welchen Mahlzeiten er kommt,
- `buyingHint`, z. B. "500-g-Packung kaufen",
- `pantryItem`, z. B. fuer Salz, Oel, Gewuerze,
- `category`, fuer Gruppierung in der UI.

## Bewusste Flexibilitaet

Dieses Schema laesst bewusst optionale Felder fuer spaetere Ausbaustufen zu:

- grobe Naehrwerte,
- Meal-Prep-Hinweise,
- Packungsgroessen,
- Vorrats-/Pantry-Hinweise,
- Warnungen der KI,
- Planungsnotizen.

Nicht alles davon muss im MVP angezeigt werden.

## Was die App tun muss

Die App sollte jede OpenClaw-Antwort so behandeln:

1. `payloads[0].text` aus OpenClaw lesen.
2. JSON parsen.
3. Gegen `schemas/planner-response.schema.json` validieren.
4. Bei Fehlern die Antwort nicht speichern.
5. Optional einen Reparaturprompt an OpenClaw schicken.
6. Erst nach erfolgreicher Validierung speichern und anzeigen.

## App-Adapter im MVP

Die App kapselt die Planerzeugung hinter einem `PlannerAdapter`.

- `FixturePlannerAdapter` liefert fuer lokale Entwicklung einen validierten Beispielplan.
- `OpenClawCliPlannerAdapter` baut aus Planner-Request und Response-Schema einen Prompt, ruft `openclaw agent` auf und liest `payloads[0].text`.
- `ESSENPLANNER_PLANNER_ADAPTER=openclaw-cli` aktiviert den CLI-Adapter serverseitig.
- Ohne Konfiguration bleibt der Fixture-Adapter aktiv, damit lokale Entwicklung nicht von OpenClaw abhaengt.

Jede Adapter-Antwort wird vor dem Speichern gegen `schemas/planner-response.schema.json` validiert. Invalide Antworten setzen den Job auf `failed` und werden nicht in `response_json` gespeichert.

## Naechster Schritt

Als Naechstes sollte ein OpenClaw-Test mit genau diesem Schema laufen.

Wenn OpenClaw wiederholt valide Antworten liefert, kann die App-Implementierung starten.
