# OpenClaw Runtime

Dieses Dokument legt fest, wie Essenplanner OpenClaw im MVP betreibt und welche Checks vor produktiver Aktivierung auf dem Server laufen muessen.

## Entscheidung fuer den MVP

Essenplanner nutzt fuer den MVP den vorhandenen OpenClaw-CLI-Adapter.

Gruende:

- Der CLI-Weg ist auf Hetzner bereits mit `gpt-5.5`, 1-Tages- und 7-Tage-Planner-Requests schema-valide bewiesen.
- Die App hat seit EP-010 bereits einen `PlannerAdapter`, der OpenClaw serverseitig per CLI starten kann.
- Der CLI-Adapter haelt die Angriffsfläche kleiner als ein dauerhaft erreichbarer Gateway-Prozess.
- Der Fixture-Adapter bleibt der sichere Default, bis OpenClaw auf dem Server bewusst aktiviert wird.

Gateway bleibt eine spaetere Option, wenn wir echte Hintergrundjobs, Polling, Queueing oder mehrere Planner-Worker brauchen. Ein Gateway darf dann nur mit Token, loopback oder Tailscale-only und ohne oeffentliche Freigabe laufen.

## Server-Umgebung fuer CLI-Adapter

Minimal:

```bash
ESSENPLANNER_PLANNER_ADAPTER=openclaw-cli
OPENCLAW_BIN=/usr/bin/openclaw
OPENCLAW_AGENT=main
OPENCLAW_TIMEOUT_SECONDS=420
OPENCLAW_THINKING=low
OPENCLAW_LOCAL=true
```

Defaults im Code:

- `ESSENPLANNER_PLANNER_ADAPTER`: `fixture`
- `OPENCLAW_BIN`: `openclaw`
- `OPENCLAW_AGENT`: `main`
- `OPENCLAW_TIMEOUT_SECONDS`: `420`
- `OPENCLAW_THINKING`: `low`
- `OPENCLAW_LOCAL`: `true`

Validierung:

- `ESSENPLANNER_PLANNER_ADAPTER` darf nur `fixture` oder `openclaw-cli` sein.
- `OPENCLAW_TIMEOUT_SECONDS` muss eine ganze Zahl zwischen `60` und `1200` sein.
- `OPENCLAW_THINKING` darf nur `none`, `low`, `medium` oder `high` sein.

## Session-Key-Konvention

Wenn kein `OPENCLAW_SESSION_KEY` gesetzt ist, erzeugt die App pro Lauf:

```text
essenplanner:planner:<iso-timestamp>
```

Fuer manuelle Tests:

```text
essenplanner:runtime-smoke:<iso-timestamp>
essenplanner:schema-week-test:<datum>
```

Keine personenbezogenen Daten, Secrets oder Tokens in Session Keys schreiben.

## Runtime-Check auf dem Server

Nach Installation oder Update auf dem VPS:

```bash
cd /opt/essenplanner
runuser -u essenplanner -- npm run check:openclaw-runtime
```

Der Check prueft:

- OpenClaw-Binary und Version,
- `openclaw models status --json`,
- vorhandenes `bubblewrap`/`bwrap`,
- optional einen echten Planner-Smoke-Test.

Echter Planner-Smoke-Test:

```bash
cd /opt/essenplanner
runuser -u essenplanner -- npm run check:openclaw-runtime -- --smoke
```

Der Smoke-Test nutzt `fixtures/planner-request.sample.json`, schreibt den Prompt und die OpenClaw-Ausgabe in ein temporaeres Verzeichnis, validiert die Antwort mit `npm run validate:planner-response` und loescht temporaere Dateien danach.

## bubblewrap

Auf Ubuntu/Debian:

```bash
apt-get update
apt-get install -y bubblewrap
command -v bwrap
```

`bubblewrap` loest die Codex-/OpenClaw-Sandbox-Warnung sauberer als ein Betrieb ohne Sandbox-Helfer. Fehlt `bwrap`, darf OpenClaw nicht produktiv aktiviert werden.

## Auth-Status

Auf dem VPS als Betriebsnutzer pruefen:

```bash
runuser -u essenplanner -- openclaw models status --json
runuser -u essenplanner -- openclaw agent \
  --local \
  --agent main \
  --session-key essenplanner:auth-smoke:$(date -u +%Y%m%dT%H%M%SZ) \
  --message 'Antworte nur mit {"ok":true}' \
  --json \
  --timeout 180 \
  --thinking low
```

Erwartung:

- OpenAI/Codex-Provider ist nutzbar.
- Der Agentenlauf liefert JSON.
- Keine OAuth-Dateien, Tokens oder Provider-Secrets werden ins Repo kopiert.

## Logging und Fehlerkonvention

App-seitig:

- Planner-Jobs starten als `running`.
- Valide OpenClaw-Antworten werden gegen `schemas/planner-response.schema.json` validiert und nur dann als `success` gespeichert.
- CLI-, Parser- und Validatorfehler werden als `failed` gespeichert.
- `errorCode` ist fuer Adapterfehler `planner_adapter_failed`.
- `errorMessage` enthaelt eine nutzbare technische Kurzmeldung fuer den Betreiber, aber keine Secrets.

System-seitig:

```bash
journalctl -u essenplanner.service -n 200 --no-pager
```

In Logs duerfen erscheinen:

- Job-ID,
- Status,
- technische Fehlerklasse,
- OpenClaw Exit-/Timeout-Hinweise.

Nicht in Logs schreiben:

- OAuth-Credentials,
- Provider-Tokens,
- private Profilnotizen ueber das notwendige Request-/Response-Payload-Mass hinaus.

## Gateway-Sicherheitsannahmen fuer spaeter

Falls ein Gateway spaeter eingefuehrt wird:

- nur `127.0.0.1` oder Tailscale-only binden,
- Token/Password verpflichtend,
- kein Tailscale Funnel,
- keine oeffentliche Server-IP,
- Token nur in Server-Environment oder systemd-Drop-in,
- negativer Netzcheck vor Freigabe:

```bash
ss -ltnp | grep openclaw
ufw status verbose
tailscale funnel status
```

Gateway ist fuer EP-012 keine Produktiventscheidung, sondern nur die dokumentierte spaetere Alternative.
