# KI-Strategie

## Grundsatz

Die App soll KI nutzen, aber fuer den MVP keine externen LLM-APIs voraussetzen.

Die KI soll Wochenplaene und Einkaufslisten erzeugen, aber die Anwendung soll technisch nicht fest an einen bestimmten Anbieter oder eine kostenpflichtige API gebunden werden.

Aktuelle bevorzugte Richtung: Eine Agenten-Schicht wie OpenClaw oder Hermes laeuft auf dem VPS und nutzt ChatGPT/Codex-OAuth bzw. Codex-Auth statt einer klassischen OpenAI-API-Key-Integration. Die Web-App kommuniziert mit dieser Agenten-Schicht und bekommt strukturierte Planungsdaten zurueck.

## Was die KI liefern muss

Die KI soll strukturierte Daten erzeugen:

- Wochenplan fuer sieben Tage,
- Fruehstueck, Mittagessen und Abendessen,
- Beruecksichtigung von Buğra und Sena,
- Beruecksichtigung von Office/Homeoffice je Tag,
- Zutaten je Mahlzeit,
- grobe Mengen,
- konsolidierbare Einkaufsliste.

Freitext allein reicht nicht. Die App braucht JSON bzw. ein internes Schema.

## Profilinformationen fuer die KI

Pro Profil:

- Name,
- Ziel,
- Tageskalorienziel als grober Richtwert,
- optionale Lieblingsgerichte,
- optionale Vorlieben,
- optionale Abneigungen.

Wenn Lieblingsgerichte vorhanden sind, kann die KI sie teilweise als Grundlage verwenden. Wenn nicht, soll sie frei planen, solange Ziel, Kalorienrahmen und Wochenkontext beachtet werden.

## Wichtig: Codex vs. Runtime-KI

Codex ist ideal, um diese App mitzuentwickeln, Code zu schreiben, Datenmodelle zu bauen, Prompts zu verbessern und Planungslogik zu testen.

Die dauerhaft laufende Web-App braucht aber zur Planungszeit trotzdem irgendeine KI-Quelle, wenn sie automatisch Wochenplaene erzeugen soll.

Ohne externe API gibt es fuer den MVP mehrere realistische Optionen.

## Wichtige Klaerung: Agent, Gateway und Modell

Ein Agent wie Hermes oder OpenClaw ist nicht automatisch selbst das grosse Sprachmodell.

Typischerweise gibt es drei Schichten:

1. Interface
   - z. B. Telegram, Web-App oder Discord.

2. Agent/Gateway
   - z. B. Hermes oder OpenClaw.
   - Laeuft auf einem Laptop, Server oder VPS.
   - Verwaltet Nachrichten, Tools, Speicher, Sessions und Automationen.

3. LLM/Inferenz
   - Das eigentliche Modell, das denkt und Text/JSON erzeugt.
   - Kann ueber einen externen Anbieter laufen.
   - Kann lokal laufen, braucht dann aber passende Hardware.
   - Kann ueber ein Portal-, OAuth- oder Abo-Modell laufen.

Das erklaert, warum ein Telegram-Agent bei anderen gut funktionieren kann, ohne dass deren Laptop dauerhaft ein grosses Modell ausfuehrt. Oft laeuft nur der Agent leichtgewichtig auf einem VPS, waehrend die Modellanfragen remote verarbeitet werden.

Fuer Essenplanner bedeutet das: Hermes/OpenClaw koennen moeglicherweise als Agenten- oder Gateway-Schicht helfen, ersetzen aber nicht automatisch die Frage, wo das eigentliche LLM laeuft.

Wenn Hermes/OpenClaw ueber OpenAI Codex OAuth bzw. ChatGPT/Codex-Subscription-Auth konfiguriert wird, ist die Modellquelle praktisch GPT/Codex ueber das bestehende Abo. Dann muss auf Buğras Rechner kein lokales LLM laufen.

## Option A: Lokales LLM

Ein lokales Modell laeuft auf dem Hetzner-Server oder einem anderen privaten Rechner und wird von der App angesprochen.

Vorteile:

- keine API-Kosten pro Wochenplanung,
- privat betreibbar,
- gut passend zu Tailscale-Setup.

Nachteile:

- Qualitaet kann schlechter sein als bei grossen Cloud-Modellen,
- Hardware des Servers begrenzt Geschwindigkeit und Modellgroesse,
- strukturierte JSON-Ausgabe muss besonders gut validiert werden.

Wichtig: Lokal heisst nicht zwingend auf Buğras eigenem Computer. Es koennte auch ein privater Server, ein GPU-Server oder ein anderer Dienst im eigenen Netzwerk sein. Ein normaler kleiner Hetzner-VPS ist fuer gute grosse LLMs aber wahrscheinlich nicht ideal, wenn keine GPU vorhanden ist.

## Option B: Codex-gestuetzter Import

