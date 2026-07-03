# Spike: Hetzner-Auth fuer OpenClaw/Codex

Datum: 2026-06-29

## Fragestellung

Kann auf dem Hetzner-Server ein Agenten-Backend laufen, das wie lokal mit OpenAI/Codex-Auth angemeldet ist und von der Essenplanner-Web-App fuer Wochenplaene genutzt wird?

## Kurzfazit

Ja, der Ansatz ist grundsaetzlich machbar.

Codex unterstuetzt Headless-Login ueber Device Code Auth. OpenClaw unterstuetzt einen OpenAI/Codex-Provider bzw. Codex-Subscription/OAuth als Modellquelle. Lokal wurde bereits bestaetigt, dass OpenClaw `openai-codex` mit OAuth-Profil nutzen kann.

Der Hetzner-Server braucht also kein lokales LLM. Er braucht:

- Codex CLI bzw. OpenClaw mit Codex-Provider,
- eine erfolgreiche ChatGPT/Codex-Auth auf dem Server,
- OpenClaw Gateway als Service,
- privaten Zugriff ueber Tailscale oder Loopback/interne Docker-Kommunikation,
- ein internes Secret zwischen Web-App und Agent/Gateway.

## Auth-Wege

### Bevorzugt: Device Code Login auf dem Server

Codex CLI:

```bash
codex login --device-auth
```

Der Server zeigt einen Link und einen Einmal-Code. Der Login wird im Browser auf einem normalen Rechner abgeschlossen. Danach speichert Codex die Credentials auf dem Server.

Vorteile:

- sauberer Headless-Weg,
- kein lokales Kopieren von Auth-Dateien notwendig,
- passend fuer VPS.

Risiko:

- Device Code Login muss fuer den Account bzw. Workspace verfuegbar/aktiviert sein.

### Fallback: Lokales Auth-Cache kopieren

Wenn Device Code nicht funktioniert, kann man lokal einloggen und `~/.codex/auth.json` auf den Server kopieren.

Wichtig:

- `auth.json` ist ein Secret.
- Nur per SSH/scp uebertragen.
- Nicht committen, nicht in Chat oder Tickets kopieren.
- Server muss vertrauenswuerdig sein.

### Nicht bevorzugt: Platform API Key

Ein OpenAI Platform API Key wuerde technisch funktionieren, fuehrt aber zu separater API-Abrechnung. Das ist nicht gewuenscht.

### Access Tokens

Codex Access Tokens sind laut Codex-Doku fuer ChatGPT Business/Enterprise Workspaces gedacht. Fuer ein privates Setup ist Device Code oder Auth-Cache realistischer.

## OpenClaw-Status lokal

Lokal wurde bereits festgestellt:

- OpenClaw installiert: `2026.4.15`.
- Config wurde von neuerer Version geschrieben: `2026.4.20`.
- Update verfuegbar: `2026.6.10`.
- OpenClaw erkennt `openai-codex`.
- Default-Modell: `openai-codex/gpt-5.4-mini`.
- Erlaubte Modelle:
  - `openai-codex/gpt-5.4`
  - `openai-codex/gpt-5.4-mini`
- OAuth-Profil vorhanden und OK.
- OpenClaw Gateway konnte lokal gestartet werden.
- Agentenlauf erzeugte JSON.

## Wichtig fuer Hetzner

Vor dem produktiven Setup sollte OpenClaw aktualisiert werden:

```bash
openclaw update --yes
```

Danach auf dem Server:

1. Codex CLI installieren.
2. `codex login --device-auth` ausfuehren.
3. `codex login status` pruefen.
4. OpenClaw installieren.
5. OpenClaw Provider/Auth fuer `openai-codex` einrichten bzw. synchronisieren.
6. `openclaw models status --json` pruefen.
7. Gateway lokal oder Tailnet-only starten.
8. Einen Test-Agentenlauf mit JSON-Ausgabe machen.
9. Erst danach Web-App anbinden.

## Zielbetrieb

Empfohlen:

```text
Hetzner Server
  - Docker/Process: Next.js Web-App
  - Process/Service: OpenClaw Gateway
  - Codex/OpenClaw Credentials im User-Home
  - Zugriff von aussen nur ueber Tailscale
```

Sicherheitsregeln:

- Gateway nicht oeffentlich ohne Auth exponieren.
- Wenn Gateway nicht nur Loopback nutzt, Token-Auth aktivieren.
- Web-App spricht Gateway intern an.
- Credentials nicht in Docker-Images backen.
- Auth-Dateien und OpenClaw-State regelmaessig sichern, aber verschluesselt.

## Offener Realtest

Der finale Beweis muss auf Hetzner stattfinden.

Minimaler Realtest:

```bash
codex login --device-auth
codex exec --ephemeral --skip-git-repo-check 'Antworte nur mit {"ok":true}'
openclaw models status --json
openclaw gateway run --bind loopback --auth token --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw agent --message 'Antworte nur mit {"ok":true}' --json --timeout 180
```

Wenn diese Schritte auf Hetzner funktionieren, ist die KI-Backend-Frage fuer den MVP ausreichend geklaert.

## Realtest-Status vom 2026-06-30

Codex wurde auf dem Hetzner-Server erfolgreich installiert und getestet.

Server:

