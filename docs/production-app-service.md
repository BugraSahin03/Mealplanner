# Essenplanner Produktionsdienst

Diese Anleitung beschreibt die vorbereitete Produktionsform für Essenplanner auf dem bestehenden Hetzner-VPS. Der Dienst läuft getrennt von BudgetBuddy, bindet nur lokal und wird erst nach Freigabe über Tailscale erreichbar gemacht.

## Sicherheitsleitplanken

- Kein öffentlicher Betrieb über die Server-IP.
- Kein Tailscale Funnel.
- Keine Public-Freigabe für `80/tcp`, `443/tcp` oder den App-Port `3008/tcp`.
- BudgetBuddy bleibt auf `127.0.0.1:3000` unverändert.
- Essenplanner bindet nur an `127.0.0.1:3008`.
- Keine Secrets, privaten Keys, OAuth-Dateien oder echten privaten Daten ins Repo legen.
- Die lokale Entwicklungsdatenbank `data/essenplanner.db` wird nicht auf den VPS kopiert.

## Zielpfade

- App: `/opt/essenplanner`
- SQLite-DB: `/var/lib/essenplanner/essenplanner.db`
- Lokale Backups: `/var/backups/essenplanner`
- systemd-Unit: `/etc/systemd/system/essenplanner.service`
- App-Port: `127.0.0.1:3008`
- Lokaler Healthcheck: `http://127.0.0.1:3008/api/health`

## systemd-Unit

Die Vorlage liegt im Repo unter:

```text
scripts/deploy/essenplanner.service
```

Wichtige Einstellungen:

```ini
User=essenplanner
Group=essenplanner
WorkingDirectory=/opt/essenplanner
Environment=NODE_ENV=production
Environment=ESSENPLANNER_DB_PATH=/var/lib/essenplanner/essenplanner.db
Environment=ESSENPLANNER_PLANNER_ADAPTER=fixture
Environment=PORT=3008
ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1 --port 3008
```

Der `fixture`-Adapter ist der sichere Standard für den ersten Dienststart. Der echte OpenClaw-Adapter kann später bewusst über eine geschützte Server-Umgebung aktiviert werden:

```bash
ESSENPLANNER_PLANNER_ADAPTER=openclaw-cli
OPENCLAW_BIN=/usr/bin/openclaw
OPENCLAW_AGENT=main
OPENCLAW_TIMEOUT_SECONDS=420
OPENCLAW_THINKING=low
OPENCLAW_LOCAL=true
```

Auth-Dateien und OpenClaw-/Codex-Credentials bleiben ausschließlich auf dem Server und werden nicht im Repo dokumentiert. Die Runtime-Entscheidung und alle OpenClaw-Checks stehen gesammelt in [`docs/openclaw-runtime.md`](openclaw-runtime.md).

## Vorbereitung auf dem VPS

Vor Installation nur prüfen, nichts an BudgetBuddy ändern:

```bash
node -v
npm -v
git --version
systemctl is-active tailscaled
systemctl is-active budgetbuddy.service
ss -ltnp | grep -E ':(3000|3008)'
ufw status verbose
```

Erwartung:

- Node.js 22 und npm 10 sind vorhanden.
- `budgetbuddy.service` läuft weiter auf `127.0.0.1:3000`.
- `3008` ist vor Essenplanner-Installation noch frei.
- UFW erlaubt keinen öffentlichen App-Port.

OpenClaw-Runtime vorbereiten, bevor der echte Adapter aktiviert wird:

```bash
apt-get update
apt-get install -y bubblewrap
command -v bwrap
```

`bubblewrap` muss vorhanden sein, damit OpenClaw/Codex ohne Sandbox-Warnung laufen kann.

## App bereitstellen

Der Zielpfad bleibt `/opt/essenplanner`. Für die Bereitstellung gibt es zwei Varianten.

Vor beiden Varianten wird der Betriebsnutzer auf dem VPS angelegt:

```bash
getent group essenplanner >/dev/null || groupadd --system essenplanner
id essenplanner >/dev/null 2>&1 || useradd --system --home /opt/essenplanner --gid essenplanner --shell /usr/sbin/nologin essenplanner
```

Das Installationsskript führt denselben Schritt ebenfalls aus. Der Vorab-Schritt ist trotzdem bewusst dokumentiert, damit `chown` und Release-Kopie auf einem frischen Server in der gezeigten Reihenfolge funktionieren.

### Variante A: Git-Checkout mit Deploy-Key

```bash
git clone git@github.com:BugraSahin03/Essensplan.git /opt/essenplanner
chown -R essenplanner:essenplanner /opt/essenplanner
```

Wenn der VPS noch keinen GitHub-Deploy-Key hat, wird dieser außerhalb des Repos eingerichtet. Keine privaten SSH-Keys oder Tokens in Git ablegen.

### Variante B: Release-Kopie vom lokalen Rechner

```bash
tar \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='data' \
  -czf - . \
  | ssh root@<server-ip> 'set -euo pipefail
      rm -rf /opt/essenplanner.release
      install -d -m 0755 -o essenplanner -g essenplanner /opt/essenplanner.release
      tar -xzf - -C /opt/essenplanner.release
      chown -R essenplanner:essenplanner /opt/essenplanner.release
      rm -rf /opt/essenplanner.previous
      if [ -d /opt/essenplanner ]; then mv /opt/essenplanner /opt/essenplanner.previous; fi
      mv /opt/essenplanner.release /opt/essenplanner
    '
```

