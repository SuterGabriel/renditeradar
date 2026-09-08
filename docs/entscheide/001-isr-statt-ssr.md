# 001: Detailseiten statisch mit ISR statt serverseitig bei jedem Aufruf

Datum: 2026-09-08

## Ausgangslage

Die Detailseite eines Objekts zeigt Daten, die sich selten ändern. Ein Inserat wird höchstens stündlich angepasst, meist gar nicht. Trotzdem soll die Seite aktuell bleiben, ohne dass für jede Änderung ein neuer Build nötig ist. Zur Wahl standen serverseitiges Rendern bei jedem Aufruf, rein statische Erzeugung beim Build und statische Erzeugung mit Erneuerung im Hintergrund.

## Entscheid

Statische Erzeugung über `generateStaticParams` mit `export const revalidate = 3600`. Zusätzlich `dynamicParams = true`, damit ein Objekt, das nach dem Build dazugekommen ist, beim ersten Aufruf erzeugt und danach mitgeliefert wird.

Die Listenseite bleibt bewusst dynamisch. Sie liest ihre Filter aus den Suchparametern der URL, und jede Filterkombination wäre eine eigene statische Seite.

## Begründung

Der Build erzeugt aktuell 400 Detailseiten in rund drei Sekunden. Ausgeliefert werden sie danach aus dem Cache, ohne Datenbankzugriff. Der Antwortkopf zeigt das:

```
x-nextjs-cache: HIT
x-nextjs-prerender: 1
Cache-Control: s-maxage=3600, stale-while-revalidate=31532400
```

Nach einer Stunde liefert der Server weiter die zwischengespeicherte Seite aus und erneuert sie im Hintergrund. Kein Besucher wartet auf die Datenbank, und trotzdem ist die Seite nie länger als eine Stunde veraltet.

## Verworfene Alternativen

- **Serverseitiges Rendern bei jedem Aufruf.** Jeder Besuch erzeugt eine Datenbankabfrage und wartet auf sie. Bei Daten, die sich stündlich ändern, ist das Last ohne Gegenwert. Die Antwortzeit hängt dann an der Datenbank statt am Cache.
- **Rein statisch ohne Erneuerung.** Schnellste Auslieferung, aber die Seiten veralten bis zum nächsten Build. Ein neues Objekt aus der Pipeline wäre erst nach einem Deployment sichtbar. Für einen Aggregator, der täglich einliest, ist das zu träge.

## Folgen

- Zwischen einer Änderung in der Datenbank und der aktualisierten Seite liegt bis zu eine Stunde. Für Preise ist das vertretbar, für einen Bestand mit Reservationen wäre es zu lang. Dann bräuchte es eine gezielte Erneuerung über `revalidateTag` beim Pipeline-Lauf.
- Der Build muss alle Slugs kennen. `generateStaticParams` liest sie über die REST-Schnittstelle, die höchstens 1000 Zeilen auf einmal liefert. Ab mehr Objekten muss dort seitenweise gelesen werden, siehe `docs/offene-punkte.md`.
- Die Listenseite ist dynamisch und fragt die Datenbank bei jedem Aufruf. Das ist der Preis dafür, dass der Filterzustand in der URL steht und jede Ansicht teilbar ist.
