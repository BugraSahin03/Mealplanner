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
- OpenClaw-Runtime: `docs/openclaw-runtime.md`
- Tests und Spikes: `docs/spikes/`
- Dev-/Reviewer-Prozess: `docs/review-workflow.md`
- Branches und Worktrees: `docs/parallel-development.md`
- Dispatcher-/Queue-Regeln: `docs/dispatcher-workflow.md`

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

## Einstieg fuer neue Instanzen

Vor produktiver Arbeit lesen:

1. `docs/product-understanding.md`
2. GitHub Issue
3. `docs/codex-workflow.md`
4. `docs/parallel-development.md`
5. `docs/review-workflow.md`
6. fuer fachliche Arbeit: `docs/planning-model.md`, `docs/mvp-scope.md`, `docs/planner-contract.md`
7. fuer OpenClaw-Arbeit: `docs/decision-agent-harness.md`, `docs/openclaw-runtime.md`, `docs/spikes/planner-schema-validation.md`

## Ticket-Arbeit

1. Issue lesen und Scope klaeren.
2. Von aktuellem `main` eigenen Branch und eigenen Worktree anlegen.
3. Issue auf `status:doing` setzen.
4. Nur Dateien im Write-Scope anfassen.
5. Relevante Entscheidungen in Docs oder ADRs festhalten.
6. Akzeptanzkriterien pruefen.
7. Tests ausfuehren.
8. PR gegen `main` erstellen.
9. Bei sichtbaren UI-Aenderungen lokale Preview bereitstellen und vom Nutzer pruefen lassen.
10. Nach Visual Check oder dokumentierter Nicht-Erforderlichkeit Issue auf `status:review` setzen.
11. Direkt an den festen Reviewer uebergeben.

## Dev-/Reviewer-Rollen

Essenplanner nutzt denselben Grundprozess wie BudgetBuddy:

- Entwickler implementiert Tickets.
- Reviewer prueft PRs.
- Reviewer entscheidet mit `APPROVED`, `CHANGES_REQUESTED` oder `BLOCKED`.
- Technisches Feedback laeuft direkt zwischen Entwickler und Reviewer.
- Nutzer bleibt Produktowner und entscheidet bei Visual Check, Fachfragen und unklaren Repo-/GitHub-Zustaenden.

Feste Paare:

- `Dev 1` -> `Reviewer 1`
- `Dev 2` -> `Reviewer 2`

Details:

- `docs/review-workflow.md`
- `docs/parallel-development.md`
- `docs/dispatcher-workflow.md`

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
