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

## Produktion vorbereiten

Der vorbereitete Hetzner-Betrieb läuft analog zu BudgetBuddy, aber als eigener Dienst:

- App-Pfad: `/opt/essenplanner`
- SQLite-Datenbank: `/var/lib/essenplanner/essenplanner.db`
- systemd-Unit: `scripts/deploy/essenplanner.service`
- lokaler Port: `127.0.0.1:3008`
- Healthcheck: `GET /api/health`

Details stehen in [`docs/production-app-service.md`](docs/production-app-service.md). Der Dienst ist für Tailscale-only Betrieb vorbereitet; es gibt keinen öffentlichen Rollout ohne Freigabe.

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
