# Entscheidung: Agent Harness fuer Essenplanner

Datum: 2026-06-30

## Entscheidung

Fuer Essenplanner wird zuerst **OpenClaw** als Agent-Harness verwendet.

Hermes bleibt eine sinnvolle Fallback-Option, falls OpenClaw auf Hetzner nicht stabil mit Codex/OAuth laeuft oder die Integration fuer die Web-App unnoetig kompliziert wird.

## Kontext

Essenplanner braucht keine allgemeine Chatbot-Erfahrung als Hauptprodukt. Die Web-App braucht eine verlaessliche Planungsmaschine:

- Wochenkontext rein,
- Profile rein,
- strukturierter Wochenplan raus,
- Zutaten und grobe Mengen raus,
- konsolidierbare Einkaufsliste raus.

Die KI-Komponente muss daher vor allem als **strukturierter Planner** funktionieren, nicht als offener persoenlicher Chat.

## Anforderungen

### Muss

- Nutzung von ChatGPT/Codex-Auth statt klassischer OpenAI-Platform-API.
- Betrieb auf Hetzner moeglich.
- Private Erreichbarkeit ueber Tailscale oder lokale interne Kommunikation.
- Maschinell auswertbare JSON-Ausgabe.
- Wiederholbarer Wochenplan-Lauf.
- Sicherheitsmodell passend fuer einen privaten, vertrauenswuerdigen Haushalt.

### Soll

- Einfache Integration in Next.js.
- Gute Diagnosemoeglichkeiten.
- Spaetere Telegram- oder Chat-Anbindung moeglich.
- Agent sollte als Service laufen koennen.

## OpenClaw Bewertung

### Staerken

- Lokal bereits installiert und getestet.
- Lokal ist `openai-codex` als Provider aktiv.
- Lokal existiert ein OAuth-Profil.
- Lokaler Agentenlauf mit `gpt-5.4-mini` hat JSON erzeugt.
- OpenClaw dokumentiert OpenAI/Codex OAuth explizit fuer externe Tools.
- OpenClaw hat einen Gateway-Betrieb fuer dauerhafte Hosts.
- OpenClaw dokumentiert Remote-Gateway-Betrieb ueber VPS/Tailscale/SSH.
- OpenClaw hat eine gezielte Codex-Harness-Dokumentation.
- OpenClaw CLI kann Agentenlaeufe mit `--json` ausgeben.

### Schwaechen

- Integration fuer externe Apps laeuft primaer ueber WebSocket Gateway RPC.
- Es gibt laut Doku noch kein oeffentliches npm Client Package.
- HTTP-RPC existiert als Admin-Plugin, ist aber ein voller Control-Plane-Zugang und muss sehr vorsichtig genutzt werden.
- Lokale OpenClaw-Version war aelter als die Config. Update vor Hetzner-Test ist Pflicht.

### Bewertung fuer Essenplanner

OpenClaw passt gut, weil die kritische Annahme bereits lokal bewiesen wurde. Fuer den MVP kann die Next.js-App zunaechst einen `PlannerAdapter` bauen, der lokal/serverseitig einen kontrollierten OpenClaw-Agentenlauf startet und die JSON-Antwort validiert.

Spaeter kann diese Integration auf Gateway WebSocket RPC oder einen eng begrenzten internen HTTP-RPC-Weg umgestellt werden.

## Hermes Bewertung

### Staerken

- Hermes unterstuetzt OpenAI Codex Provider mit Device-Code-Auth.
- Hermes kann vorhandene Codex CLI Credentials importieren.
- Hermes hat einen OpenAI-kompatiblen HTTP API Server.
- Das ist fuer eine Next.js-Web-App sehr attraktiv, weil HTTP einfacher ist als ein eigener WebSocket-RPC-Client.
- Hermes ist stark bei Messaging, Telegram und immer laufenden Bot-Setups.
- Hermes hat ein breites Provider- und Skill-System.

### Schwaechen

- Lokal nicht installiert.
- Fuer dieses Projekt noch nicht getestet.
- Kein lokaler Beweis, dass Hermes mit Buğras Codex/OAuth-Setup Planungs-JSON erzeugt.
- Mehr Installations- und Vergleichsaufwand vor dem MVP.
- Hermes wirkt fuer diesen Use Case staerker als vollwertiger persoenlicher Agent/Bot, waehrend Essenplanner primaer eine Web-App mit Planungsbackend braucht.

### Bewertung fuer Essenplanner

Hermes waere besonders interessant, wenn Telegram der erste Hauptkanal waere oder wenn wir eine OpenAI-kompatible HTTP-Schnittstelle als wichtigsten Integrationspunkt priorisieren.

