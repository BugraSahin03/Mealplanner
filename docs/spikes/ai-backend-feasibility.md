# Spike: KI-Backend-Feasibility

Datum: 2026-06-29

## Fragestellung

Bevor die Web-App gebaut wird, sollte geklaert werden, ob die zentrale Annahme funktioniert:

Kann Essenplanner ueber ein Agenten-Backend mit OpenAI/Codex-Auth Wochenplaene, Zutaten und Einkaufslisten erzeugen, ohne eine klassische OpenAI-Platform-API in die App einzubauen?

## Kurzfazit

Ja, der Ansatz ist grundsaetzlich machbar.

Es wurden zwei wichtige Dinge erfolgreich getestet:

1. `codex exec` kann mit vorhandener Codex-Auth eine strukturierte JSON-Antwort nach Schema erzeugen.
2. OpenClaw kann ueber Gateway und `openai-codex`-Provider einen Agentenlauf mit `gpt-5.4-mini` ausfuehren und JSON-Text zurueckgeben.

Damit ist die Grundidee tragfaehig:

```text
Web-App
  -> Planner Adapter
  -> OpenClaw Gateway/Agent
  -> openai-codex Provider via OAuth
  -> JSON-Wochenplan + Einkaufsliste
```

## Lokale Umgebung

Gefunden:

- Codex CLI: `/Applications/Codex.app/Contents/Resources/codex`
- Codex Version: `codex-cli 0.142.3`
- OpenClaw: `/Users/Bugra/.openclaw/bin/openclaw`
- OpenClaw Version: `2026.4.15`
- Node: `v22.22.0`

Hinweis:

- OpenClaw-Konfiguration wurde zuletzt von einer neueren Version geschrieben: `2026.4.20`.
- Installierte OpenClaw-Version ist `2026.4.15`.
- Ein Update ist verfuegbar.

## Test 1: Codex CLI mit Output-Schema

Es wurde ein kleines JSON-Schema unter `docs/spikes/meal-plan-schema.json` angelegt.

Der Test:

- `codex exec`
- `--output-schema docs/spikes/meal-plan-schema.json`
- Prompt fuer einen Montag mit Buğra und Sena
- Ausgabe nach `/tmp/essenplanner-codex-spike.json`

Ergebnis:

- erfolgreich
- JSON parsebar
- 1 Tag
- 5 Mahlzeiten
- 28 Einkaufsposten
- Beispiel-Abendessen: `Lachs mit Kartoffeln und Ofengemüse`

Wichtig:

- Dieser Weg beweist, dass Codex mit vorhandener Auth strukturierte Planungsdaten erzeugen kann.
- Fuer die Web-App ist `codex exec` allein aber eher ein direkter CLI-Pfad, nicht unbedingt die schoenste Runtime-Integration.

## Test 2: OpenClaw Status und Modellkonfiguration

`openclaw status` und `openclaw models status --json` zeigten:

- Telegram ist konfiguriert und OK.
- OpenClaw hat OpenAI-Codex-Credentials aus der externen CLI synchronisiert.
- Default-Modell: `openai-codex/gpt-5.4-mini`
- Erlaubte Modelle:
  - `openai-codex/gpt-5.4`
  - `openai-codex/gpt-5.4-mini`
- OAuth-Profil vorhanden und Status OK.

Damit ist die zentrale Annahme bestaetigt: OpenClaw kann in dieser Umgebung Codex/OpenAI-OAuth als Modellquelle nutzen.

## Test 3: OpenClaw Gateway und Agentenlauf

Gateway wurde lokal gestartet:

```text
openclaw gateway run --bind loopback --auth none --force --port 18789 --compact
```

Ergebnis:

- Gateway startete erfolgreich auf `127.0.0.1:18789`.
- Gateway meldete Agent-Modell: `openai-codex/gpt-5.4-mini`.
- Agentenlauf ueber `openclaw agent --json` war erfolgreich.
- Provider: `openai-codex`
- Modell: `gpt-5.4-mini`
- Ergebnis: JSON-Text mit Tagesplan und Einkaufsliste.

Der Gateway-Prozess wurde nach dem Test wieder beendet.

## Was damit bewiesen ist

- Der Agentenpfad ist nicht nur theoretisch.
- OpenClaw ist bereits installiert.
- OpenClaw sieht Codex/OAuth-Credentials.
- OpenClaw kann GPT/Codex im Hintergrund nutzen.
- OpenClaw kann ueber Gateway/Agent eine Planungsantwort erzeugen.
- Die Web-App kann prinzipiell einen Planner-Adapter bekommen, der diesen Agentenpfad nutzt.

## Was noch nicht final bewiesen ist

1. Finales JSON-Schema
   - Der OpenClaw-Agent antwortete mit JSON, aber noch nicht nach unserem finalen Essenplanner-Schema.
   - Das muss ueber Prompt, Adapter und Validierung geloest werden.

2. Stabiler VPS-Betrieb
   - Der Test lief lokal.
   - Auf Hetzner muss OpenClaw installiert, aktualisiert und mit Codex/Auth eingerichtet werden.

3. Auth-Langlebigkeit
   - OAuth funktioniert lokal.
   - Es muss geprueft werden, wie stabil Refresh/Session auf dem VPS langfristig laeuft.

4. Sicherheit
   - Der Test lief lokal mit `--auth none`, nur auf Loopback.
   - Fuer Produktion braucht der interne App-zu-Agenten-Zugriff ein Secret oder Token.
   - Zugriff sollte Tailscale-only bzw. intern bleiben.

5. OpenClaw-Version
   - Lokale Config wurde von `2026.4.20` geschrieben, installierte Version ist `2026.4.15`.
   - Vor weiterer Integration sollte OpenClaw aktualisiert werden.

## Architekturentscheidung

Die App soll nicht davon ausgehen, dass sie direkt eine externe LLM-API anspricht.

Stattdessen:

- `PlannerAdapter` als interne Schnittstelle,
- erster Adapter: Dummy-/Fixture-Planner fuer UI-Entwicklung,
- zweiter Adapter: OpenClaw-Agent ueber Gateway,
- Validierung aller Agentenantworten gegen ein JSON-Schema,
- Speicherung erst nach erfolgreicher Validierung.

## Naechste Schritte

1. Finales Essenplanner-Planungsschema definieren.
2. OpenClaw auf aktuelle Version bringen.
3. Einen gezielten OpenClaw-Agentenprompt fuer Essenplanner erstellen.
4. Testen, ob OpenClaw wiederholt schema-konformes JSON liefert.
5. Dann erst mit Web-App-Projektgeruest starten.

Ergaenzender Hetzner-Auth-Spike: `docs/spikes/hetzner-agent-auth.md`
