# Parallel Development Workflow

Dieses Dokument beschreibt den verbindlichen Ablauf fuer Ticket-Branches und Worktrees.

## Grundprinzip

Die stabile Integrationsbasis ist `main` im Hauptordner:

```text
/Volumes/Intenso/Dev/Essenplanner
```

Jede produktive Arbeit wird isoliert umgesetzt:

- ein GitHub Issue
- ein Ticket-Branch
- ein eigener Git-Worktree
- ein klarer Write-Scope im Issue
- ein PR gegen `main`
- ein Review nur gegen den Diff dieses Tickets

Der Hauptordner bleibt auf `main`. Dort wird nicht direkt implementiert, sobald die Ticketarbeit mit Dev-/Reviewer-Rollen startet.

## Branch und Worktree pro Issue

Branch-Schema:

```text
issue/<github-nummer>-ep-<slug>
```

Worktree-Schema:

```text
../Essenplanner-issue-<github-nummer>
```

Beispiel fuer Issue `#1`:

```bash
cd /Volumes/Intenso/Dev/Essenplanner
git switch main
git pull --ff-only origin main
git worktree add ../Essenplanner-issue-1 -b issue/1-ep-001-projektgrundgeruest main
cd ../Essenplanner-issue-1
```

Auch wenn nur eine Entwickler-Instanz arbeitet, gilt derselbe Ablauf.

## Issue-Setup vor Arbeitsbeginn

Bevor ein Ticket auf `status:doing` gesetzt wird, muss das Issue enthalten:

- EP-Referenz
- Prioritaet
- MVP-Phase
- Ziel
- Akzeptanzkriterien
- Write-Scope
- Read-Scope
- Nicht-Ziele
- Abhaengigkeiten

Erst wenn Branch und Worktree existieren, wird das Issue auf `status:doing` gesetzt.

## Write-Scope

Der Write-Scope definiert, welche Dateien oder Ordner ein Entwickler aendern darf.

Wenn waehrend der Umsetzung ein anderer Bereich notwendig wird:

1. Entwickler stoppt.
2. Scope-Erweiterung wird im Issue dokumentiert.
3. Erst nach Klaerung wird weitergearbeitet.

Der Read-Scope darf breiter sein. Lesen ist erlaubt, Schreiben nur im Write-Scope.

## Umgang mit gemeinsamen Dateien

Konfliktanfaellig sind insbesondere:

- `docs/codex-workflow.md`
- `docs/review-workflow.md`
- `docs/parallel-development.md`
- `docs/technical-direction.md`
- `docs/planning-model.md`
- ADRs
- zentrale Konfigurationen

Regeln:

- Der Write-Scope im Issue ist fuehrend.
- ADRs werden nur angelegt, wenn eine grundlegende Entscheidung getroffen wurde.
- Wenn zwei Tickets dieselbe zentrale Datei stark veraendern muessen, werden sie nicht parallelisiert.

## Entwickler-Ablauf

1. `docs/codex-workflow.md`, `docs/parallel-development.md` und `docs/review-workflow.md` lesen.
2. GitHub Issue inkl. Write-Scope pruefen.
3. Von aktuellem `main` Branch und Worktree anlegen.
4. Issue auf `status:doing` setzen.
5. Nur Dateien im Write-Scope aendern.
6. Akzeptanzkriterien pruefen.
7. Tests/Build/Linting ausfuehren, soweit sinnvoll. Standard fuer frische Umgebungen: Node.js 22 aus `.nvmrc`, `npm ci`, dann `npm run check`.
8. PR gegen `main` mit `Closes #<issue>` erstellen.
9. Bei UI-/UX-nahen Tickets Preview aus dem Ticket-Worktree auf separatem Port starten und Issue auf `status:visual-check` setzen.
10. Nach `Visual Check OK` oder wenn kein Visual Check noetig ist: Handoff direkt an den Reviewer schreiben und Issue auf `status:review` setzen.
11. Bei `CHANGES_REQUESTED` im selben Worktree nacharbeiten.
12. Nach `APPROVED`, Merge und Cleanup den Dispatcher oder Nutzer nach dem naechsten Ticket fragen.

## Visual Check vor Review

Der Visual Check ist ein Produkt-/UI-Gate zwischen Entwickler und Reviewer.

Er wird genutzt bei:

- sichtbaren UI-Aenderungen,
- Bedienfluss,
- Layout,
- Textwirkung,
- Produktgefuehl.

Preview-Port-Regel:

- Der Hauptordner bleibt auf `main`.
- Ticket-Worktrees starten ihren Dev-Server auf einem anderen freien Port.
- Empfohlenes Schema: `3000 + Issue-Nummer`, falls frei und sinnvoll.
- Alternativ ein klar dokumentierter freier Port, z. B. `localhost:30101`.

Handoff fuer Visual Check:

```md
Issue: #1 ([EP-001])
Branch: issue/1-ep-001-projektgrundgeruest
Worktree: ../Essenplanner-issue-1
Preview: http://localhost:3001

Bitte pruefen:
- ...

Bekannte Restpunkte:
- ...
```

Erst nach `Visual Check OK` geht das Ticket an den Reviewer.

## Handoff an Reviewer

```md
Ticket: EP-xxx / #xxx
Branch/PR: ...
Status: ready for review

Zusammenfassung:
- ...

Checks:
- ...
- `npm run check`
- GitHub Actions CI: gruen oder begruendete Abweichung

Visual Check:
- erforderlich: ja/nein
- Nutzer-Go: ja/nein/nicht erforderlich

Repo-/GitHub-Zustand:
- Branch eindeutig: ja/nein
- Aenderungen nur im Write-Scope: ja/nein
- unzugeordnete lokale Aenderungen: ja/nein
- Issue/PR-Zuordnung eindeutig: ja/nein

Bekannte Risiken / Hinweise:
- ...

Bitte Review nach docs/review-workflow.md durchfuehren.
```

## Integration und Cleanup nach Freigabe

Nur nach `APPROVED`:

1. Branch gegen aktuellen `main` aktualisieren.
2. Checks erneut ausfuehren.
3. PR in `main` mergen, wenn `status:ready-to-merge` und CI gruen sind.
4. Issue auf `status:done` setzen und schliessen.
5. Entwickler loescht Ticket-Worktree sowie lokalen und Remote-Branch.

Beispiel:

```bash
cd /Volumes/Intenso/Dev/Essenplanner
git switch main
git pull --ff-only origin main
git worktree remove ../Essenplanner-issue-1
git branch -d issue/1-ep-001-projektgrundgeruest
git push origin --delete issue/1-ep-001-projektgrundgeruest
```

## Feste Paare

- `Dev 1` arbeitet mit `Reviewer 1`.
- `Dev 2` arbeitet mit `Reviewer 2`.

Dieses Pairing trennt parallele Arbeitsstraenge. Abweichungen muessen im Ticket/PR-Handoff dokumentiert werden.

## Ausnahmen

Gestapelte Branches sind kein Standardworkflow. Wenn eine Abhaengigkeit sie erfordert, muss dies im Issue und PR klar begruendet werden.
