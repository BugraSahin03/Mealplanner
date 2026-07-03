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
- `scripts/validate-planner-request.mjs`
- `scripts/validate-openclaw-planner-response.mjs`
- `package.json`

Genutzte Schemas:

- `schemas/profile.schema.json`
- `schemas/planner-request.schema.json`
- `schemas/planner-response.schema.json`

## Test 1: Schemas und Request validieren

Kommando:

```bash
npm run validate:planner-request -- fixtures/planner-request.sample.json
```

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

Der 1-Tages-Test ist erfolgreich.

OpenClaw kann auf Hetzner eine Antwort erzeugen, die unser v1-Response-Schema erfuellt.

Damit ist die Grundlage fuer einen serverseitigen `PlannerAdapter` gelegt:

1. Planner Request bauen.
2. Prompt erzeugen.
3. OpenClaw lokal/serverseitig aufrufen.
4. `payloads[0].text` extrahieren.
5. JSON parsen.
6. Gegen Schema validieren.
7. Nur valide Plaene speichern.

## Test 5: Komplette 7-Tage-Woche

Nach dem erfolgreichen 1-Tages-Test wurde ein groesserer Test mit einer kompletten Woche angelegt.

Warum:

- Die spaetere App plant nicht nur einen Tag, sondern eine ganze Woche.
- Buğra und Sena haben an unterschiedlichen Tagen Office-/Home-Kontexte.
- Fruehstueck und Mittagessen duerfen getrennt geplant werden.
- Abendessen soll moeglichst geteilt werden.
- Die Einkaufsliste muss ueber die ganze Woche konsolidiert werden.

Angelegt:

- `fixtures/planner-request.week.sample.json`

Request-Validierung:

```bash
npm run validate:planner-request -- fixtures/planner-request.week.sample.json
```

Prompt-Groesse:

```text
13494 Zeichen
```

Kommando sinngemaess:

```bash
openclaw agent \
  --local \
  --agent main \
  --session-key essenplanner:schema-week-test:20260703-rerun \
  --message-file /tmp/essenplanner-week-planner-test-prompt.md \
  --json \
  --timeout 420 \
  --thinking low
```

Validierung:

```bash
npm run validate:planner-response -- /tmp/essenplanner-openclaw-week-schema-test-output.jsonl
```

Ergebnis:

```text
planner-response valid
{
  "dayCount": 7,
  "mealCount": 28,
  "shoppingCount": 45
}
```

Inhaltliche Kurzpruefung:

- 7 Tage wurden geplant.
- Es wurden 28 Mahlzeit-Objekte erzeugt, weil Fruehstueck und Mittagessen je nach Office-/Home-Kontext teilweise pro Person getrennt sind.
- Gemeinsame Abendessen wurden bevorzugt.
- Office-Mahlzeiten wurden transportierbar bzw. Meal-Prep-tauglich markiert.
- Die Einkaufsliste wurde auf 45 Positionen konsolidiert.
- Kategorien wurden sinnvoll genutzt: `bakery`, `canned`, `condiments_spices`, `dairy_eggs`, `dry_goods`, `frozen`, `meat_fish`, `produce`.
- `plannerNotes` und `warnings` wurden korrekt als optionale strukturierte Hinweise geliefert.

OpenClaw stderr:

- nur OpenClaw-/Plugin-Hinweise,
- normaler Stop-Grund `stop`,
- kein fachlicher Fehler.

Beispielstruktur:

- Montag: 5 Mahlzeiten, getrennte Fruehstuecke/Mittagessen und gemeinsames Abendessen.
- Mittwoch: 4 Mahlzeiten, gemeinsames Office-Fruehstueck, getrennte Lunches und gemeinsames Abendessen.
- Wochenende: 3 Mahlzeiten pro Tag, groesstenteils gemeinsam.

Serverbeobachtung nach dem Test:

- `budgetbuddy.service`: weiterhin `active`.
- RAM: ca. 3.1 GiB verfuegbar.
- Disk `/`: ca. 31 GiB frei.
- Damit ist der gemeinsame Betrieb auf dem bestehenden CX23 fuer den MVP plausibel.

## Test 6: Deutsche Ausgabe erzwingen

Der Prompt wurde erweitert:

```text
Write user-facing titles, notes, plannerNotes, warnings, and buyingHint values in German.
```

Warum:

- Buğra und Sena nutzen die App voraussichtlich auf Deutsch.
- Die App soll die Planinhalte direkt anzeigen koennen.
- Eine Uebersetzungsschicht in der App waere unnoetig komplex und fehleranfaellig.

Kommando sinngemaess:

```bash
openclaw agent \
  --local \
  --agent main \
  --session-key essenplanner:german-schema-test:20260703 \
  --message-file /tmp/essenplanner-german-planner-test-prompt.md \
  --json \
  --timeout 300 \
  --thinking low
```

Validierung:

```text
planner-response valid
{
  "dayCount": 1,
  "mealCount": 5,
  "shoppingCount": 32
}
```

Beispielausgabe:

- Plan-Titel: `Essensplan fuer Montag, 06.07.2026`
- Mahlzeiten:
  - `Protein-Overnight-Oats im Glas`
  - `Joghurt-Bowl mit Beeren und Hafer`
  - `Haehnchen-Reis-Bowl zum Mitnehmen`
  - `Mediterraner Kichererbsen-Salat`
  - `Puten-Hack-Gemuese-Pfanne mit Kartoffeln`
- Einkaufshinweise wurden ebenfalls auf Deutsch erzeugt.
- `plannerNotes` und `warnings` wurden auf Deutsch erzeugt.

Bewertung:

- Deutsche Ausgabe funktioniert ohne Schema-Bruch.
- Das Grundgeruest sollte den Prompt standardmaessig auf Deutsch konfigurieren.
- Optional koennen interne technische Felder Englisch bleiben, solange sichtbare Inhalte Deutsch sind.

## Gesamtbewertung

Der technische Kern ist fuer das Grundgeruest ausreichend bestaetigt:

- OpenClaw ist auf Hetzner lauffaehig.
- OpenClaw kann `gpt-5.5` ueber den ChatGPT/Codex-Login nutzen.
- Ein vollstaendiger Wochenplan kann als valides JSON erzeugt werden.
- Deutsche sichtbare Inhalte koennen per Prompt erzwungen werden.
- Die Antwort ist app-seitig maschinenlesbar validierbar.
- Der Server bleibt nach dem Test stabil.

Konsequenz fuer den MVP:

- Das Grundgeruest kann mit einem serverseitigen CLI-basierten `PlannerAdapter` starten.
- Wochenplanung sollte als laenger laufender Job modelliert werden, nicht als sofortige UI-Antwort.
- Die App sollte nach jedem OpenClaw-Lauf strikt validieren und nur valide Plaene speichern.
- Der Planner-Prompt sollte sichtbare Inhalte standardmaessig auf Deutsch anfordern.

## Offene Punkte

- Strenger entscheiden, ob `snack` im MVP erlaubt bleibt oder nur spaeter genutzt wird.
- App-seitige Reparaturstrategie fuer invalide OpenClaw-Antworten bauen.
- Spaeter Gateway-Integration statt CLI-Adapter pruefen.
