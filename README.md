# renditeradar

Aggregator für Renditeobjekte: strukturierte Inserate, berechnete Kennzahlen, interaktiver Renditerechner. Arbeitsprobe, keine produktive Plattform.

[![pipeline](https://github.com/SuterGabriel/renditeradar/actions/workflows/pipeline.yml/badge.svg)](https://github.com/SuterGabriel/renditeradar/actions/workflows/pipeline.yml)
[![web](https://github.com/SuterGabriel/renditeradar/actions/workflows/web.yml/badge.svg)](https://github.com/SuterGabriel/renditeradar/actions/workflows/web.yml)
[![qualitaet](https://github.com/SuterGabriel/renditeradar/actions/workflows/qualitaet.yml/badge.svg)](https://github.com/SuterGabriel/renditeradar/actions/workflows/qualitaet.yml)

**Demo:** https://renditeradar-wine.vercel.app

## Was es tut

Eine Python-Pipeline liest Rohdaten ein, normalisiert sie, erkennt Duplikate über einen Hash und schreibt sie mit berechneten Kennzahlen nach Postgres. Eine Next.js-Anwendung zeigt die Objekte als gefilterte Liste und als statisch erzeugte Detailseiten mit Renditerechner. Der gesamte Filterzustand steht in der URL, deshalb ist jede Ansicht teilbar.

## Datenherkunft

**Es werden keine Immobilienportale ausgelesen.** Weder im Code noch auskommentiert noch als Beispiel. Ein öffentliches Repository mit Scraping-Code gegen ein reales Portal wäre ein rechtliches Risiko und für die Demonstration der Pipeline ohne Nutzen.

Die 400 Objekte sind generiert. Echt sind nur die 62 Gemeinden mit Postleitzahl, Kanton, Koordinaten und einem groben Preisniveau pro m², nachzulesen in [pipeline/quellen.py](pipeline/quellen.py). Strasse, Fläche, Preis und Mietertrag sind Zufall mit festem Startwert, deshalb liefert jeder Lauf dieselben Objekte. Die Preisniveaus sind Grössenordnungen zur Plausibilität, keine Marktdaten.

Der Generator erzeugt die Rohdaten absichtlich unsauber, mit Einheiten im Text, Apostrophen in Preisen und rund fünf Prozent Duplikaten in abweichender Schreibweise. Nur so hat die Normalisierung etwas zu tun.

## Architektur

```
quellen.py        62 Gemeinden mit Koordinaten und Preisniveau
     |
generator.py      400 Objekte, fester Seed, absichtlich unsaubere Rohdaten
     |
normalisierung.py Einheiten entfernen, Werte prüfen, Dedup-Hash, Kennzahlen
     |
db.py             Upsert auf dedup_hash, ein zweiter Lauf ändert nichts
     |
Postgres          eine Tabelle, fünf Indizes, RLS mit reiner Leseberechtigung
     |
Next.js           Liste dynamisch aus searchParams, Detailseiten statisch mit ISR
     |
Vercel            aus dem Cache, stündlich im Hintergrund erneuert
```

Die Pipeline schreibt über eine direkte Postgres-Verbindung. Die Anwendung liest mit dem öffentlichen Anon-Key und kann nur lesen, weil die einzige Policy `select` erlaubt. Ein Schreibversuch wird von der Datenbank abgewiesen, nicht vom Anwendungscode.

Ausführlich in [docs/architektur.md](docs/architektur.md) und [docs/datenmodell.md](docs/datenmodell.md).

## Stack

| Bereich | Wahl | Grund |
|---|---|---|
| Frontend | Next.js 16, App Router, React 19 | Statische Erzeugung mit Erneuerung im Hintergrund, Server Components |
| Gestaltung | Tailwind 4, mobile-first | Design-Token aus dem Mockup, keine Hex-Werte im Markup |
| Datenbank | PostgreSQL auf Supabase | Zusammengesetzte Indizes und PostGIS, siehe Entscheid 002 |
| Pipeline | Python 3.13, psycopg, ruff | Eine Aufgabe pro Datei, Typannotationen, Tests |
| Tests | pytest und Vitest | 15 plus 36 Tests, nur reine Logik |
| CI | GitHub Actions, drei Workflows | Erzwingt die Regeln, die sonst an Disziplin hängen |

## Setup

Voraussetzungen: Node 24, Python 3.13, ein Supabase-Projekt.

```bash
git clone https://github.com/SuterGabriel/renditeradar.git
cd renditeradar
cp .env.example .env      # Werte aus dem Supabase-Dashboard eintragen
```

Enthält das Datenbankpasswort Sonderzeichen wie `@`, `:` oder `/`, müssen sie in `DATABASE_URL` kodiert werden. Aus `@` wird `%40`. Sonst bricht die Verbindung mit einer Zeitüberschreitung ab, ohne verständliche Fehlermeldung.

Schema anlegen, dann die Pipeline laufen lassen:

```bash
# Inhalt von supabase/migrations/ im SQL-Editor ausführen
cd pipeline
pip install -r requirements.txt
python main.py                # schreibt nach Postgres
python main.py --trocken      # oder nur JSON, ohne Datenbank
```

Anwendung starten:

```bash
cd web
npm ci
npm run dev
```

Prüfungen:

```bash
cd pipeline && ruff check . && pytest -q
cd web && npm test && npx tsc --noEmit && npx eslint . && npm run build
```

## Entscheide

Jeder Entscheid nennt die verworfene Alternative und woran sie gescheitert ist.

| Nr | Entscheid | Kern |
|---|---|---|
| [001](docs/entscheide/001-isr-statt-ssr.md) | ISR statt serverseitigem Rendern | Inserate ändern sich stündlich, nicht sekündlich |
| [002](docs/entscheide/002-postgres-statt-mongodb.md) | Postgres statt MongoDB | Festes Schema, Filter über mehrere Spalten, später PostGIS |
| [003](docs/entscheide/003-kennzahlen-in-der-datenbank.md) | Kennzahlen in der Pipeline berechnen | Sonst ist Sortieren nach Rendite unmöglich |
| [004](docs/entscheide/004-postgis-statt-bounding-box.md) | PostGIS statt Rechteck aus Koordinaten | Ein Rechteck ist in der Schweiz merklich verzerrt |

## Was das Projekt zeigt

- **Idempotente Pipeline.** Zweiter Lauf, null neue Zeilen. Nachgewiesen, nicht behauptet, siehe [docs/offene-punkte.md](docs/offene-punkte.md).
- **Zwei Client Components im ganzen Projekt.** Filter, Chips und Blättern laufen über URL und Formular und funktionieren ohne JavaScript. Nur der Renditerechner und die Karte brauchen den Browser.
- **Statische Detailseiten mit Erneuerung.** Messbar am Antwortkopf, nicht am Gefühl.
- **Umkreissuche mit PostGIS.** Zehn Kilometer um Olten, 48 Treffer, gemessene 7.8 ms mit räumlichem Index. Der Abfrageplan steht in [docs/offene-punkte.md](docs/offene-punkte.md).
- **Fehler mit Ursache dokumentiert.** Vier Problem-Dokumente in [docs/architektur.md](docs/architektur.md), darunter der Fall, in dem alle Prüfungen lokal grün und in der CI rot waren, und der ungenutzte räumliche Index.

## Was bewusst fehlt

Auth, Stripe, Benutzerbereich mit Favoriten, Benachrichtigungen, Cron und Scraping sind nicht Teil dieser Arbeitsprobe. Sie sind in anderen Projekten belegt. Der Umfang ist auf das begrenzt, was hier neu gezeigt werden soll: Next.js mit statischer Erzeugung und SEO sowie Postgres mit Filter- und Standortabfragen.

Was innerhalb dieses Umfangs offen ist, steht vollständig in [docs/offene-punkte.md](docs/offene-punkte.md), einschliesslich der Grenzen der Duplikaterkennung.

## Haftungsausschluss

Alle Objekte sind generiert, es steht kein reales Inserat dahinter. Die Renditeberechnungen dienen der Demonstration und sind keine Anlageberatung.

## Lizenz

MIT, siehe [LICENSE](LICENSE).
