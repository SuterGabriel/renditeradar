# 004: Umkreissuche mit PostGIS statt mit einem Rechteck aus Koordinaten

Datum: 2026-09-08

## Ausgangslage

Die Liste soll nach "im Umkreis von 10 km um Olten" filtern, und die Detailseite soll die fünf nächstgelegenen Vergleichsobjekte zeigen. Zur Wahl standen ein Rechteck aus Längen- und Breitengraden, eine Distanzberechnung in der Anwendung und PostGIS in der Datenbank.

## Entscheid

PostGIS mit einer Spalte `geog` vom Typ `geography(Point, 4326)`, einem GiST-Index darauf, `ST_DWithin` für den Umkreis und dem Operator `<->` für die Suche nach dem nächsten Nachbarn.

Die Spalte ist eine erzeugte Spalte, abgeleitet aus `lat` und `lon`. Sie kann deshalb nicht von den Koordinaten abweichen, und die Pipeline muss nichts von ihr wissen.

## Begründung

Ein Grad Länge misst am Äquator rund 111 km, auf der Breite der Schweiz noch etwa 76 km. Ein Rechteck aus festen Gradabständen ist deshalb kein Kreis, sondern in Ost-West-Richtung um rund ein Drittel gestaucht. `ST_DWithin` auf `geography` rechnet in Metern auf dem Ellipsoid und liefert genau das, was der Nutzer erwartet.

Gemessen an der laufenden Datenbank, 400 Objekte:

| Abfrage | Zeit | Plan |
|---|---|---|
| Umkreis 10 km um Olten, 48 Treffer | 7.8 ms | `Index Scan using objekte_geog_idx`, Bedingung `geog && _st_expand(...)` |
| Fünf nächste Nachbarn | 0.16 ms | `Index Scan using objekte_geog_idx`, `Order By: geog <-> ...` |

Beide bleiben deutlich unter der Vorgabe von 100 ms.

## Verworfene Alternativen

- **Rechteck aus Längen- und Breitengraden.** In wenigen Zeilen gebaut und ohne Erweiterung möglich. Verworfen, weil es in der Schweiz merklich verzerrt: ein Objekt 12 km östlich fällt in ein Rechteck, das nach 10 km fragt. Für eine Vorauswahl mit anschliessender genauer Prüfung wäre es brauchbar, aber die genaue Prüfung braucht dann ohnehin die Distanzfunktion.
- **Distanzberechnung in der Anwendung.** Die Haversine-Formel in TypeScript ist einfach. Verworfen, weil kein Index nutzbar ist: die Anwendung müsste alle Objekte laden und dann filtern. Bei 400 Objekten geht das, bei 40'000 nicht mehr, und die Seitennavigation würde falsch zählen.
- **Ein Join statt einer skalaren Unterabfrage** bei den Vergleichsobjekten. Naheliegend geschrieben, aber der Bezugspunkt ist dann für den Planer keine Konstante, und der KNN-Index bleibt ungenutzt. Der Plan zeigte `Seq Scan` mit anschliessendem Sortieren.

## Folgen

- Das Projekt hängt an der PostGIS-Erweiterung. Ein Umzug auf eine Postgres-Installation ohne PostGIS erfordert die Umkreissuche neu.
- Die Umkreissuche läuft über eine Datenbankfunktion, weil sich `ST_DWithin` nicht als Filter der REST-Schnittstelle ausdrücken lässt. Die Funktion gibt `setof objekte` zurück, damit alle übrigen Filter unverändert darauf greifen. Sie kann jedoch nur nach Spalten sortieren, die in der Auswahl stehen, deshalb ist das zweite Sortierkriterium der Slug und nicht die id.
- Die Sicht `orte` löst einen Ortsnamen in eine Koordinate auf. Sie mittelt die Koordinaten der Objekte eines Orts. Für einen Ort mit weit auseinanderliegenden Objekten ist dieser Mittelpunkt ungenau. Eine Liste amtlicher Ortskoordinaten wäre genauer und ist als offener Punkt vermerkt.
