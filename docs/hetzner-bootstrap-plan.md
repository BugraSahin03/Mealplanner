# Hetzner Bootstrap-Plan

Ziel: Essenplanner sauber auf dem vorhandenen Hetzner-Server aufsetzen, ohne BudgetBuddy zu veraendern.

## Grundsatz

BudgetBuddy bleibt unangetastet.

Essenplanner soll zunaechst auf demselben Hetzner-Cloud-Server laufen wie BudgetBuddy. Es wird kein neues Hetzner-Projekt und kein neuer Server fuer den MVP angelegt.

Essenplanner bekommt eigene:

- Projektverzeichnisse,
- Prozesse/Services,
- Ports,
- Secrets,
- OpenClaw-/Codex-Konfiguration,
- spaeter eigene Docker-Compose-Datei.

## Zielarchitektur auf Hetzner

```text
Hetzner Server
  - BudgetBuddy: bestehend, nicht anfassen
  - Essenplanner Web-App: Next.js auf 127.0.0.1:3008
  - OpenClaw Gateway/Agent: Essenplanner Planner Backend
  - Codex/OpenAI Auth: fuer openai-codex Provider
  - Zugriff: privat ueber Tailscale
```

Aktueller Server laut Hetzner Console:

- Projekt: `BudgetBuddy`
- Server: `budgetbuddy-prod-01`
- Typ: `CX23`
- Architektur: `x86`
- Disk: `40 GB`
- Standort: `Nürnberg`
- Public IP: `178.105.227.110`

Der CX23 hat laut Hetzner aktuellem Cloud-Angebot 2 vCPU, 4 GB RAM und 40 GB SSD. Das sollte fuer einen privaten MVP mit BudgetBuddy, Essenplanner-Web-App, SQLite und OpenClaw-Gateway grundsaetzlich reichen, weil das eigentliche LLM nicht auf dem Server laeuft.

Wichtig: Vor Installation wird trotzdem die reale Auslastung geprueft.

## Phase 0: Zugang klaeren

Bevor irgendetwas installiert wird, muss klar sein:

- Server-IP oder Domain: `178.105.227.110`,
- SSH-User,
- ob SSH-Key-Zugriff bereits funktioniert,
- ob Tailscale schon auf dem Server laeuft,
- wie BudgetBuddy aktuell deployed ist.

Wichtig: Keine Passwoerter oder privaten Keys in den Chat schreiben.

## Phase 1: Read-only Bestandsaufnahme

Erst nur schauen, nichts aendern:

- Betriebssystem,
- CPU/RAM/Disk,
- vorhandene User,
- Docker/Compose,
- Node/npm,
- Tailscale,
- laufende Services,
- belegte Ports,
- BudgetBuddy-Verzeichnis und Deployment-Art.

Ziel: Essenplanner so daneben setzen, dass BudgetBuddy nicht beruehrt wird.

Ergebnis vom 2026-06-30:

- Hostname: `budgetbuddy-prod-01`
- OS: Ubuntu 24.04.4 LTS
- Kernel: Linux 6.8
- User-Zugriff: `root`
- Uptime: ca. 10 Tage
- Load Average: `0.00, 0.00, 0.00`
- RAM: 3.7 GiB total, 631 MiB used, 3.1 GiB available
- Swap: nicht eingerichtet
- Disk `/`: 38G total, 3.8G used, 32G available
- Node: `/usr/bin/node`, Version `v22.23.0`
- npm: Version `10.9.8`
- Docker: nicht installiert bzw. nicht aktiv vorhanden
- Tailscale: installiert und aktiv
- Tailscale IP: `100.123.65.0`
- Tailscale Serve: `https://budgetbuddy-prod-01.taild1a8ca.ts.net` proxyt `/` auf `http://127.0.0.1:3000`
- Firewall/UFW: aktiv, erlaubt SSH `22/tcp` und Tailscale `41641/udp`
- BudgetBuddy: systemd Service `budgetbuddy.service`, aktiv
- BudgetBuddy Port: `127.0.0.1:3000`
- BudgetBuddy Pfad: `/opt/budgetbuddy`
- BudgetBuddy Datenbankpfad: `/var/lib/budgetbuddy/budgetbuddy.db`
- BudgetBuddy Prozess: Next.js `v16.2.4`, ca. 171 MiB RSS

Einschaetzung:

- Der Server hat fuer den MVP genug freie Ressourcen.
- Essenplanner sollte auf demselben Server laufen koennen.
- Das eigentliche LLM laeuft nicht auf dem Server, daher ist keine GPU/noetige Modellhardware relevant.
- OpenClaw/Codex koennen zusaetzlich Speicher verbrauchen; 4 GB RAM sollten fuer den Start reichen.
- Ein kleiner Swapfile waere spaeter als Sicherheitsnetz sinnvoll, muss aber nicht vor dem ersten Test passieren.
- Da Docker nicht vorhanden ist und BudgetBuddy per systemd laeuft, sollte Essenplanner zunaechst ebenfalls als eigener systemd-Service mit eigenem Linux-User geplant werden.

## Phase 2: Separaten Essenplanner-Bereich anlegen

