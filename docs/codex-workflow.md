# Codex-Workflow

Dieses Projekt orientiert sich an der bewaehrten BudgetBuddy-Arbeitsweise, aber in einer kleineren MVP-Variante.

## Quelle der Wahrheit

Aktive Arbeit wird ueber GitHub Issues gepflegt.

Projektwissen bleibt im Repo:

- Produktverstaendnis: `docs/product-understanding.md`
- MVP-Scope: `docs/mvp-scope.md`
- Planungsmodell: `docs/planning-model.md`
- Technik: `docs/technical-direction.md`
- Planner-Vertrag: `docs/planner-contract.md`
- Profil-Memory: `docs/profile-memory.md`
- Agenten-/OpenClaw-Entscheidungen: `docs/decision-agent-harness.md`
- Tests und Spikes: `docs/spikes/`

## Issue-Konvention

Issue-Titel nutzen eine EP-Referenz:

```text
[EP-001] Projektgrundgeruest erstellen
```

Empfohlene Felder im Issue:

- Prioritaet: `P0`, `P1`, `P2`
- MVP-Phase
- Ziel
- Akzeptanzkriterien
- Write-Scope
- Read-Scope
- Nicht-Ziele
- Abhaengigkeiten
- Notizen/Risiken

## Empfohlene Status

Status kann spaeter ueber Labels gepflegt werden:

- `status:todo`
- `status:doing`
- `status:visual-check`
- `status:review`
- `status:ready-to-merge`
- `status:done`
- `status:blocked`

Fuer den Start reicht es, wenn neue Issues mit klarem Scope und Akzeptanzkriterien angelegt werden.

## Ticket-Arbeit

1. Issue lesen und Scope klaeren.
2. Von aktuellem `main` arbeiten.
3. Nur Dateien im Write-Scope anfassen.
4. Relevante Entscheidungen in Docs oder ADRs festhalten.
5. Akzeptanzkriterien pruefen.
6. Tests ausfuehren.
7. PR gegen `main` erstellen.
8. Bei sichtbaren UI-Aenderungen lokale Preview bereitstellen und vom Nutzer pruefen lassen.

## BudgetBuddy-Muster, die uebernommen werden

- GitHub Issues statt dauerhaft gepflegter Markdown-Backlog-Datei.
- Klare Ticketnummern und Akzeptanzkriterien.
- Write-Scope und Read-Scope je Ticket.
- ADRs fuer grundlegende Architekturentscheidungen.
- Tailscale-only fuer privaten Produktivzugriff.
- systemd-Deployment auf Hetzner als pragmatische erste Betriebsform.

## Abweichungen von BudgetBuddy

- Essenplanner startet kleiner und mit nur zwei Profilen.
- Keine Login-/Rollenlogik im MVP.
- OpenClaw ist ein zentraler Runtime-Baustein fuer die Planerzeugung.
- Planner-Erzeugung wird als laenger laufender Job modelliert.
