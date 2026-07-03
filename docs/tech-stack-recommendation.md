# Tech-Stack-Empfehlung

## Empfehlung fuer den MVP

Fuer den ersten produktiv nutzbaren Stand wird dieser Stack empfohlen:

- Next.js mit TypeScript,
- Tailwind CSS fuer UI-Styling,
- SQLite als erste Datenbank,
- Drizzle ORM fuer Schema und Datenzugriff,
- KI-Integration mit strukturierten JSON-Ausgaben, aber ohne externe LLM-API im MVP,
- systemd-Deployment auf Hetzner fuer den MVP,
- Docker optional spaeter,
- Zugriff privat ueber Tailscale.

## Warum dieser Stack passt

### Next.js + TypeScript

Next.js eignet sich gut, weil UI, serverseitige Logik und API-Routen in einem Projekt liegen koennen. Fuer diese App ist das praktisch, weil Wochenplanung, Profilbearbeitung, KI-Aufruf und Einkaufsliste eng zusammenhaengen.

TypeScript ist sinnvoll, weil die KI strukturierte Daten liefern soll. Wochenplan, Mahlzeiten, Zutaten und Einkaufsliste sollten klare Typen haben, damit die App nicht von losem Freitext abhaengt.

### Tailwind CSS

Tailwind ist schnell fuer eine saubere, private Produktiv-App. Die UI kann hochwertig werden, ohne am Anfang ein eigenes Designsystem bauen zu muessen.

### SQLite

SQLite reicht fuer den Start sehr gut:

- zwei Profile,
- Wochenplaene,
- Mahlzeiten,
- Einkaufslisten,
- kein hoher Traffic,
- einfaches Backup,
- wenig Betriebsaufwand.

Falls spaeter mehr Nutzer, komplexere Historie oder mehrere Clients dazukommen, kann man auf Postgres wechseln.

### Drizzle ORM

Drizzle passt gut zu TypeScript und haelt das Datenmodell nah am Code. Es ist weniger schwergewichtig als viele klassische ORM-Setups und gut geeignet fuer ein kleines, klares Produkt.

### systemd auf Hetzner

Fuer den ersten privaten Produktivbetrieb orientieren wir uns an BudgetBuddy:

- eigener App-Pfad, z. B. `/opt/essenplanner`,
- eigene SQLite-Datei, z. B. `/var/lib/essenplanner/essenplanner.db`,
- eigener systemd-Dienst,
- Bindung nur an `127.0.0.1`,
- Zugriff ueber Tailscale.

Das ist fuer den bestehenden Server pragmatischer als ein Docker-Zwang. Docker bleibt eine spaetere Option, falls mehrere Dienste, reproduzierbare Container-Builds oder ein anderer Hosting-Zielort wichtiger werden.

### KI-Integration

Die KI soll nicht nur Text erzeugen, sondern strukturierte Daten:

- Wochenplan,
- Mahlzeiten,
- Zutaten,
- Mengen,
- Einkaufsliste.

Deshalb sollte die App ein internes Schema definieren und KI-Ausgaben dagegen validieren.

Fuer den MVP sollen keine externen LLM-APIs genutzt werden. Die App sollte deshalb eine austauschbare Planungs-Schnittstelle bekommen:

- zuerst Dummy-/Beispielgenerator fuer Entwicklung,
- danach lokale LLM-Integration oder Codex-gestuetzter Import,
- spaeter optional anderer Provider, falls gewuenscht.

## Alternative Stacks

### SvelteKit

SvelteKit waere ebenfalls gut. Es fuehlt sich fuer kleine Apps oft sehr direkt an und kann sehr angenehme UIs liefern. Next.js ist aber vermutlich die pragmatischere Wahl, wenn spaeter mehr Standardbeispiele, Hosting-Muster und KI-Integrationen genutzt werden sollen.

### Rails/Laravel

Rails oder Laravel waeren stark fuer klassische CRUD-Apps. Fuer eine moderne interaktive UI mit KI-gestuetztem Planungsflow waere der TypeScript-Stack hier naheliegender.

### Postgres statt SQLite

Postgres ist robuster fuer groessere Anwendungen, aber fuer diesen privaten MVP zuerst mehr Betriebsaufwand als Nutzen. SQLite ist die bessere Startwahl.

### Docker statt systemd

Docker waere technisch moeglich, ist fuer den MVP aber nicht notwendig. BudgetBuddy laeuft bereits als systemd-Dienst auf dem bestehenden Hetzner-VPS. Essenplanner soll dieses Muster zuerst uebernehmen und sauber getrennt als eigener Dienst laufen.

## Bewusste Nicht-Ziele fuer den Start

- kein Login,
- keine Rollen/Rechte,
- keine Multi-Tenant-Logik,
- keine externe LLM-API,
- keine Supermarkt-API,
- keine komplexe Preisengine,
- keine native Mobile-App.

## Erste App-Module

1. Profile
   - Buğra und Sena bearbeiten.
   - Ziele und Vorlieben erfassen.

2. Wochen-Setup
   - Office/Homeoffice je Person und Tag setzen.

3. Wochenplan
   - KI-generierte Planung anzeigen.
   - Mahlzeiten manuell anpassen.

4. Einkaufsliste
   - aus Plan generiert,
   - Zutaten gruppiert,
   - Mengen sichtbar,
   - abhakbar.

5. KI-Planung
   - strukturierter Prompt,
   - validierte JSON-Ausgabe,
   - Speicherung des Ergebnisses.
