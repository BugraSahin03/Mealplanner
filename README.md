# Essenplanner

Private App zur Essensplanung und Einkaufsoptimierung fuer zwei Personen.

Ziel ist nicht nur ein Wochenplan, sondern ein persoenlicher Planungsassistent, der Geschmack, Ziele, Budget, vorhandene Routinen und Einkaufsverhalten versteht und daraus konkrete Mahlzeiten und Einkaufslisten erzeugt.

Der aktuelle Projektstand wird in [`docs/product-understanding.md`](docs/product-understanding.md) gesammelt.

## Lokal starten

Voraussetzung: Node.js 22, siehe `.nvmrc`.

```bash
npm ci
npm run dev
```

Die App laeuft danach standardmaessig unter <http://localhost:3000>.

Der Planner nutzt lokal ohne weitere Konfiguration den Fixture-Adapter. Ein echter OpenClaw-Lauf kann serverseitig oder lokal mit vorhandener OpenClaw-Auth aktiviert werden:

```bash
ESSENPLANNER_PLANNER_ADAPTER=openclaw-cli npm run dev
```

## Produktion vorbereiten

Der vorbereitete Hetzner-Betrieb läuft analog zu BudgetBuddy, aber als eigener Dienst:

- App-Pfad: `/opt/essenplanner`
- SQLite-Datenbank: `/var/lib/essenplanner/essenplanner.db`
- systemd-Unit: `scripts/deploy/essenplanner.service`
- lokaler Port: `127.0.0.1:3008`
- Healthcheck: `GET /api/health`

Details stehen in [`docs/production-app-service.md`](docs/production-app-service.md). Der Dienst ist für Tailscale-only Betrieb vorbereitet; es gibt keinen öffentlichen Rollout ohne Freigabe.

## Checks

Nach einem frischen Checkout:

```bash
npm ci
npm run check
```

`npm run check` fuehrt Linting, Tests, Production-Build und die Planner-Schema-/Prompt-Checks aus. Die Vitest-Konfiguration ignoriert Mac-Resource-Dateien wie `._*`.

Einzelne Checks:

```bash
npm run lint
npm run test
npm run build
npm run check:schema
npm run validate:planner-request -- fixtures/planner-request.sample.json fixtures/planner-request.week.sample.json
npm run build:planner-test-prompt -- fixtures/planner-request.sample.json
```

Pull Requests laufen zusaetzlich ueber GitHub Actions (`.github/workflows/ci.yml`) mit denselben Checks.
