# Architektur

## Datenfluss

```
quellen.py          62 Schweizer Gemeinden mit Koordinaten und Preisniveau
      |
generator.py        400 erfundene Objekte mit festem Seed, absichtlich unsaubere Rohdaten
      |
normalisierung.py   Einheiten entfernen, Zahlen prüfen, Dedup-Hash bilden, Kennzahlen rechnen
      |
db.py               Upsert auf dedup_hash, ein Lauf mehr ändert nichts
      |
Postgres            eine Tabelle, fünf Indizes, RLS mit reiner Leseberechtigung
      |
Next.js             Liste dynamisch aus searchParams, Detailseiten statisch mit ISR
      |
Vercel              ausgeliefert aus dem Cache, stündlich im Hintergrund erneuert
```

Die Pipeline schreibt über eine direkte Postgres-Verbindung als Tabellenbesitzer. Die Anwendung liest über die REST-Schnittstelle mit dem Anon-Key und kann nur lesen, weil es keine Policy für `insert`, `update` oder `delete` gibt.

## Aufteilung Server und Client

| Teil | Art | Grund |
|---|---|---|
| Listenseite | Server Component, dynamisch | Der Filterzustand steht in `searchParams`, also in der URL. Kein React-State, keine Hydrierung. |
| Filterleiste | Server Component | Ein Formular mit GET-Methode. Der Browser baut die URL selbst, das funktioniert ohne JavaScript. |
| Filter-Chips | Server Component | Jeder Chip ist ein Link auf dieselbe Liste ohne diesen Filter. |
| Objektkarte, Kennzahlkachel, Seitennavigation | Server Component | Reine Darstellung ohne Zustand. |
| Detailseite | Server Component, statisch mit ISR | Siehe `docs/entscheide/001-isr-statt-ssr.md`. |
| Renditerechner | Client Component | Rechnet mit Annahmen des Nutzers, ohne Datenbank. Kommt in M3. |

Bis M3 enthält die Anwendung keine einzige Client Component. Das ist Absicht: Interaktion wird über URL und Formular gelöst, wo das genügt.

## Abweichungen vom Mockup

Alle drei sind bewusst und wurden vor dem Bauen entschieden.

1. **Die ganze Objektkarte ist ein Link**, nicht nur der Titel. Im Mockup ist beim Überfahren nur der Titel unterstrichen. Ein Tap-Ziel von einer Textzeile ist auf Mobil zu klein, deshalb umfasst der Link die ganze Karte, und der Rahmen färbt sich in der Akzentfarbe.
2. **Kein Knopf "Filter anwenden" im Mockup-Sinn.** Das Mockup zeigt ihn im Komponenten-Artboard. Da die Filter ein Formular mit GET-Methode sind, braucht es einen Absendeknopf für den Fall ohne JavaScript. Er heisst "Anwenden" und steht zusammen mit "Zurücksetzen" am Fuss der Filterleiste.
3. **Die Seitennavigation zeigt auf Mobil keine Seitenzahlen**, nur Zurück, "Seite 2 von 6" und Weiter. Einzelne Ziffern wären als Tap-Ziel zu klein. Auf Desktop kommen die Zahlen dazu, wie im Mockup.

## Abweichungen vom Projektplan

- **Der Primärschlüssel ist `bigint identity`, nicht `uuid`.** Zufällige UUIDs fragmentieren den Index, und die öffentliche Kennung ist ohnehin der Slug. Begründung in `docs/datenmodell.md`.
- **Die strukturierten Daten nutzen `Accommodation` mit einem `Offer`**, nicht `RealEstateListing`. Letzteres ist bei schema.org kein eigener Typ.

## Problem und Lösung: Umgebungsvariablen an zwei Orten

**Problem.** Die Zugangsdaten liegen in einer einzigen `.env` im Repo-Stamm, damit Pipeline und Anwendung dieselbe Quelle nutzen. Next.js liest Umgebungsvariablen aber nur im eigenen Verzeichnis. Der Build brach mit einem Hinweis auf fehlende Variablen ab.

**Lösung.** `web/next.config.ts` lädt die Datei aus dem übergeordneten Verzeichnis zusätzlich. Auf Vercel existiert sie nicht, dort kommen die Werte aus den Projekteinstellungen, und der Aufruf bleibt wirkungslos.

**Warum es zählt.** Eine Konfiguration an zwei Orten ist eine Fehlerquelle, die sich erst beim Deployment zeigt. Eine Quelle mit einem klar dokumentierten Sonderfall ist besser als zwei Dateien, die auseinanderlaufen.

## Problem und Lösung: Typisierte Routen und zusammengesetzte Adressen

**Problem.** Mit `typedRoutes` prüft TypeScript jedes `href` gegen die bekannten Routen. Ein aus Filtern zusammengesetzter Text wie `/?kanton=SO&seite=2` ist für den Prüfer keine bekannte Route, der Build schlug fehl.

**Lösung.** Die Funktion `baueZiel` in `web/lib/filter.ts` liefert kein Textstück mehr, sondern ein Objekt aus Pfad und Abfrageparametern. Das akzeptiert `next/link` typisiert.

**Warum es zählt.** Der Prüfer hatte recht. Ein zusammengesetzter Text kann jede Adresse enthalten, auch eine falsche. Das Objekt trennt den Pfad von den Parametern und macht Tippfehler im Pfad unmöglich.
