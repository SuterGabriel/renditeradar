---
name: meilenstein-abschluss
description: Prüfliste zum Abschluss eines Meilensteins M0 bis M5 in renditeradar. Laden, wenn ein Meilenstein als fertig gemeldet werden soll. Stellt sicher, dass Nachweis, Dokumentation, Lernjournal, Gedächtnis und Git-Tag nachgeführt sind.
---

# Meilenstein abschliessen

Ein Meilenstein gilt erst als fertig, wenn alle Punkte erfüllt sind. Die Reihenfolge ist verbindlich.

## 1. Fertig-Kriterium nachweisen

Jeder Meilenstein hat im Projektplan ein Fertig-Kriterium. Es wird ausgeführt und dem User gezeigt, nicht behauptet:

| Meilenstein | Nachweis |
|---|---|
| M0 | `git log` zeigt die Commits, Secrets-Prüfung aus `veroeffentlichung` leer, keine fremden Dateien im Repo |
| M1 | Pipeline zweimal laufen lassen, `select count(*)` vorher und nachher gleich |
| M2 | `next build` zeigt statische Detailseiten, gefilterte URL öffnet mit denselben Filtern |
| M3 | Grenzfälle 0 % Eigenkapital, 100 % Leerstand, Kaufpreis 0 ohne `NaN`, Tests grün, per Tastatur bedienbar |
| M4 | Demo-URL von einem fremden Gerät geöffnet, Lighthouse grün bei LCP, INP, CLS |
| M5 | Umkreisabfrage 10 km um Olten liefert Treffer, `explain analyze` unter 100 ms |

Befehl und Ausgabe kommen in `docs/offene-punkte.md` unter den Meilenstein.

## 2. Lint und Tests

Laufen ohne Befund, siehe Skill `code-stil`. Dieselben Prüfungen laufen in `.github/workflows/` bei jedem Push. Der Workflow `qualitaet` prüft ausserdem, dass zu jedem Tag `m<n>` ein Abschnitt `### M<n>` in `docs/offene-punkte.md` steht. Ein Tag ohne Abschnitt macht die CI rot.

## 3. Dokumentation nachziehen

Nach dem Skill `projektdoku`:

- `docs/offene-punkte.md`: was in diesem Meilenstein bewusst weggelassen wurde und warum.
- `docs/architektur.md`: Abweichungen vom Plan oder vom Mockup, mit Grund.
- `docs/entscheide/`: neues Dokument, wenn im Meilenstein eine Wahl getroffen wurde, die eine Alternative ausschliesst.
- README: Setup-Schritte und Status, die neu dazugekommen sind. Die README darf keinen Stand beschreiben, der nicht dem Code entspricht.

## 4. Commit und Tag

Nach dem Skill `commit`. Der letzte Commit eines Meilensteins trägt im Body die Zeile `Meilenstein: M<n> abgeschlossen`. Danach ein annotierter Tag:

```
git tag -a m1 -m "M1 Pipeline"
```

Push von Commit und Tag nur auf Anweisung des Users.

## 5. Lernjournal

Einen Eintrag über den Skill `obsidian-lernjournal` schreiben. Inhalt: was neu war, was nicht auf Anhieb funktionierte, was beim nächsten Mal anders gemacht wird. Der Eintrag ist Material für das Bewerbungsgespräch, nicht für das Repo.

## 6. Gedächtnis

Die Datei `renditeradar-projektstand` im Claude-Gedächtnis mit neuem Stand und Datum aktualisieren.

## 7. Nächster Meilenstein

In zwei Sätzen ankündigen, mit dem ersten konkreten Schritt und dem, was vom User dafür gebraucht wird.

## Abbruchpunkt

Nach M4 wird nicht weitergebaut, bevor die Demo deployed und von einem fremden Gerät geprüft ist. M5 beginnt erst, wenn der User es ausdrücklich verlangt.

## Was den Abschluss verhindert

- Ein Fertig-Kriterium ist nur teilweise erfüllt. Dann bleibt der Meilenstein offen, und der Rest wird benannt.
- Offene `TODO` ohne Verweis auf `docs/offene-punkte.md`.
- Änderungen im Repo, die nicht aus dieser Sitzung stammen und nicht geklärt sind.
