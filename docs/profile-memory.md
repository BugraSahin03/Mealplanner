# Profile Memory

Dieses Dokument beschreibt, wie die lebenden Profilinformationen fuer Buğra und Sena gepflegt werden sollen.

## Grundidee

Es gibt zwei verschiedene Ebenen:

1. Menschlich lesbare Profil-Memory
   - Markdown-Dateien,
   - gut fuer OpenClaw,
   - gut fuer Notizen, Geschmack, Begruendungen und lebende Erinnerungen.

2. Strukturierte Profil-Daten
   - JSON nach `schemas/profile.schema.json`,
   - gut fuer die App,
   - gut fuer Validierung,
   - gut fuer Formulare und spaetere Migrationen.

Diese Ebenen duerfen sich gegenseitig ergaenzen, sollten aber nicht vermischt werden.

## Vorgeschlagene Dateien

Auf App-Seite oder spaeter im OpenClaw-Workspace:

```text
profiles/bugra.md
profiles/sena.md
```

Wir verwenden ASCII-Dateinamen, aber in der UI wird `Buğra` angezeigt.

## Inhalt einer Profil-Markdown-Datei

Jede Datei sollte grob diese Abschnitte haben:

```markdown
# Buğra

## Ziele

## Tagesziel / grobe Kalorien

## Frühstück

## Mittagessen

## Abendessen

## Office-Tage

## Homeoffice-Tage

## Lieblingsgerichte

## Mag ich gerne

## Mag ich eher nicht

## Harte Regeln

## Weiche Präferenzen

## Beobachtungen

## Änderungsverlauf
```

## Wer darf die Dateien aendern?

Fuer den MVP empfehle ich:

- Die App darf Profilfelder strukturiert speichern.
- OpenClaw darf Vorschlaege zur Profilanpassung machen.
- OpenClaw sollte Profil-Memory nicht ungefragt dauerhaft aendern.

Warum?

Wenn OpenClaw automatisch Profile aendert, kann es passieren, dass eine einmalige Laune zur dauerhaften Regel wird. Besser:

1. OpenClaw erkennt eine neue Praeferenz.
2. OpenClaw schlaegt eine Profilaenderung vor.
3. Die App zeigt den Vorschlag an.
4. Buğra oder Sena bestaetigt ihn.
5. Erst dann wird Profil-Memory aktualisiert.

Spaeter kann man fuer harmlose Beobachtungen automatische Updates erlauben.

## Profilvorschlaege in der App

Die App soll Profilvorschlaege von OpenClaw sichtbar machen, statt sie automatisch zu uebernehmen.

Moeglicher UI-Ansatz:

- Nach einer Wochenplanung kann unten im Plan oder im Profilbereich ein Hinweis erscheinen.
- Beispiel: `OpenClaw moechte eine Profilnotiz vorschlagen`.
- Der Vorschlag zeigt:
  - betroffene Person,
  - vorgeschlagene Aenderung,
  - kurze Begruendung,
  - Zielbereich, z. B. Fruehstueck, Mittagessen, Lieblingsgerichte oder Abneigungen.
- Aktionen:
  - `Uebernehmen`,
  - `Ablehnen`,
  - `Bearbeiten`.

Damit bleiben Buğra und Sena die Besitzer der Profile. OpenClaw darf lernen helfen, aber nicht eigenmaechtig die langfristige Wahrheit aendern.

## App-seitige Profilpflege im MVP

Die erste App-Oberflaeche fuer Profile speichert strukturierte Felder in SQLite:

- Ziel,
- Tageskalorienziel als grober Richtwert,
- Lieblingsgerichte,
- Vorlieben,
- Abneigungen,
- Hinweise fuer Fruehstueck, Mittagessen und Abendessen,
- weiche Regeln und Notizen.

Diese Felder sind die Grundlage fuer spaetere Planner-Requests. Sie ersetzen die Markdown-Profilmemory nicht. Die Markdown-Dateien bleiben die menschlich lesbare Langzeit-Erinnerung; App-Daten koennen spaeter kontrolliert in Vorschlaege fuer diese Memory uebersetzt werden.

## JSON-Strukturen

Es gibt bewusst mehrere JSON-Strukturen:

1. `profile.schema.json`
   - beschreibt eine Person,
   - Ziele,
   - Kalorien,
   - Vorlieben,
   - Abneigungen,
   - Mahlzeitenhinweise.

2. `planner-request.schema.json`
   - beschreibt den Auftrag an OpenClaw,
   - konkrete Woche,
   - Office/Homeoffice-Kontext,
   - Profile,
   - Planungsregeln.

3. `planner-response.schema.json`
   - beschreibt die Antwort von OpenClaw,
   - Wochenplan,
   - Mahlzeiten,
   - Zutaten,
   - Einkaufsliste.

Diese Trennung ist wichtig:

- Profile leben lange.
- Requests sind Momentaufnahmen einer konkreten Woche.
- Responses sind konkrete Planungsergebnisse.

## Warum nicht alles in ein JSON?

Ein Wochenplan ist verbrauchbar und zeitgebunden.

Ein Profil ist dauerhaft und entwickelt sich.

Wenn beides in einer Struktur steckt, wird es schwer zu unterscheiden:

- Was ist eine langfristige Praeferenz?
- Was war nur eine Entscheidung fuer diese Woche?
- Was darf OpenClaw spaeter wiederverwenden?
- Was soll die App speichern?

Deshalb bleiben Profile, Requests und Responses getrennt.

## Naechster Schritt

Vor der App-Implementierung sollten Beispielprofile fuer Buğra und Sena als Markdown-Dateien angelegt werden. Daraus kann die App spaeter strukturierte Profil-JSONs erzeugen oder beides parallel pflegen.
