---
name: code-stil
description: Regeln für Code und Kommentare in renditeradar. Laden, bevor eine Datei unter pipeline/, supabase/ oder web/ geschrieben oder geändert wird. Regelt Sprache der Bezeichner, Kommentarpflicht, Formatierung und Werkzeuge.
---

# Code-Stil renditeradar

Das Repo ist öffentlich und dient als Arbeitsprobe. Jede Datei wird von Menschen gelesen, die den Autor nicht kennen. Der Code muss sich selbst erklären.

## Sprache

- Bezeichner auf Deutsch, wie im Datenmodell in `docs/datenmodell.md`: `preis_chf`, `bruttorendite`, `ObjektKarte`, `berechneKennzahlen`. Englisch nur bei Begriffen aus Framework oder Bibliothek: `page`, `layout`, `props`, `searchParams`.
- Kommentare, Docstrings und Oberflächentexte auf Deutsch in Schweizer Rechtschreibung: ä, ö, ü, ss statt ß. Keine Gedankenstriche.
- Dateinamen und Bezeichner ohne Umlaute, weil Dateisysteme, URLs und Linter damit Probleme machen: `flaeche_m2`, `veroeffentlichung`. Das ist die einzige zulässige Umschreibung.
- Keine Anglizismen in Prosa, wo ein deutsches Wort existiert: Abfrage statt Query, Verzeichnis statt Folder. Etablierte Fachbegriffe wie Commit, Build, Cache, Deployment bleiben.

## Kommentarpflicht

Jede Funktion, Methode, Komponente und jedes exportierte Objekt hat einen Kommentar, der drei Fragen beantwortet: Was tut sie, was nimmt sie entgegen, was gibt sie zurück oder was ist der Grenzfall. Der Kommentar erklärt das Warum, nicht das Was.

TypeScript mit JSDoc, `@param` und `@returns` bei Funktionen. Bei Komponenten ein Satz zum Zweck und ein Satz dazu, ob Server oder Client Component und warum:

```ts
/**
 * Berechnet die Bruttorendite als Anteil (0.048 für 4.8 %).
 * @param mietertragJahrChf Jahresmiete in CHF
 * @param preisChf Kaufpreis in CHF
 * @returns Bruttorendite, oder null bei Kaufpreis 0, damit die Oberfläche
 *   "keine Angabe" zeigt statt Division durch null
 */
```

Python mit Docstring: erste Zeile ein Satz, Leerzeile, dann Parameter, Rückgabe und Grenzfall.

SQL: Kommentar über jeder Tabelle, jedem Index und jeder Policy mit dem Grund. Bei Indizes die Abfrage nennen, die davon profitiert.

Verboten: `# Zähler erhöhen`. Richtig: `# Zähler nur bei neuen Zeilen erhöhen, Upserts zählen nicht`.

## Struktur

- Kein toter Code, keine auskommentierten Blöcke, keine `TODO` ohne Verweis auf `docs/offene-punkte.md`.
- Funktionen unter 40 Zeilen. Längere Funktionen werden aufgeteilt, nicht kommentiert.
- Magische Zahlen als benannte Konstanten mit Kommentar: `NEBENKOSTEN_QUOTE_STANDARD = 0.25`.
- Keine Platzhaltertexte wie Lorem ipsum in der Oberfläche.
- Keine Zugangsdaten, auch nicht in Beispielen oder Kommentaren.

## TypeScript

- `strict` in `tsconfig.json`. Kein `any` ohne Kommentar, der den Grund nennt. Wo `unknown` nötig ist, direkt danach eingrenzen.
- Typen für Datenbankzeilen aus dem Supabase-Schema generieren, nicht von Hand schreiben.
- Formatierung mit Prettier in Standardeinstellung, Lint mit ESLint aus der Next.js-Vorlage.
- Eine Komponente pro Datei, benannte Funktion, Dateiname wie die Komponente: `ObjektKarte.tsx`.

## Python

- Formatierung und Lint mit ruff, Konfiguration in `pyproject.toml`, Zeilenlänge 100.
- Typannotationen an allen Funktionen.
- Keine globalen Variablen für Zustand. Konfiguration über Funktionsparameter oder eine `Einstellungen`-Dataclass.

## Formeln

Die Kennzahlen sind in `pipeline/kennzahlen.py` und `web/lib/kennzahlen.ts` doppelt vorhanden. Beide Dateien tragen denselben Kommentarblock mit den Formeln. Wer eine ändert, ändert beide und die Tests.

## Werkzeuge vor jedem Commit

- Python: `ruff check` und `ruff format --check` ohne Befund.
- TypeScript: `tsc --noEmit`, ESLint und Prettier ohne Befund.
