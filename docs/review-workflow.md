# Review-Workflow

Alle produktiven Aenderungen gehen durch eine Reviewer-Instanz, bevor sie als abgeschlossen gelten.

## Ziel

Der Reviewer ist die letzte Qualitaetsinstanz. Er prueft, ob eine Entwickler-Instanz das GitHub Issue korrekt, sicher und im Sinne des Projekts umgesetzt hat.

## Rollen

### Entwickler

- bearbeitet genau ein GitHub Issue
- arbeitet auf eigenem Ticket-Branch und eigenem Worktree
- setzt das Issue erst nach Branch-/Worktree-Anlage auf `status:doing`
- haelt den vereinbarten Write-Scope ein
- implementiert die Aenderung
- prueft Akzeptanzkriterien
- fuehrt passende Checks aus
- dokumentiert neue Erkenntnisse und Entscheidungen
- stellt bei UI-/UX-nahen Tickets vor dem Review eine laufende Preview fuer den Nutzer bereit und setzt das Issue auf `status:visual-check`
- uebergibt die Aenderungen per PR direkt an den zugeordneten Reviewer
- arbeitet bei `CHANGES_REQUESTED` nach und pingt denselben Reviewer erneut

### Reviewer

- liest Projektkontext, Ticket und PR
- prueft die Aenderungen kritisch gegen Ticket, Scope und Projektregeln
- gibt klares Feedback direkt an den Entwickler
- entscheidet sichtbar im PR:
  - `APPROVED`
  - `CHANGES_REQUESTED`
  - `BLOCKED`
- ersetzt nicht den Nutzer als Produktowner
- setzt bei Freigabe das Issue auf `status:ready-to-merge`

## Feste Dev-Reviewer-Paare

Standardmaessig gelten feste Paare:

- `Dev 1` uebergibt an `Reviewer 1`.
- `Dev 2` uebergibt an `Reviewer 2`.

Abweichungen muessen im PR- oder Ticket-Handoff begruendet werden.

Der Nutzer wird nur eingebunden bei:

- Visual Check, sofern erforderlich,
- fachlichen oder produktseitigen Unsicherheiten,
- Blockern, die der Reviewer nicht klaeren kann,
- unklaren Repo-/GitHub-Zustaenden,
- Scope-Verletzungen oder unerwarteten lokalen Aenderungen.

Technisches Review-Pingpong laeuft direkt zwischen Entwickler und Reviewer.

## Reviewer-Entscheidungen

Der Reviewer trifft genau eine Entscheidung.

### APPROVED

Die Aenderung ist freigegeben.

Der Reviewer schreibt einen strukturierten PR-Kommentar:

```md
Entscheidung: APPROVED

Geprueft:

- Ticket-Akzeptanzkriterien
- Write-Scope
- relevante Projektdokumente
- Tests/Build soweit vorhanden

Rest-Risiko:

- ...
```

Danach wird das Issue auf `status:ready-to-merge` gesetzt.

### CHANGES_REQUESTED

Die Aenderung muss vom Entwickler angepasst werden.

Der Reviewer schreibt konkrete, umsetzbare Findings:

```md
Entscheidung: CHANGES_REQUESTED

Findings:

1. [P1] Kurzer Titel
   Datei: `pfad/zur/datei`
   Problem: ...
   Erwartung: ...

2. [P2] Kurzer Titel
   Datei: `pfad/zur/datei`
   Problem: ...
   Erwartung: ...

Freigabe-Bedingung:

- ...
```

Das Issue bleibt offen und geht zurueck an den Entwickler.

### BLOCKED

Das Review kann nicht sinnvoll abgeschlossen werden.

Beispiele:

- Ticket ist unklar.
- PR passt nicht zum Issue.
- Branch-/Diff-Zustand ist widerspruechlich.
- benoetigte fachliche Entscheidung fehlt.
- lokale Aenderungen koennen keinem Ticket zugeordnet werden.

Der Reviewer dokumentiert den Blocker im PR und Issue. Es gibt keine Freigabe.

## Pflichtpruefung im Review

Der Reviewer prueft standardmaessig nur den Ticket-Diff gegen `main`.

Pflicht:

```bash
git diff --name-only main...HEAD
git diff main...HEAD
```

Pruefkriterien:

- Erfuellt die Aenderung das Issue und die Akzeptanzkriterien?
- Sind alle geaenderten Dateien im Write-Scope?
- Gibt es Scope Creep?
- Stimmen die Aenderungen mit `docs/product-understanding.md`, `docs/mvp-scope.md`, `docs/planning-model.md`, `docs/technical-direction.md` und ADRs ueberein?
- Wurden neue Erkenntnisse dokumentiert?
- Wurde bei grundlegenden Entscheidungen eine ADR angelegt?
- Sind Secrets, Tokens, private Daten und Zugangsdaten vermieden?
- Sind Tests, Linting oder Build ausgefuehrt, soweit sinnvoll?
- Gibt es offensichtliche Bugs, Datenverlust-Risiken oder falsche Planungslogik?
- Bei UI-/UX-nahen Tickets: Wurde der vorgeschaltete Visual Check freigegeben oder als nicht erforderlich dokumentiert?

Wenn Dateien ausserhalb des Write-Scopes ohne dokumentierte Begruendung geaendert wurden, ist die Standardentscheidung:

```text
Entscheidung: CHANGES_REQUESTED
```

## Merge-Gate

Vor jedem Merge muessen alle Punkte erfuellt sein:

- Reviewer-Entscheidung ist `APPROVED`.
- Issue steht auf `status:ready-to-merge`.
- CI ist gruen oder fehlende CI wurde im PR begruendet.
- Bei UI-/UX-Tickets liegt `Visual Check OK` vor oder die Nicht-Erforderlichkeit ist dokumentiert.

Bei letzter Entscheidung `CHANGES_REQUESTED` darf nicht gemerged werden.

## Statuslauf

Standard:

```text
status:todo -> status:doing -> status:review -> status:ready-to-merge -> status:done
```

Mit Visual Check:

```text
status:todo -> status:doing -> status:visual-check -> status:review -> status:ready-to-merge -> status:done
```

Bei Blocker:

```text
status:blocked
```
