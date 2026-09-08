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
| Renditerechner | Client Component | Rechnet bei jeder Eingabe neu, ohne Server. Ergebnis wird beim Rendern abgeleitet, kein zweiter Zustand. |
| Vergleichsobjekte | Server Component | Holt die Nachbarn über die Datenbankfunktion mit GiST-Index. Die Liste steht unabhängig von der Karte. |
| Umgebungskarte | Client Component | Leaflet spricht den DOM an und läuft auf dem Server nicht. Wird ohne serverseitiges Rendern nachgeladen. |

Die Anwendung enthält zwei Client Components: den Renditerechner und die Karte. Alles andere läuft auf dem Server. Interaktion wird über URL und Formular gelöst, wo das genügt. Die Karte kommt über eine dünne Zwischenschicht, weil das Laden ohne serverseitiges Rendern seit Next.js 15 nur in einer Client Component erlaubt ist.

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

## Problem und Lösung: Lokal grün, in der CI rot

**Problem.** Alle Prüfungen liefen lokal ohne Befund. Der erste Lauf auf GitHub Actions scheiterte in allen drei Workflows, jeder aus einem anderen Grund:

1. Der Workflow `qualitaet` fand seine eigenen Suchmuster und meldete einen Portalnamen.
2. `pytest` ohne `python -m` hatte das Verzeichnis nicht im Suchpfad und fand die Module nicht.
3. `tsc` fand `PageProps` und `LayoutProps` nicht. Next.js erzeugt diese Typen beim Build, lokal war immer ein Build vorausgegangen.

Dazwischen lag eine falsche Spur: `package-lock.json` war unter Windows schrittweise ergänzt worden und wich von einer frischen Erzeugung ab. Das war ein echter Fehler, aber nicht die Ursache des roten Laufs.

**Lösung.** `.github` aus den Textsuchen ausgenommen, `pythonpath` in `pyproject.toml` gesetzt, `next typegen` vor der Typprüfung. Jede Ursache wurde zuerst lokal reproduziert, bevor sie behoben wurde. Die Ursache von Punkt 3 kam aus den Annotationen des Laufs, nicht aus einer Vermutung.

**Warum es zählt.** Eine Prüfung, die nur auf dem eigenen Rechner läuft, prüft auch den Zustand des eigenen Rechners mit. Erst die frische Umgebung zeigt, was das Repo tatsächlich enthält. Deshalb laufen die Regeln der Skills jetzt in `.github/workflows/` bei jedem Push, siehe `docs/offene-punkte.md` unter M2.

## Problem und Lösung: Räumlicher Index nur bei festem Bezugspunkt

**Problem.** Die Suche nach den fünf nächstgelegenen Objekten war naheliegend als Verknüpfung der Tabelle mit sich selbst geschrieben. Der Abfrageplan zeigte einen sequenziellen Durchlauf mit anschliessendem Sortieren, der GiST-Index blieb ungenutzt.

**Lösung.** Der Bezugspunkt steht jetzt als skalare Unterabfrage im Ausdruck statt als Partner einer Verknüpfung. Damit wird er im Plan zu einem InitPlan, also zu einer Konstante, und der Index kann den Distanzoperator bedienen. Der Plan zeigt `Index Scan using objekte_geog_idx`.

**Warum es zählt.** Ein räumlicher Index für die Suche nach dem nächsten Nachbarn setzt voraus, dass eine Seite des Vergleichs feststeht. Wer den Bezugspunkt aus einer Verknüpfung bezieht, bekommt eine Abfrage, die bei kleinen Datenmengen schnell aussieht und mit der Tabelle linear langsamer wird. Der Unterschied ist im Plan sichtbar, nicht an der Laufzeit von 400 Zeilen.
