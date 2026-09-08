# 003: Kennzahlen in der Pipeline berechnen und speichern

Datum: 2026-09-08

## Ausgangslage

Bruttorendite, Nettorendite, Preis pro m² und Preis pro Zimmer lassen sich aus vier Spalten ableiten. Die Frage war, wo sie berechnet werden: im Browser beim Anzeigen, in der Datenbank als generierte Spalte, oder in der Pipeline beim Schreiben.

## Entscheid

Die Pipeline berechnet die Kennzahlen und speichert sie als normale Spalten. Die Formeln liegen in `pipeline/kennzahlen.py`.

## Begründung

Die Liste soll nach Mindestrendite filtern und nach Rendite sortieren. Das geht nur, wenn die Rendite als Spalte in der Datenbank liegt und einen Index hat. Eine Berechnung im Browser würde erfordern, alle Objekte zu laden und dort zu sortieren. Bei 400 Objekten ginge das noch, bei 40'000 nicht mehr, und die Arbeitsprobe soll das richtige Muster zeigen, nicht das, das gerade noch funktioniert.

## Verworfene Alternativen

- **Berechnung im Browser.** Einfachster Code, aber Filtern und Sortieren nach Rendite unmöglich, ohne alle Datensätze zu laden.
- **Generierte Spalten in Postgres** (`generated always as ... stored`). Eine Quelle der Wahrheit, die Formel liegt nur in der Datenbank. Verworfen, weil die Nebenkostenquote später pro Objekt aus der Quelle kommen kann und die Pipeline dann ohnehin die Logik braucht, welche Quote gilt. Ausserdem lässt sich die Formel in Python testen, in SQL nur umständlich. Diese Alternative ist die stärkste und könnte später die Pipeline-Berechnung ablösen.

## Folgen

- Die Formel existiert zweimal: in `pipeline/kennzahlen.py` für die gespeicherten Werte und in `web/lib/kennzahlen.ts` für den Renditerechner, der mit Nutzerannahmen live rechnet. Beide Dateien tragen denselben Kommentarblock, beide haben Tests mit denselben Fällen. Wer eine ändert, muss die andere ändern. Das ist der Preis dieses Entscheids.
- Ändert sich eine Formel, müssen alle Zeilen neu geschrieben werden. Die Pipeline ist idempotent, ein erneuter Lauf genügt.
