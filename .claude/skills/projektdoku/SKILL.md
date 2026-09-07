---
name: projektdoku
description: Schreibt und prüft Projektdokumentation für renditeradar in Schweizer Rechtschreibung und im festgelegten Aufbau. Laden bei jeder Datei unter docs/, beim README und am Ende jedes Meilensteins.
---

# Projektdokumentation renditeradar

Die Dokumentation richtet sich an einen Auftraggeber, der das Repo in zehn Minuten überfliegt. Sie muss zeigen, was gebaut wurde, warum so, und wie man es startet.

## Struktur

| Datei | Inhalt |
|---|---|
| `README.md` | Einstieg: Zweck, Demo-Link, Datenherkunft, Architektur, Setup, Entscheide, offene Punkte, Haftungsausschluss, Lizenz |
| `docs/architektur.md` | Datenfluss Quelle, Pipeline, Postgres, Next.js, Vercel. Abweichungen von Plan und Mockup mit Grund |
| `docs/datenmodell.md` | Tabelle, Spalten, Indizes, RLS-Policies, Formeln der Kennzahlen |
| `docs/offene-punkte.md` | Was fehlt, was bewusst weggelassen wurde, Nachweise je Meilenstein |
| `docs/entscheide/NNN-titel.md` | Ein Entscheid pro Datei, fortlaufend nummeriert |
| `docs/mockups/` | Wireframes und UI-Mockups als PDF, Screenshots der Umsetzung als PNG |

Dateien entstehen, sobald ihr Inhalt existiert. Keine leeren Platzhalterdateien.

## Sprache und Rechtschreibung

- Schweizer Rechtschreibung. Umlaute immer als ä, ö, ü, niemals ae, oe, ue.
- Kein ß. Immer ss: Strasse, gross, muss, Grösse, äusserst.
- Keine Gedankenstriche, weder lang noch kurz mit Abstand. Ein Gedanke pro Satz, sonst Doppelpunkt oder Komma.
- Zahlen mit Apostroph als Tausendertrennung: 41'000, CHF 450'000.
- Dezimaltrennung mit Punkt bei Zimmerzahlen (3.5), mit Komma im Fliesstext.
- Währung immer als CHF vorangestellt, nicht als Franken-Zeichen.
- Flächen als m², Renditen in Prozent mit einer Nachkommastelle.
- Befehle in Codeblöcken, nie im Fliesstext.

## Ton

- Aussagesätze. Keine Werbesprache, keine Superlative, kein "innovativ", "state of the art", "leistungsstark".
- Probleme werden benannt, nicht beschönigt. Offene Punkte gehören ins Dokument, nicht ins Gespräch.
- Keine Behauptung ohne Beleg: Zahlen stammen aus dem Repo oder aus einer Messung. Der Beleg ist ein Dateipfad oder ein Befehl, der die Zahl reproduziert.

## Aufbau eines Entscheid-Dokuments

Jede Datei unter `docs/entscheide/` folgt diesem Muster:

1. **Titel**: Entscheid in einem Satz
2. **Ausgangslage**: was zur Wahl stand und warum die Frage aufkam
3. **Entscheid**: was gewählt wurde
4. **Begründung**: warum, mit dem konkreten Kriterium
5. **Verworfene Alternativen**: was nicht gewählt wurde und woran es scheiterte
6. **Folgen**: was dieser Entscheid später erschwert oder ausschliesst

Punkt 5 ist nicht optional. Ein Entscheid ohne verworfene Alternative ist keine Entscheidung, sondern eine Gewohnheit. Jedes Dokument trägt das Datum.

Entscheide, die mehrere Projekte betreffen, zusätzlich als ADR im Vault unter `C:\Vault\entrio\decisions` vorschlagen.

## Aufbau eines Problem-Dokuments

Für technische Kernprobleme, als Abschnitt in `docs/architektur.md`:

1. **Problem**: was konkret nicht funktionierte, mit Symptom
2. **Lösung**: was gemacht wurde
3. **Warum es zählt**: welches Prinzip dahintersteht

## Was nicht hineingehört

- Secrets, Schlüssel, Verbindungsdaten, auch nicht als Beispiel
- Namen realer Immobilienportale im Zusammenhang mit Datenbeschaffung
- Codeblöcke länger als 20 Zeilen. Stattdessen die Datei verlinken.

## Pflege

- README und `docs/offene-punkte.md` werden am Ende jedes Meilensteins geprüft, nicht erst am Schluss.
- Was im Code geändert wird und die Dokumentation betrifft, wird im selben Commit dokumentiert.

## Prüfung vor dem Speichern

Jede Datei unter `docs/` und das README werden vor dem Commit auf diese Muster durchsucht. Jeder Treffer ist ein Fehler:

- Gedankenstriche, lang oder kurz mit Abstand
- Gebrochene Umlaute in deutschem Text. Ausnahmen: Eigennamen, Dateinamen, Bezeichner im Code
- Das Zeichen ß
- Muster von Secrets: JWT-Anfänge, Supabase-Tokens, Verbindungszeichenfolgen mit Passwort