Empfohlen:

- eigener Linux-User `essenplanner`,
- App-Verzeichnis `/opt/essenplanner`,
- SQLite-Datenbank `/var/lib/essenplanner/essenplanner.db`,
- lokale Backups unter `/var/backups/essenplanner`,
- eigener systemd-Service `essenplanner.service`,
- eigener Port `127.0.0.1:3008`, damit BudgetBuddy auf `127.0.0.1:3000` unangetastet bleibt.

## Phase 3: Codex auf Hetzner einrichten

Ziel:

- `codex` CLI verfuegbar,
- ChatGPT/Codex-Auth auf dem Server eingerichtet,
- kein OpenAI Platform API Key.

Bevorzugter Login:

```bash
codex login --device-auth
```

Danach:

```bash
codex login status
codex exec --ephemeral --skip-git-repo-check 'Antworte nur mit {"ok":true}'
```

Status vom 2026-06-30:

- Codex ist installiert.
- Binary: `/usr/bin/codex`
- Version: `codex-cli 0.142.4`
- Device Auth Login erfolgreich.
- `codex login status`: `Logged in using ChatGPT`
- Minimaltest erfolgreich mit `gpt-5.5`.
- Antwort: `{"ok":true}`

## Phase 4: OpenClaw auf Hetzner einrichten

Ziel:

- OpenClaw installiert,
- `openai-codex` Provider verfuegbar,
- Modell spaeter auf `gpt-5.5` setzen,
- Agentenlauf erzeugt JSON.

Tests:

```bash
openclaw models status --json
openclaw agent --message 'Antworte nur mit {"ok":true}' --json --timeout 180
```

Danach Essenplanner-Test:

- Mini-Wochenplan,
- Zutaten,
- Einkaufsliste,
- JSON parsebar.

Status vom 2026-06-30:

- OpenClaw ist installiert.
- Binary: `/usr/bin/openclaw`
- Version: `2026.6.11`
- OpenAI/Codex Device Auth fuer OpenClaw erfolgreich.
- Default Model: `openai/gpt-5.5`
- `openclaw models status --json` zeigt Provider `openai` als usable.
- Embedded-Agentenlauf mit `--local --agent main --session-key essenplanner:test` erfolgreich.
- Antwort: `{"ok":true}`

Hinweis:

- Normale Gateway-Agentenlaeufe brauchen noch Gateway-Credentials.
- Fuer den ersten PlannerAdapter kann zunaechst ein lokaler CLI-Aufruf mit `openclaw agent --local ...` genutzt werden.

Status vom 2026-07-03:

- Fachlicher Essenplanner-Minitest erfolgreich.
- OpenClaw erzeugte mit `gpt-5.5` einen JSON-Tagesplan inklusive Einkaufsliste.
- Laufzeit ca. 35 Sekunden.
- Naechster Schritt: finales Planner-JSON-Schema definieren und danach App-Grundgeruest bauen.

## Phase 5: Gateway absichern

Das OpenClaw Gateway darf nicht oeffentlich ohne Schutz erreichbar sein.

Empfohlen:

- Loopback-only, wenn Web-App und OpenClaw auf demselben Server laufen,
- oder Tailscale-only,
- Gateway Token aktivieren,
- keine offene Public-IP-Freigabe.

## Phase 6: Web-App als eigener systemd-Dienst

Die App wird analog zu BudgetBuddy, aber vollständig getrennt betrieben:

- Unit-Vorlage: `scripts/deploy/essenplanner.service`
- Installationsskript: `scripts/deploy/install-production-service.sh`
- Produktionsdoku: `docs/production-app-service.md`
- Healthcheck: `GET /api/health`
- sicherer Standardadapter: `ESSENPLANNER_PLANNER_ADAPTER=fixture`
- optionaler OpenClaw-Adapter später bewusst über Server-Umgebung: `ESSENPLANNER_PLANNER_ADAPTER=openclaw-cli`

Die Unit startet Next.js mit:

```bash
npm run start -- --hostname 127.0.0.1 --port 3008
```

Damit entsteht kein öffentlicher App-Listener auf `0.0.0.0`.

## Phase 7: Tailscale-only Zugriff

Essenplanner wird erst nach Freigabe über Tailscale erreichbar gemacht. Wichtig:

- Kein Tailscale Funnel.
- Keine öffentliche URL.
- Keine öffentliche Firewall-Freigabe für `3008/tcp`.
- BudgetBuddy-Tailscale-Serve für `/` auf `127.0.0.1:3000` nicht überschreiben.
- Vor Aktivierung entscheiden, ob Essenplanner über einen eigenen Tailnet-Port oder eine eigene Tailscale-Serve-Route läuft.

Vor einer Freigabe prüfen:

```bash
systemctl is-active essenplanner.service
curl -fsS http://127.0.0.1:3008/api/health
tailscale serve status
tailscale funnel status
ss -ltnp | grep -E ':(3000|3008)'
```

## Naechster konkreter Schritt

EP-008 bereitet den systemd-Betrieb vor. Ein produktiver Rollout erfolgt erst nach ausdrücklicher Freigabe und ohne BudgetBuddy zu verändern.