- Host: `budgetbuddy-prod-01`
- User: `root`
- Codex Binary: `/usr/bin/codex`
- Codex Version: `codex-cli 0.142.4`

Erfolgreich getestet:

```bash
codex login --device-auth
codex login status
codex exec --ephemeral --skip-git-repo-check 'Antworte nur mit {"ok":true}'
```

Ergebnis:

- Loginstatus: `Logged in using ChatGPT`
- Codex Exec erfolgreich
- Modell im Testlauf: `gpt-5.5`
- Provider: `openai`
- Antwort: `{"ok":true}`

Hinweis:

- Codex meldete, dass `bubblewrap` nicht auf dem PATH gefunden wurde und vorerst ein gebundeltes Bubblewrap nutzt.
- Fuer einen saubereren Serverbetrieb sollte `bubblewrap` spaeter ueber apt installiert werden.

Naechster offener Schritt:

- OpenClaw auf Hetzner installieren.
- OpenClaw mit der vorhandenen Codex-Auth synchronisieren.
- `openclaw models status --json` pruefen.
- OpenClaw-Agentenlauf mit `gpt-5.5` testen.

## OpenClaw-Status vom 2026-06-30

OpenClaw wurde auf dem Hetzner-Server erfolgreich installiert und mit OpenAI/Codex-Auth verbunden.

Installiert:

- OpenClaw Binary: `/usr/bin/openclaw`
- OpenClaw Version: `2026.6.11`

Erfolgreich ausgefuehrt:

```bash
npm install -g openclaw
openclaw models auth login --provider openai --device-code --set-default
openclaw models status --json
```

Ergebnis:

- Default Model: `openai/gpt-5.5`
- Resolved Default: `openai/gpt-5.5`
- Allowed Models: `openai/gpt-5.5`
- Provider: `openai`
- Auth Status: usable
- Missing Providers: keine
- OAuth/Auth-Profil vorhanden

Ein direkter Gateway-Agentenlauf ohne Zielsession scheiterte erwartungsgemaess:

```text
Error: No target session selected.
```

Ein Gateway-Agentenlauf mit Zielsession scheiterte, weil Gateway-Credentials noch nicht eingerichtet sind:

```text
GatewayCredentialsRequiredError
```

Der lokale Embedded-Agentenlauf war erfolgreich:

```bash
openclaw agent \
  --local \
  --agent main \
  --session-key essenplanner:test \
  --message 'Antworte nur mit {"ok":true}' \
  --json \
  --timeout 180 \
  --thinking off
```

Ergebnis:

- Provider: `openai`
- Model: `gpt-5.5`
- Harness: `codex`
- Session Key: `agent:main:essenplanner:test`
- Antwort: `{"ok":true}`
- Stop reason: `stop`

Damit ist bewiesen:

- OpenClaw kann auf Hetzner mit `gpt-5.5` ueber Codex/OpenAI-Auth laufen.
- OpenClaw kann auf Hetzner Agentenantworten als JSON liefern.
- Fuer den MVP kann ein serverseitiger PlannerAdapter zunaechst den lokalen Embedded-Modus verwenden.

Noch offen:

- Gateway mit Token/Password absichern, falls die Web-App spaeter direkt ueber das Gateway statt ueber einen lokalen CLI-Adapter kommunizieren soll.
- Optional `bubblewrap` installieren, um die Codex-Sandbox-Warnung sauber zu beseitigen.
- Eigenen `essenplanner` Agent/Workspace bzw. Session-Konvention definieren.
- Test mit echtem Essenplanner-JSON-Schema ausfuehren.

## Essenplanner-Minitest vom 2026-07-03

Ein erster fachlicher Essenplanner-Test wurde auf Hetzner erfolgreich ausgefuehrt.

Kommando:

```bash
openclaw agent \
  --local \
  --agent main \
  --session-key essenplanner:mini:20260703 \
  --message '...' \
  --json \
  --timeout 240 \
  --thinking low
```

Ergebnis:

- Provider: `openai`
- Model: `gpt-5.5`
- Harness: `codex`
- Runner: `embedded`
- Stop reason: `stop`
- Dauer: ca. 35 Sekunden
- JSON-Antwort erfolgreich

Die Antwort enthielt:

- einen Montag-Plan,
- Fruehstueck, Mittagessen und Abendessen,
- getrennte Mahlzeiten fuer Buğra und Sena bei Fruehstueck/Mittag,
- gemeinsames Abendessen,
- Zutaten je Mahlzeit,
- konsolidierte Einkaufsliste.

Beispielhafte Mahlzeiten:

- Buğra Fruehstueck: Protein-Porridge mit Banane und Erdnussmus
- Sena Fruehstueck: Skyr-Bowl mit Beeren und Nuessen
- Buğra Mittag: Haehnchen-Reis-Box mit Gemuese
- Sena Mittag: Thunfisch-Salat mit Ei und Vollkornbrot
- Gemeinsames Abendessen: Lachs mit Kartoffeln und gruenem Gemuese

Wichtige Beobachtung:

- Die JSON-Struktur ist fuer den MVP brauchbar.
- Das endgueltige Schema muss noch strenger definiert und validiert werden.
- Fuer App-Integration sollte die OpenClaw-Ausgabe aus `payloads[0].text` extrahiert und gegen ein eigenes Schema validiert werden.
