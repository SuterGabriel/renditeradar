# 002: Postgres statt MongoDB

Datum: 2026-09-08

## Ausgangslage

Das Mandat lässt beide Datenbanken zu. Die Anwendung filtert Objekte über mehrere Dimensionen gleichzeitig, Kanton, Typ, Preisbereich und Mindestrendite, sortiert nach Rendite und braucht in M5 räumliche Abfragen im Umkreis eines Orts.

## Entscheid

PostgreSQL auf Supabase, mit PostGIS ab M5.

## Begründung

Das Schema ist fest und flach: eine Tabelle, zwanzig Spalten, keine verschachtelten Dokumente. Zusammengesetzte B-Tree-Indizes decken die Filterkombinationen ab, ein GiST-Index auf einer `geography`-Spalte die Umkreissuche. Check-Constraints halten unplausible Werte schon beim Schreiben fern. Alles davon ist in Postgres eingebaut und braucht keinen Zusatzdienst.

## Verworfene Alternativen

- **MongoDB.** Dokumentenspeicher lohnen sich bei variablem Schema. Hier hat jedes Objekt dieselben Felder. Geodaten sind in MongoDB möglich, aber Filter über mehrere Felder plus Geodaten plus Sortierung brauchen dort sorgfältig gebaute zusammengesetzte Indizes mit engeren Regeln als in Postgres. Kein Vorteil bei diesem Schema.
- **SQLite mit Datei im Repo.** Einfachstes Deployment, aber keine räumlichen Indizes ohne Erweiterung und kein Nachweis für die im Mandat geforderten Postgres-Kenntnisse.

## Folgen

- Die Pipeline braucht eine direkte Postgres-Verbindung und damit ein Passwort in der lokalen `.env`. Ein reiner HTTP-Zugang über den Anon-Key reicht für Upserts nicht, weil RLS absichtlich keine Schreibrechte gibt.
- Schema-Änderungen laufen als Migrationen unter `supabase/migrations/`. Das ist mehr Aufwand als ein schemaloser Speicher, aber jede Änderung ist nachvollziehbar.
