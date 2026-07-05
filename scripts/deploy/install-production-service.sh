#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/essenplanner}"
SERVICE_USER="${SERVICE_USER:-essenplanner}"
SERVICE_GROUP="${SERVICE_GROUP:-essenplanner}"
SERVICE_NAME="${SERVICE_NAME:-essenplanner.service}"
DB_PATH="${ESSENPLANNER_DB_PATH:-/var/lib/essenplanner/essenplanner.db}"
BACKUP_DIR="${ESSENPLANNER_BACKUP_DIR:-/var/backups/essenplanner}"
SERVICE_SOURCE="${SERVICE_SOURCE:-$APP_DIR/scripts/deploy/essenplanner.service}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3008/api/health}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Bitte als root ausführen, damit systemd-Service und Zielrechte gesetzt werden können." >&2
  exit 1
fi

if [ ! -f "$SERVICE_SOURCE" ]; then
  echo "Service-Datei nicht gefunden: $SERVICE_SOURCE" >&2
  echo "Erwartung: Repo liegt bereits unter $APP_DIR und enthält scripts/deploy/essenplanner.service." >&2
  exit 1
fi

if ! getent group "$SERVICE_GROUP" >/dev/null 2>&1; then
  groupadd --system "$SERVICE_GROUP"
fi

if ! id "$SERVICE_USER" >/dev/null 2>&1; then
  useradd --system --home "$APP_DIR" --gid "$SERVICE_GROUP" --shell /usr/sbin/nologin "$SERVICE_USER"
fi

install -d -m 0755 -o "$SERVICE_USER" -g "$SERVICE_GROUP" "$APP_DIR"
install -d -m 0750 -o "$SERVICE_USER" -g "$SERVICE_GROUP" "$(dirname "$DB_PATH")"
install -d -m 0750 -o "$SERVICE_USER" -g "$SERVICE_GROUP" "$BACKUP_DIR"
install -d -m 0750 -o "$SERVICE_USER" -g "$SERVICE_GROUP" /tmp/essenplanner-npm-cache

chown -R "$SERVICE_USER:$SERVICE_GROUP" "$APP_DIR"

cd "$APP_DIR"

if [ -f data/essenplanner.db ]; then
  echo "WARNUNG: Lokale Testdatenbank data/essenplanner.db wird nicht nach $DB_PATH kopiert." >&2
fi

runuser -u "$SERVICE_USER" -- npm ci
runuser -u "$SERVICE_USER" -- npm run build

install -m 0644 "$SERVICE_SOURCE" "/etc/systemd/system/$SERVICE_NAME"
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

for attempt in $(seq 1 30); do
  if curl -fsS "$HEALTH_URL" >/tmp/essenplanner-health.json; then
    echo "Healthcheck OK: $HEALTH_URL"
    cat /tmp/essenplanner-health.json
    rm -f /tmp/essenplanner-health.json
    exit 0
  fi
  sleep 2
done

rm -f /tmp/essenplanner-health.json
echo "Healthcheck fehlgeschlagen: $HEALTH_URL" >&2
journalctl -u "$SERVICE_NAME" -n 80 --no-pager >&2 || true
exit 1