Da die Web-App aber das Hauptprodukt ist und OpenClaw bereits lokal mit Codex/OAuth funktioniert, ist Hermes fuer den Start nicht die beste erste Wahl.

## Vergleich

| Kriterium | OpenClaw | Hermes | Bewertung |
| --- | --- | --- | --- |
| Lokal bereits vorhanden | Ja | Nein | OpenClaw klar besser |
| Codex/OAuth lokal bewiesen | Ja | Nein | OpenClaw klar besser |
| JSON-Agentenlauf lokal bewiesen | Ja | Nein | OpenClaw klar besser |
| Hetzner/VPS-Konzept | Gut dokumentiert | Gut moeglich | Unentschieden |
| Web-App-Integration | WebSocket/CLI/optional Admin HTTP | OpenAI-kompatibler HTTP API Server | Hermes technisch bequemer |
| Telegram/Bot-Fokus | Vorhanden | Sehr stark | Hermes besser |
| Codex-Harness-Fokus | Sehr stark | Optional | OpenClaw besser |
| Risiko fuer Start | Niedriger, weil getestet | Hoeher, weil ungetestet | OpenClaw besser |
| Langfristige Flexibilitaet | Hoch | Hoch | Unentschieden |

## Finaler Beschluss

**OpenClaw wird fuer den ersten echten Hetzner-Test und den MVP verwendet.**

Begruendung:

1. Der wichtigste Risikopunkt wurde lokal bereits mit OpenClaw positiv getestet.
2. OpenClaw erkennt Codex/OAuth im vorhandenen Setup.
3. OpenClaw erzeugte bereits JSON ueber `openclaw agent --json`.
4. OpenClaw ist explizit fuer Gateway-/Remote-Setups auf persistenten Hosts dokumentiert.
5. OpenClaw hat eine konkrete Codex-Harness-Schiene, die genau zu ChatGPT/Codex-Auth passt.

Hermes bleibt als Fallback, falls:

- OpenClaw auf Hetzner kein stabiles Codex/OAuth hinbekommt,
- OpenClaw-Gateway/CLI-Integration im Web-App-Betrieb zu fragil wird,
- wir Telegram als primaeres Interface vorziehen,
- oder der OpenAI-kompatible Hermes-API-Server die Integration deutlich vereinfacht.

## Vorgeschlagener Testplan

### Phase 1: OpenClaw auf Hetzner beweisen

1. OpenClaw aktualisieren bzw. frisch installieren.
2. Codex/OpenAI-Auth per Device Code oder OpenClaw-Provider-Login einrichten.
3. `openclaw models status --json` pruefen.
4. Gateway lokal/Tailscale-only starten.
5. Mini-Agentenlauf:

```bash
openclaw agent \
  --agent essenplanner \
  --session-key essenplanner:test \
  --message 'Antworte nur mit {"ok":true}' \
  --json \
  --timeout 180
```

6. Danach Test mit Essenplanner-Minischema.

### Phase 2: Essenplanner PlannerAdapter

1. Finales JSON-Schema definieren.
2. Next.js serverseitig einen OpenClaw-Adapter bauen.
3. Agentenantwort parsebar machen.
4. JSON gegen Schema validieren.
5. Fehlerfall sauber anzeigen.

### Phase 3: Entscheidung bestaetigen oder Fallback

OpenClaw bleibt, wenn:

- Hetzner-Auth stabil ist,
- Gateway/Agentenlauf wiederholbar funktioniert,
- JSON-Schema zuverlaessig eingehalten wird,
- Laufzeit fuer Wochenplan akzeptabel ist.

Hermes wird getestet, wenn einer dieser Punkte scheitert.

## Quellen

- OpenClaw OAuth: https://docs.openclaw.ai/concepts/oauth
- OpenClaw OpenAI Provider: https://docs.openclaw.ai/providers/openai
- OpenClaw Codex Harness: https://docs.openclaw.ai/plugins/codex-harness
- OpenClaw Gateway Protocol: https://docs.openclaw.ai/gateway/protocol
- OpenClaw External Apps: https://docs.openclaw.ai/gateway/external-apps
- OpenClaw Remote Gateway: https://docs.openclaw.ai/gateway/remote
- Hermes Providers: https://hermes-agent.nousresearch.com/docs/integrations/providers
- Hermes Programmatic Integration: https://hermes-agent.nousresearch.com/docs/developer-guide/programmatic-integration
- Hermes API Server: https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server
- Hermes Messaging Gateway: https://hermes-agent.nousresearch.com/docs/user-guide/messaging/
