# Essenplanner

Private App zur Essensplanung und Einkaufsoptimierung fuer zwei Personen.

Ziel ist nicht nur ein Wochenplan, sondern ein persoenlicher Planungsassistent, der Geschmack, Ziele, Budget, vorhandene Routinen und Einkaufsverhalten versteht und daraus konkrete Mahlzeiten und Einkaufslisten erzeugt.

Der aktuelle Projektstand wird in [`docs/product-understanding.md`](docs/product-understanding.md) gesammelt.

## Lokal starten

```bash
npm install
npm run dev
```

Die App laeuft danach standardmaessig unter <http://localhost:3000>.

## Checks

```bash
npm run lint
npm run test
npm run build
npm run validate:planner-request -- fixtures/planner-request.sample.json fixtures/planner-request.week.sample.json
```

Planner-Testprompt bauen:

```bash
npm run build:planner-test-prompt -- fixtures/planner-request.sample.json
```
