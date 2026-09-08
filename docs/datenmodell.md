# Datenmodell

Eine Tabelle genügt. Kennzahlen sind gespeicherte Spalten, damit nach ihnen gefiltert und sortiert werden kann. Die Migration liegt in `supabase/migrations/20260908000100_objekte.sql`.

## Tabelle objekte

| Spalte | Typ | Bemerkung |
|---|---|---|
| `id` | bigint identity | Primärschlüssel, fortlaufend. Keine UUID, siehe unten |
| `dedup_hash` | text unique | SHA-256, gekürzt auf 24 Zeichen, aus PLZ, normalisierter Strasse und gerundeter Fläche |
| `titel` | text | für Metadaten und H1, zum Beispiel "3.5-Zimmer-Wohnung in Olten" |
| `slug` | text unique | Titel als URL-Pfad plus sechs Zeichen des Hashs, damit gleiche Titel im selben Ort verschiedene Slugs haben |
| `typ` | text | Wohnung, Haus oder Mehrfamilienhaus, per Check-Constraint |
| `plz`, `ort`, `kanton` | text | PLZ vierstellig, Kanton zweibuchstabig, beide per Check-Constraint |
| `strasse` | text | lesbare Schreibweise, nicht die normalisierte |
| `flaeche_m2` | numeric(7,1) | grösser als 0 |
| `zimmer` | numeric(3,1) | halbe Zimmer möglich, 3.5 |
| `preis_chf` | integer | grösser als 0 |
| `mietertrag_jahr_chf` | integer | Jahresmiete, aus Monatsmiete mal 12 |
| `nebenkosten_quote` | numeric(4,3) | Vorgabewert 0.25 |
| `bruttorendite` | numeric(6,4) | berechnet, als Anteil: 0.0481 bedeutet 4.8 % |
| `nettorendite` | numeric(6,4) | berechnet |
| `preis_pro_m2` | numeric(10,2) | berechnet |
| `preis_pro_zimmer` | numeric(12,2) | berechnet |
| `lat`, `lon` | numeric(9,6) | Check-Constraint auf die Schweiz |
| `geom` | geography(Point,4326) | erst in M5 |
| `quelle` | text | "generiert-v1" |
| `erfasst_am` | timestamptz | Datum der Ersterfassung, bleibt beim Upsert |

## Indizes

| Index | Spalten | Abfrage, die davon profitiert |
|---|---|---|
| Primärschlüssel | `id` | |
| unique | `dedup_hash` | Upsert der Pipeline |
| unique | `slug` | Detailseite |
| `objekte_kanton_typ_preis_idx` | `(kanton, typ, preis_chf)` | Listenfilter: Gleichheit auf Kanton und Typ, Bereich auf Preis. Gleichheitsspalten zuerst, damit der Index auch bei Filter nur nach Kanton greift |
| `objekte_bruttorendite_idx` | `(bruttorendite desc)` | Standardsortierung der Liste |
| GiST auf `geom` | | Umkreissuche, erst in M5 |

## Zugriff

RLS ist aktiv. Eine Policy erlaubt `select` für die Rollen `anon` und `authenticated`. Es gibt keine Policy für `insert`, `update` oder `delete`. Die Next.js-App greift nur mit dem Anon-Key zu und kann deshalb nur lesen. Die Pipeline schreibt über die direkte Postgres-Verbindung als Tabellenbesitzer, RLS gilt für sie nicht.

## Kennzahlen

Formeln in `pipeline/kennzahlen.py` und identisch in `web/lib/kennzahlen.ts`:

```
bruttorendite       = mietertrag_jahr / preis
nettorendite        = mietertrag_jahr * (1 - nebenkosten_quote) / preis
preis_pro_m2        = preis / flaeche_m2
preis_pro_zimmer    = preis / zimmer
eigenkapitalrendite = (mietertrag_netto - zinskosten) / eigenkapital
```

Die ersten vier werden in der Pipeline berechnet und gespeichert. Die Eigenkapitalrendite hängt von Annahmen des Nutzers ab und wird nur im Renditerechner berechnet.

## Duplikaterkennung

Der Hash bildet sich aus PLZ, Strasse und Fläche. Die Strasse wird vorher normalisiert: Kleinbuchstaben, "str." zu "strasse", Akzente entfernt, Leerraum gestrafft. Die Fläche wird auf ganze m² gerundet. Damit fallen "Aarburgerstrasse 12, 82 m²" und "aarburgerstr. 12, 82.4" zusammen. Zwei verschiedene Wohnungen im selben Haus mit gleicher Fläche fallen ebenfalls zusammen. Das ist eine bewusste Grenze, siehe `docs/offene-punkte.md`.

## Warum bigint statt UUID

Der Projektplan sah `uuid` vor. Die Postgres-Regeln von Supabase raten davon ab, weil zufällige UUIDs den Index fragmentieren. Die öffentliche Kennung ist ohnehin der Slug, die ID erscheint nirgends in der URL. Deshalb eine fortlaufende Ganzzahl.
