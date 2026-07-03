# Dispatcher-Workflow

Der Dispatcher ist eine optionale Koordinationsinstanz fuer freie Entwickler-Instanzen.

Zum Start kann der Nutzer diese Rolle selbst uebernehmen. Sobald mehrere Dev-/Reviewer-Paare parallel arbeiten, kann ein eigener Dispatcher-Thread genutzt werden.

## Ziel

Der Dispatcher sorgt dafuer, dass:

- Entwickler wissen, welches Ticket sie als naechstes nehmen sollen,
- Prioritaeten und Abhaengigkeiten beachtet werden,
- riskante Parallelisierung vermieden wird,
- UI-/Visual-Check-Pflichten sichtbar bleiben,
- unklare Repo-/GitHub-Zustaende an den Nutzer eskaliert werden.

Der Dispatcher ersetzt nicht den Nutzer als Produktowner und ersetzt nicht den Reviewer.

## Rollenabgrenzung

### Nutzer

Der Nutzer entscheidet bei:

- Produkt-/Fachfragen,
- Visual Check bei UI-/UX-Tickets,
- Prioritaetskonflikten,
- unklaren GitHub-/Repo-Zustaenden,
- lokalen Aenderungen, die keinem Ticket eindeutig zugeordnet sind,
- Branch-/PR-/Merge-Ungereimtheiten,
- finalen Prozessanpassungen.

### Dispatcher

Der Dispatcher darf:

- offene Tickets lesen,
- Prioritaeten und Abhaengigkeiten bewerten,
- naechste Tickets an freie Entwickler empfehlen,
- Parallelisierbarkeit einschaetzen,
- Visual-Check-Pflichten hervorheben,
- bei Unsicherheit den Nutzer fragen.

Der Dispatcher darf nicht:

- fachliche Entscheidungen fuer den Nutzer treffen,
- Reviews ersetzen,
- Merge-Freigaben geben,
- unklare lokale Aenderungen autonom zuordnen,
- widerspruechliche GitHub-Zustaende stillschweigend reparieren,
- Tickets ohne Rueckfrage stark umpriorisieren.

### Entwickler

Der Entwickler fragt den Dispatcher oder Nutzer nach dem naechsten Ticket, arbeitet im Ticket-Worktree und uebergibt nach Umsetzung direkt an den Reviewer.

### Reviewer

Der Reviewer prueft PRs nach `docs/review-workflow.md` und meldet `APPROVED`, `CHANGES_REQUESTED` oder `BLOCKED` direkt an den Entwickler zurueck.

## Feste Dev-Reviewer-Paare

- `Dev 1` uebergibt an `Reviewer 1`.
- `Dev 2` uebergibt an `Reviewer 2`.

Ausnahmen muessen im Ticket/PR-Handoff dokumentiert werden.

## Standardfluss

1. Entwickler fragt Dispatcher oder Nutzer: `Welches Ticket soll ich als naechstes uebernehmen?`
2. Dispatcher nennt ein konkretes Ticket und begruendet knapp.
3. Entwickler liest Ticket und Projektdoku.
4. Entwickler arbeitet im eigenen Worktree.
5. Bei UI-/UX-Tickets stellt Entwickler Preview bereit und fragt Nutzer nach Visual Check.
6. Nach `Visual Check OK` oder wenn kein Visual Check noetig ist, pingt Entwickler direkt den Reviewer.
7. Reviewer prueft.
8. Bei `CHANGES_REQUESTED` arbeitet Entwickler nach und pingt Reviewer erneut.
9. Bei `APPROVED` finalisiert der Entwickler gemaess Workflow.
10. Entwickler fragt Dispatcher oder Nutzer nach dem naechsten Ticket.

## Ticket-Auswahlregeln

Der Dispatcher beachtet:

1. `P0` vor `P1` vor `P2`.
2. Fundament-Tickets vor abhaengigen Features.
3. Abhaengigkeiten aus dem Issue.
4. Write-Scope-Konflikte zwischen parallelen Tickets.
5. UI-/UX-Tickets brauchen in der Regel Visual Check.
6. Keine Zuweisung bei unklarem Issue-, Branch-, PR- oder Abhaengigkeitsstatus.

## Repo-/GitHub-Eskalation

Folgende Faelle gehen an den Nutzer:

- uncommitted Aenderungen, die nicht vom aktuellen Ticket stammen,
- Dateien ausserhalb des Write-Scopes wurden geaendert,
- Branch passt nicht zum Ticket,
- PR schliesst falsches Issue oder kein Issue,
- Issue ist geschlossen, soll aber bearbeitet werden,
- Labels/Status/Prioritaet widersprechen sich,
- Merge-/Rebase-Konflikte mit unklarer Entscheidung,
- unklar, ob Aenderungen behalten, reverted oder in ein Folgeticket verschoben werden sollen.

Grundregel:

Technischer Dev-Reviewer-Austausch darf autonom laufen. Projekt-/Repo-Hygiene mit Entscheidungsspielraum bleibt beim Nutzer.

## Handoff: Reviewer an Entwickler

```md
Ticket: EP-xxx / #xxx
Review-Ergebnis: approved / changes requested / blocked

Befunde:
- ...

Erforderliche Aenderungen:
- ...

Repo-/GitHub-Zustand unklar:
- ja/nein, Details: ...

Nutzer-Eskalation noetig:
- ja/nein, Grund: ...
```

## Handoff: Entwickler an Dispatcher

```md
Ticket EP-xxx ist abgeschlossen.
Status:
- Review: approved
- Ticket: geschlossen / offen mit Kommentar / PR gemerged
- offene Nacharbeiten: keine / ...
- Repo/GitHub-Zustand: sauber / Nutzer-Eskalation offen

Bitte nenne mir das naechste sinnvolle Ticket.
```
