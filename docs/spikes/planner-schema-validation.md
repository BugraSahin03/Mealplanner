# Spike: Planner Schema Validation

Datum: 2026-07-03

## Ziel

Pruefen, ob OpenClaw auf Hetzner einen Essenplanner-Plan erzeugen kann, der gegen unser neues `planner-response.schema.json` validiert.

Damit testen wir die zentrale technische Kette:

```text
planner-request JSON
  -> Prompt an OpenClaw auf Hetzner
  -> gpt-5.5
  -> OpenClaw payloads[0].text
  -> JSON parse
  -> planner-response.schema.json validation
```

## Warum dieser Test wichtig ist

Die App soll nicht mit Freitext arbeiten. Sie braucht verlaesslich strukturierte Daten:

- Tage,
- Mahlzeiten,
- Personen,
- Kontext,
- Zutaten,
- Einkaufsliste,
- IDs zur Zuordnung.

Wenn OpenClaw keine valide Antwort nach Schema erzeugt, wuerde die spaetere App-Integration unsicher werden.

## Testartefakte

Angelegt:

- `fixtures/planner-request.sample.json`
- `scripts/build-planner-test-prompt.mjs`
- `scripts/validate-openclaw-planner-response.mjs`
- `package.json`

Genutzte Schemas:

- `schemas/profile.schema.json`
- `schemas/planner-request.schema.json`
- `schemas/planner-response.schema.json`

## Test 1: Schemas und Request validieren

Ergebnis:

- `profile.schema.json` parsebar.
- `planner-request.schema.json` parsebar.
- `planner-response.schema.json` parsebar.
- `fixtures/planner-request.sample.json` validiert gegen `planner-request.schema.json`.

## Test 2: Prompt bauen

Der Prompt wird generiert aus:

- Response-Schema,
- Beispiel-Request,
- Planungsregeln.

Ergebnis:

- Prompt wurde erfolgreich gebaut.
- Groesse: ca. 10.670 Zeichen.

## Test 3: OpenClaw auf Hetzner

Kommando sinngemaess:

```bash
openclaw agent \
  --local \
  --agent main \
  --session-key essenplanner:schema-test:20260703 \
  --message-file /tmp/essenplanner-planner-test-prompt.md \
  --json \
  --timeout 300 \
  --thinking low
```

Ergebnis:

- OpenClaw lief auf Hetzner.
- Modell: `gpt-5.5`.
- OpenClaw erzeugte eine JSON-Antwort in `payloads[0].text`.

## Test 4: Response validieren

Validator:

```bash
npm run validate:planner-response -- /tmp/essenplanner-openclaw-schema-test-output.jsonl
```

Ergebnis:

```text
planner-response valid
{
  "dayCount": 1,
  "mealCount": 5,
  "shoppingCount": 30
}
```

## Inhaltliche Kurzpruefung

OpenClaw erzeugte:

- 1 Tag,
- 5 Mahlzeiten,
- getrenntes Fruehstueck fuer Buğra und Sena,
- getrenntes Mittagessen fuer Buğra und Sena,
- gemeinsames Abendessen,
- konsolidierte Einkaufsliste mit 30 Positionen.

Beispielmahlzeiten:

- Buğra: Protein overnight oats with berries.
- Sena: Greek yogurt bowl with berries and oats.
- Buğra Lunch: Chicken rice meal-prep bowl.
- Sena Lunch: Tuna chickpea salad plate.
- Dinner: Turkey tomato pasta with side salad.

Die Einkaufsliste enthielt unter anderem:

- `sourceMealIds`,
- Kategorien,
- optionale Pantry-/Optional-Markierungen,
- praktische `buyingHint`-Hinweise.

## Bewertung

Der Test ist erfolgreich.

OpenClaw kann auf Hetzner eine Antwort erzeugen, die unser v1-Response-Schema erfuellt.

Damit ist die Grundlage fuer einen serverseitigen `PlannerAdapter` gelegt:

1. Planner Request bauen.
2. Prompt erzeugen.
3. OpenClaw lokal/serverseitig aufrufen.
4. `payloads[0].text` extrahieren.
5. JSON parsen.
6. Gegen Schema validieren.
7. Nur valide Plaene speichern.

## Offene Punkte

- Wiederholungstest mit kompletter 7-Tage-Woche.
- Pruefen, ob Deutsch als Ausgabesprache erzwungen werden soll.
- Strenger entscheiden, ob `snack` im MVP erlaubt bleibt oder nur spaeter genutzt wird.
- App-seitige Reparaturstrategie fuer invalide OpenClaw-Antworten bauen.
- Spaeter Gateway-Integration statt CLI-Adapter pruefen.
