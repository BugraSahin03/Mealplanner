# Technische Richtung

## Erste Entscheidung

Der erste produktive Stand soll als Web-App gebaut werden.

Gruende:

- Wochenplanung laesst sich in einer UI gut pruefen und bearbeiten.
- Office/Homeoffice-Tage pro Person lassen sich visuell gut setzen.
- Einkaufsliste kann sauber dargestellt, gruppiert und abgehakt werden.
- Sena kann einfach Zugriff bekommen.
- Deployment auf dem vorhandenen Hetzner-Server ist pragmatisch.

Es soll im MVP keine Login-Logik geben.

Stattdessen gibt es fest angelegte bzw. in der App bearbeitbare Profile:

- Buğra,
- Sena.

Begruendung:

- Die App laeuft privat ueber Tailscale.
- Es gibt nur zwei bekannte Nutzer.
- Login, Rollen und Sessions waeren fuer den Start Overkill.
- Die Energie soll in Wochenplanung, KI-Ausgabe und Einkaufsliste fliessen.

## Deployment-Idee

Die Anwendung soll perspektivisch auf dem vorhandenen Hetzner-Server laufen.

Zugriff:

- privat,
- ueber Tailscale,
- aehnlich wie bei BudgetBuddy.

Damit muss die App am Anfang nicht oeffentlich im Internet erreichbar sein und kann trotzdem bequem von Buğra und Sena genutzt werden.

## Naheliegende Architektur

Eine pragmatische erste Architektur:

- Web-App fuer UI,
- serverseitige API fuer Planung und Persistenz,
- Datenbank fuer Profile, Mahlzeiten, Wochenplaene und Einkaufslisten,
- LLM/Agent-Komponente fuer die Planerzeugung,
- strukturierte Ausgabe der KI, die die App speichern und bearbeiten kann.

## KI-Rolle

Die KI soll von Anfang an:

- Wochenplaene erzeugen,
- Zutaten je Mahlzeit liefern,
- grobe Mengen angeben,
- eine konsolidierbare Basis fuer die Einkaufsliste schaffen.

Die KI soll nicht nur Freitext ausgeben. Die App braucht strukturierte Daten, z. B. JSON, damit Plan und Einkaufsliste verlaesslich weiterverarbeitet werden koennen.

## KI-Kosten und Laufzeit

Fuer den MVP sollen keine separaten externen LLM-APIs genutzt werden.

Das bedeutet:

- keine OpenAI Platform API als App-Backend,
- keine kostenpflichtigen Drittanbieter-API-Aufrufe fuer jede Wochenplanung,
- keine Architektur, die zwingend eine API-Abrechnung pro Anfrage voraussetzt.

Bevorzugte Richtung ist stattdessen ein Agenten-Backend ueber OpenClaw oder Hermes, das mit ChatGPT/Codex-OAuth bzw. Codex-Auth auf dem VPS laeuft.

Moegliche Wege:

1. Lokales Modell auf dem Server oder im Heim-/Arbeitsumfeld
   - z. B. ein lokal betriebenes LLM.
   - Vorteil: keine API-Kosten pro Planung.
   - Nachteil: Qualitaet und Geschwindigkeit haengen stark von Hardware und Modell ab.

2. Codex-gestuetzter halbmanueller Workflow
   - Codex hilft beim Erzeugen oder Verbessern von Plaenen, aber nicht als unsichtbarer Runtime-Service der Web-App.
   - Vorteil: keine separate App-API-Integration.
   - Nachteil: weniger automatisiert fuer Sena und weniger fluessig in der Web-App.

3. Codex programmatisch einbinden
   - Codex bietet programmatische Schnittstellen, ist aber primaer ein Coding-Agent und nicht die naheliegendste Runtime fuer eine Essensplaner-Web-App.
   - Das waere eher eine spaetere Spezialloesung und muesste gesondert geprueft werden.

Fuer die erste echte App ist deshalb die pragmatischste Richtung: Die App wird so gebaut, dass sie strukturierte KI-Planung erwartet, aber die konkrete KI-Quelle austauschbar bleibt.

Aktuelle Integrationsidee:

- Next.js-App erzeugt einen Planungsauftrag.
- Ein `PlannerAdapter` sendet den Auftrag an OpenClaw oder Hermes.
- OpenClaw/Hermes nutzt OpenAI/Codex-Auth ueber das vorhandene Abo.
- Der Agent liefert JSON nach einem festen Schema.
- Die App validiert und speichert Wochenplan und Einkaufsliste.

## Planner-Jobs statt blockierender Button-Antwort

Die Wochenplanung soll im MVP als laenger laufender Job modelliert werden.

Begruendung:

- OpenClaw-Läufe dauern in den Tests deutlich laenger als eine normale UI-Sofortaktion.
- Eine komplette 7-Tage-Woche kann mehrere Minuten brauchen.
- Normale Web-Requests koennen bei langen LLM-Läufen abbrechen oder fuer den Nutzer wie eingefroren wirken.
- Die App soll robust bleiben, auch wenn OpenClaw langsam ist oder eine Antwort neu versucht werden muss.

Gewuenschter Ablauf:

1. Nutzer klickt `Wochenplan erstellen`.
2. Die App legt einen Planungsauftrag mit Status `running` an.
3. Der Server startet den OpenClaw-Aufruf im Hintergrund.
4. Die UI zeigt einen Fortschritts-/Wartestatus.
5. Nach Abschluss wird `payloads[0].text` extrahiert.
6. Die Antwort wird gegen `schemas/planner-response.schema.json` validiert.
7. Nur valide Plaene werden gespeichert und angezeigt.
8. Fehlerhafte oder abgebrochene Laeufe enden in `failed` mit sichtbarer Fehlermeldung.

Minimal benoetigte Job-Status fuer den MVP:

- `idle`
- `running`
- `success`
- `failed`

Diese Entscheidung bedeutet nicht, dass eine grosse Queue-Infrastruktur noetig ist. Fuer den Start reicht ein einfacher serverseitiger Job-Mechanismus, solange die UI nicht auf eine einzelne blockierende HTTP-Antwort angewiesen ist.

Erste MVP-Umsetzung:

- Planner-Jobs werden in `planner_jobs` gespeichert.
- Jeder Job speichert Request, Status, optionalen validierten Response sowie Fehlertext und Fehlercode.
- Die erlaubten Statuswechsel sind bewusst klein:
  - `idle -> running`,
  - `running -> success`,
  - `running -> failed`,
  - `failed -> running` fuer einen erneuten Versuch.
- Ein erfolgreicher Job darf nur mit einem strukturell validierten Planner-Response abgeschlossen werden.
- Die Planner-UI startet den konfigurierten Adapter: lokal standardmaessig Fixture, serverseitig optional OpenClaw CLI.
- Waehrend der Server Action wird der Job als `running` gespeichert; danach landet er je nach Adapter-Ergebnis in `success` oder `failed`.

OpenClaw-Adapter:

- Die Planerzeugung laeuft ueber ein `PlannerAdapter`-Interface.
- Lokal kann ein Fixture-Adapter genutzt werden.
- Auf dem Server kann `ESSENPLANNER_PLANNER_ADAPTER=openclaw-cli` den OpenClaw-CLI-Adapter aktivieren.
- Der CLI-Adapter baut den Prompt aus Planner-Request und `schemas/planner-response.schema.json`, fordert deutschsprachige sichtbare Inhalte an und validiert die extrahierte Antwort vor dem Speichern.

## Noch offen

- spaetere Entscheidung, ob OpenClaw dauerhaft per CLI-Adapter oder Gateway angebunden wird.