Lokale Testdaten bleiben ausgeschlossen. Produktivdaten liegen ausschließlich unter `/var/lib/essenplanner/essenplanner.db`.

## Build und Service installieren

Auf dem VPS:

```bash
cd /opt/essenplanner
sudo ./scripts/deploy/install-production-service.sh
```

Das Skript erledigt nur Standardarbeit:

- Betriebsnutzer `essenplanner` anlegen, falls er fehlt.
- Zielverzeichnisse mit passenden Rechten anlegen.
- Lokale Testdatenbank nicht kopieren.
- `npm ci` und `npm run build` ausführen.
- systemd-Unit installieren.
- Dienst aktivieren und neu starten.
- Healthcheck gegen `http://127.0.0.1:3008/api/health` prüfen.

Vor Umschalten auf `ESSENPLANNER_PLANNER_ADAPTER=openclaw-cli`:

```bash
cd /opt/essenplanner
runuser -u essenplanner -- openclaw models status --json
runuser -u essenplanner -- npm run check:openclaw-runtime
runuser -u essenplanner -- npm run check:openclaw-runtime -- --smoke
```

Der erste Befehl prueft Binary, Auth-Status und `bubblewrap`. Der zweite fuehrt einen echten Planner-Smoke-Test aus und validiert die OpenClaw-Antwort gegen das Planner-Response-Schema.

## Betrieb

```bash
systemctl status essenplanner.service --no-pager
systemctl is-enabled essenplanner.service
systemctl is-active essenplanner.service
journalctl -u essenplanner.service -n 100 --no-pager
```

Start, Stop, Restart:

```bash
systemctl start essenplanner.service
systemctl stop essenplanner.service
systemctl restart essenplanner.service
```

## Healthcheck

Lokal auf dem VPS:

```bash
curl -fsS http://127.0.0.1:3008/api/health
```

Erwartung:

```json
{"status":"ok","sqliteReady":true,"schemaVersion":"0004_ep_016"}
```

Der genaue `schemaVersion`-Wert darf mit späteren Migrationen steigen.

## Tailscale-only Zugriff

Essenplanner wird nicht über die öffentliche Server-IP freigegeben. Der Produktionsdienst bleibt lokal auf `127.0.0.1:3008`; Zugriff von Geräten erfolgt erst nach Freigabe über Tailscale.

BudgetBuddy nutzt bereits Tailscale Serve für `/` auf `127.0.0.1:3000`. Essenplanner darf diese Konfiguration nicht überschreiben. Vor der Aktivierung muss entschieden werden, ob Essenplanner über einen eigenen Tailnet-Port oder über eine eigene Tailscale-Serve-Route betrieben wird.

Prüfungen vor Freigabe:

```bash
tailscale status
tailscale serve status
tailscale funnel status
curl -fsS http://127.0.0.1:3008/api/health
```

Erwartung:

- `tailscaled` ist aktiv.
- Funnel ist nicht aktiv.
- Der lokale Essenplanner-Healthcheck ist erfolgreich.
- BudgetBuddy bleibt unter seiner bestehenden Tailscale-Serve-Konfiguration erreichbar.

## Negative Security Checks

Auf dem VPS:

```bash
ss -ltnp | grep -E ':(80|443|3000|3008)'
ufw status verbose
```

Erwartung:

- `3000` lauscht nur auf `127.0.0.1` für BudgetBuddy.
- `3008` lauscht nur auf `127.0.0.1` für Essenplanner.
- Kein Essenplanner-Prozess lauscht auf `0.0.0.0:3008`.
- Keine UFW-Regel gibt `3008/tcp` öffentlich frei.

Von einem externen Netz:

```bash
nc -vz <server-ip> 3008
curl --connect-timeout 5 http://<server-ip>:3008/api/health
```

Erwartung:

- `3008` ist über die öffentliche Server-IP nicht erreichbar.
- `/api/health` ist über die öffentliche Server-IP nicht erreichbar.

## Update-Ablauf

Wenn `/opt/essenplanner` ein Git-Checkout ist:

```bash
cd /opt/essenplanner
git fetch origin
git switch main
git pull --ff-only origin main
runuser -u essenplanner -- npm ci
runuser -u essenplanner -- npm run build
systemctl restart essenplanner.service
curl -fsS http://127.0.0.1:3008/api/health
```

Wenn `/opt/essenplanner` als Release-Kopie bereitgestellt wurde, erneut ohne `data/` übertragen und danach das Installationsskript ausführen.

## Notfallabschaltung

```bash
systemctl stop essenplanner.service
systemctl disable essenplanner.service
```

Prüfung:

```bash
curl -fsS http://127.0.0.1:3008/api/health
```

Erwartung: Der lokale Healthcheck ist nach Stop nicht mehr erreichbar.

## Nicht Teil dieses Tickets

- Kein produktiver Rollout ohne Freigabe.
- Kein Tailscale Funnel.
- Keine öffentliche URL.
- Keine Docker-Pflicht.
- Keine Backups oder Restore-Tests.
- Keine echte OpenClaw-Produktivaktivierung.
