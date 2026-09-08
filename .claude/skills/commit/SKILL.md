---
name: commit
description: Format und Prüfliste für Commits in renditeradar. Laden vor jedem git commit. Conventional Commits mit festen Scopes und Meilenstein im Betreff, Prüfung auf Secrets und Stilfehler vor dem Commit.
---

# Commits in renditeradar

Der Commit-Verlauf ist Teil der Arbeitsprobe. Er wird gelesen und soll erzählen, wie das Projekt entstanden ist.

## Format

```
<typ>(<scope>): M<n> <betreff>

<body, optional>

Co-Authored-By: <Attributionszeile des Modells>
```

- Typ: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`.
- Scope, genau einer: `pipeline`, `web`, `db`, `docs`, `skills`, `repo`.
- `M<n>` ist der Meilenstein, zu dem die Änderung gehört. Damit ist der Fortschritt im Verlauf sichtbar.
- Betreff auf Deutsch im Infinitiv, höchstens 72 Zeichen, kein Punkt am Ende. Schweizer Rechtschreibung, keine Gedankenstriche.
- Letzte Zeile: die Attributionszeile des Modells, das den Commit erstellt. Kein fester Modellname, er wechselt.
- Body, wenn der Betreff nicht reicht: erklärt, warum die Änderung nötig war. Was geändert wurde, steht im Diff.

Beispiel:

```
feat(pipeline): M1 Generator für Inserate mit Preisniveau je Gemeinde anlegen
```

## Grösse

Ein Commit enthält eine zusammenhängende Änderung. Pipeline-Schritt, Migration, Seite, Komponente: jeweils ein eigener Commit. Ein Commit, der drei Dinge tut, wird aufgeteilt.

## Prüfung vor jedem Commit

Reihenfolge einhalten. Bei einem Treffer wird nicht committet.

1. Nur benannte Dateien stagen. Kein `git add -A` und kein `git add .`. Grund: ein einziger fehlender Ignore-Eintrag hat in M0 236 fremde Dateien ins Repo gebracht.
2. `git diff --cached --name-only` lesen. Keine `.env`, keine lokalen Einstellungen, keine Dateien, die nicht zum Commit gehören.
3. `git diff --cached` nach Secrets durchsuchen: JWT, Supabase-Tokens (`sbp_`), Stripe-Schlüssel (`sk_`), Verbindungszeichenfolgen mit Passwort, Zugriffstoken mit Wert. Ein JWT muss am Muster drei durch Punkte getrennte Teile haben, sonst schlägt die Prüfung auch bei Prüfsummen in `package-lock.json` an. Das genaue Muster steht im Skill `veroeffentlichung`.
4. `git diff --cached` in `.md`, `.py`, `.ts`, `.tsx`, `.sql` nach Gedankenstrichen und ß durchsuchen.
5. Bei Änderungen unter `web/`: `tsc --noEmit`, ESLint und Prettier ohne Befund.
6. Bei Änderungen unter `pipeline/`: `ruff check` und `ruff format --check` ohne Befund.
7. Betrifft die Änderung die Dokumentation, ist sie im selben Commit angepasst.

## Nicht erlaubt

- Kein Amend und kein Force-Push auf gepushte Commits ohne ausdrückliche Anweisung des Users.
- Kein Überspringen von Hooks.
- Keine Nachrichten wie "fix", "wip" oder "update".
- Kein Push ohne ausdrückliche Anweisung. Vor dem ersten Push auf ein öffentliches Remote den Skill `veroeffentlichung` durchlaufen.

## Zwei Sitzungen im selben Repo

Wenn `git status` oder `git log` Änderungen zeigt, die nicht aus dieser Sitzung stammen, anhalten und den User informieren. Nicht darüber hinweg committen.