Codex erzeugt im Chat oder ueber einen Entwicklungsworkflow einen Wochenplan mit Einkaufsliste. Die App kann diese strukturierten Daten importieren oder manuell uebernehmen.

Vorteile:

- keine separate LLM-API in der App,
- sehr schnell fuer erste Tests,
- gute Qualitaet durch Codex-Unterstuetzung.

Nachteile:

- nicht vollautomatisch in der Web-App,
- weniger bequem fuer Sena,
- eher Zwischenloesung als finales Produktgefuehl.

## Option C: Codex programmatisch einbinden

Codex bietet programmatische Schnittstellen. Fachlich ist Codex aber primaer ein Coding-Agent. Fuer eine Essensplaner-Runtime ist das nicht die erste Wahl.

Diese Option sollte nur spaeter geprueft werden, falls lokale Modelle nicht reichen und trotzdem keine klassische API genutzt werden soll.

## Option D: Hermes oder OpenClaw als Agent-Schicht

Hermes oder OpenClaw koennten als eigene Agent-Schicht neben der Web-App laufen.

Moegliche Rolle:

- Wochenplanung per Telegram ausloesen,
- Plan als JSON oder Markdown erzeugen,
- Ergebnis in die Essenplanner-App importieren,
- spaeter eventuell direkt ueber eine interne Schnittstelle mit der App sprechen.
- OpenAI/Codex-Auth ueber bestehendes ChatGPT-/Codex-Abo nutzen.

Vorteile:

- bereits auf Chat- bzw. Telegram-Nutzung ausgelegt,
- kann auf einem VPS dauerhaft laufen,
- passt zu einem persoenlichen Agenten-Setup.

Nachteile:

- braucht trotzdem eine Modellquelle,
- kann zusaetzliche Komplexitaet neben der Web-App erzeugen,
- direkte Integration in die Web-App muss gesondert gebaut werden.
- OAuth-/Token-Zustand muss auf dem VPS stabil bleiben.
- Codex-Runtimes sind urspruenglich stark auf Coding-Agenten ausgelegt und muessen fuer Essensplanung als strukturierter Planner getestet werden.

Fuer den Start ist diese Option die bevorzugte echte KI-Richtung, sollte aber die UI-Entwicklung nicht blockieren.

## Zielarchitektur fuer Agenten-Integration

```text
Next.js Web-App
  -> Planner Adapter
  -> Hermes/OpenClaw Agent auf VPS
  -> OpenAI Codex OAuth / ChatGPT-Codex-Auth
  -> strukturierter Wochenplan + Einkaufsliste
```

Wichtige Anforderungen:

- Die Web-App spricht den Agenten nur ueber Tailscale oder ein internes Netzwerk an.
- Zwischen Web-App und Agent sollte ein einfaches internes Secret oder Token genutzt werden.
- Der Agent muss angewiesen werden, JSON nach unserem Schema zurueckzugeben.
- Die App validiert das JSON, bevor es gespeichert wird.
- Der Agent sollte in einem eigenen, harmlosen Arbeitsverzeichnis laufen.
- Tools, Shell-Zugriff und Dateizugriff sollten so begrenzt werden, dass eine Essensplanung keine unnoetigen Systemrechte bekommt.

## Empfehlung

Die App sollte mit einer austauschbaren Planungs-Schnittstelle gebaut werden.

Erste Umsetzung:

1. Dummy-Generator mit festen Beispielplaenen fuer UI und Datenmodell.
2. Strukturierte JSON-Schemas fuer KI-Ausgaben.
3. OpenClaw/Hermes-Experiment mit Codex-/ChatGPT-OAuth als erster echter Automatisierungspfad.
4. Optional Codex-gestuetzter Import als Zwischenweg fuer hochwertige Plaene.

So kann die App sofort gebaut werden, ohne die KI-Frage zu frueh festzunageln.

## Feasibility-Status

Am 2026-06-29 wurde ein technischer Spike durchgefuehrt.

Ergebnis:

- Codex CLI ist installiert und kann mit `--output-schema` strukturierte JSON-Ausgaben erzeugen.
- OpenClaw ist installiert.
- OpenClaw erkennt `openai-codex` als Provider.
- OpenClaw hat OAuth-Credentials aus der externen CLI synchronisiert.
- Ein lokaler OpenClaw-Gateway konnte gestartet werden.
- Ein OpenClaw-Agentenlauf mit `gpt-5.4-mini` erzeugte eine JSON-Planungsantwort.

Details: `docs/spikes/ai-backend-feasibility.md`

## Harness-Entscheidung

Am 2026-06-30 wurde OpenClaw gegen Hermes fuer diesen Use Case bewertet.

Entscheidung:

- OpenClaw wird zuerst verwendet.
- Hermes bleibt Fallback.

Details: `docs/decision-agent-harness.md`
