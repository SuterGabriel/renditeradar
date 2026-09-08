# Offene Punkte

Was fehlt, was bewusst weggelassen wurde und was beim Abschluss eines Meilensteins geprüft wurde. Neueste Einträge oben.

## Bewusst nicht im Umfang

- **Auth, Stripe, Cron, Benachrichtigungen.** Durch andere Projekte belegt, hier weggelassen, damit der Umfang in einen Abend passt.
- **Scraping realer Portale.** Rechtlich heikel und für die Demonstration der Pipeline nicht nötig. Die Daten werden generiert, siehe README unter Datenherkunft.
- **Dunkelmodus.** Nicht im Mockup, nicht in der Umsetzung.

## Meilensteine

### M5 Standortsuche, 2026-09-08

Fertig-Kriterium erfüllt. PostGIS 3.3.7, Spalte `geog` als erzeugte Spalte aus `lat` und `lon`, GiST-Index, zwei Datenbankfunktionen und eine Sicht über die Orte.

Umkreis 10 km um Olten, 48 Treffer in sieben Gemeinden, ab 0.3 km. Abfrageplan:

```
Index Scan using objekte_geog_idx on objekte
  Index Cond: (geog && _st_expand('...'::geography, '10000'))
  Filter: st_dwithin(geog, '...'::geography, '10000', true)
Execution Time: 7.825 ms
```

Fünf nächstgelegene Vergleichsobjekte, Order By über den Operator, Execution Time 0.155 ms. Beide unter der Vorgabe von 100 ms.

Seite gegen Datenbank, alle Werte gleich:

| Adresse | Seite | Datenbank |
|---|---|---|
| 5 km um Olten | 31 | 31 |
| 10 km um Olten | 48 | 48 |
| 25 km um Olten | 89 | 89 |
| 50 km um Olten | 203 | 203 |
| 25 km, Wohnung, ab 4.5 % | 33 | 33 |
| unbekannter Ort | 0 | 0 |

Detailseite: Abschnitt mit fünf Vergleichsobjekten, Karte über Leaflet nachgeladen, Seite weiterhin aus dem Cache.

Drei Fehler, die erst die Prüfung gezeigt hat:

1. **Der KNN-Index blieb ungenutzt.** Mit dem Bezugspunkt aus einem Join sah der Planer keine Konstante und wählte einen sequenziellen Durchlauf mit Sortieren. Als skalare Unterabfrage wird daraus ein InitPlan, und der Index greift. 0.63 ms auf 0.16 ms bei 400 Zeilen, entscheidend wird der Unterschied bei mehr Daten.
2. **Ein unbekannter Slug lieferte fünf Zeilen** mit leerer Distanz, weil die Unterabfrage nichts ergab und die Sortierung nichts zu vergleichen hatte. Jetzt eine Bedingung, die den Bezugspunkt voraussetzt.
3. **Ein unbekannter Ort lieferte alle 400 Objekte.** Der Filter fiel still weg, während der Chip weiter einen Umkreis nannte. Jetzt null Treffer.

Offen nach M5:

- Die Sicht `orte` mittelt die Koordinaten der Objekte eines Orts. Bei weit verstreuten Objekten ist dieser Mittelpunkt ungenau. Amtliche Ortskoordinaten wären besser.
- Die Vergleichsobjekte holen ihre Koordinaten in fünf zusätzlichen Abfragen, weil die Datenbankfunktion sie nicht mitliefert. Die Abfragen laufen parallel und sind zwischengespeichert, sauberer wäre eine Rückgabe der Koordinaten aus der Funktion.
- Die Karte ist nicht per Tastatur vollständig bedienbar. Alle Inhalte stehen zusätzlich als Liste darunter, die Karte ist Beiwerk.

### M4 Deployment und Übergabe, 2026-09-08

Der Teil, der ohne Vercel-Konto möglich ist, ist erledigt. Das Deployment selbst fehlt noch.

README geschrieben, mit Zweck, Datenherkunft, Architektur, Stack, Setup, Entscheiden und Haftungsausschluss.

Skill `seo` und `web-design-guidelines` angewendet, acht Befunde behoben:

| Befund | Behebung |
|---|---|
| Listenseite ohne h1, begann mit h2 in den Karten | eigene Überschrift ergänzt |
| Zahlenfeld im Rechner entfernte den Fokusring ersatzlos | Ring sitzt jetzt am umschliessenden Rahmen |
| Keine Sprungmarke zum Inhalt | ergänzt, nur bei Fokus sichtbar |
| Brotkrumen nur sichtbar, nicht maschinenlesbar | zweiter JSON-LD-Block mit BreadcrumbList |
| Zahlenfelder ohne autocomplete | ergänzt, sonst springt der Passwortmanager an |
| Doppeltipp-Zoom verzögert Eingaben | touch-action auf manipulation |
| Überschriften mit Schusterjungen | text-wrap auf balance |
| Bewegung nicht abschaltbar | reduzierte Bewegung wird beachtet |

Dabei fiel ein weiterer Fehler auf: die Maskierung der spitzen Klammer in den strukturierten Daten war nach einer Umschreibung wirkungslos geworden, weil eine Maskierungsebene verlorenging. Ein einzelner Backslash vor u003c ist in TypeScript das Zeichen selbst, die Ersetzung ersetzte es also durch sich selbst. Behoben und mit einem eigenen Testlauf belegt.

Fünfzehn Prüfungen gegen die gerenderte Seite bestehen, darunter genau eine h1 je Seite, Titel je Seite verschieden, kanonische Adresse, Open Graph, zwei JSON-LD-Blöcke, beschriftete Eingabefelder und Ergebnisse in einer Live-Region.

**Deployment** auf Vercel, Root-Verzeichnis `web`, erreichbar unter https://renditeradar-wine.vercel.app

Geprüft gegen die laufende Seite:

| Prüfung | Ergebnis |
|---|---|
| Liste, gefilterte Liste, Umkreis, Leerzustand, Sitemap, robots | HTTP 200 |
| Unbekannter Slug | HTTP 404 |
| Trefferzahlen gegen die Datenbank | 400, 66, 48, 0, alle gleich |
| Detailseite | `X-Vercel-Cache: PRERENDER` |
| Sitemap | 401 Einträge |
| Kanonische Adresse, Sitemap, robots | zeigen auf die tatsächliche Adresse |

**Lighthouse**, Desktop, gegen die laufende Seite:

| Seite | Leistung | Zugänglichkeit | Best Practices | SEO |
|---|---|---|---|---|
| Detailseite | 100 | 100 | 100 | 100 |
| Liste | 97 | 100 | 100 | 100 |

Bei beiden Seiten: Largest Contentful Paint unter 0.6 s, Cumulative Layout Shift 0, Total Blocking Time 0 ms.

Zwei Befunde aus dem ersten Lauf, beide behoben:

1. **Ein Absatz stand als direktes Kind in einer Definitionsliste.** Erlaubt sind dort nur `dt`, `dd` und `div`. Hilfstechnik kann die Liste sonst falsch vorlesen. Der Absatz steht jetzt davor, die Live-Region bleibt auf der Liste.
2. **Es fehlte ein Seitensymbol.** Jeder Seitenaufruf erzeugte dadurch einen Fehler in der Browser-Konsole. Behoben mit einem SVG unter `app/icon.svg`.

Offen nach M4:

- **Die Listenseite verhindert die Wiederherstellung aus dem Vor- und Zurück-Zwischenspeicher des Browsers.** Das ist der einzige verbleibende Lighthouse-Befund und folgt aus dem Entwurf: die Seite liest ihren Zustand aus den Suchparametern und wird deshalb bei jedem Aufruf gerendert, mit `no-store` als Antwort. Der Zurück-Knopf funktioniert, die Seite wird nur neu geholt statt aus dem Zwischenspeicher genommen. Ein Wechsel auf statische Erzeugung wäre nur möglich, wenn der Filterzustand nicht mehr in der Adresse stünde, und das ist ausdrücklich gewollt.
- Die Adresse ist eine Vercel-Unteradresse. Der kurze Name war vergeben, deshalb der Zusatz. Eine eigene Domain würde nur `NEXT_PUBLIC_SITE_URL` brauchen.
- Von einem fremden Gerät ist die Seite noch nicht geöffnet worden. Die Prüfungen liefen über das offene Netz, also von aussen, aber nicht von einem anderen Gerät des Betreibers.

### M3 Renditerechner, 2026-09-08

Fertig-Kriterium erfüllt. Der Rechner ist die erste und einzige Client Component. Die Formel liegt in `web/lib/kennzahlen.ts`, die Komponente enthält nur Eingabe und Anzeige.

Grenzfälle, alle als Test in `web/tests/kennzahlen.test.ts`, 9 Fälle, gesamt 31 Tests grün:

| Grenzfall | Ergebnis |
|---|---|
| Eigenkapital 0 % | Eigenkapitalrendite "keine Angabe", übrige Werte bleiben |
| Eigenkapital 100 % | keine Zinskosten, Eigenkapitalrendite gleich Nettorendite |
| Leerstand 100 % | Rendite 0, Cashflow gleich minus Zinskosten |
| Kaufpreis 0 | alle vier Werte "keine Angabe", kein `NaN`, kein Unendlich |
| Mietertrag 0 | Rendite 0, Cashflow negativ |
| Eingabe `NaN` | kein Wert ist `NaN` |
| Leeres Zahlenfeld | wird als 0 gelesen |

Nachweis gegen den Produktionsserver, Objekt mit Kaufpreis CHF 370'000 und Mietertrag CHF 17'040, Vorgabewerte 20 % Eigenkapital, 2.0 % Zins, 25 % Nebenkosten:

```
Gerendert: 4.6 %, 3.5 %, 9.3 %, +CHF 572
Erwartet:  4.6 %, 3.5 %, 9.3 %, +CHF 572   (Formel unabhängig in Python nachgerechnet)
```

Tastatur: jedes Feld hat ein Label, der Regler reagiert auf Pfeiltasten, das Zahlenfeld nimmt genaue Werte. Die Ergebnisse stehen in einer `aria-live`-Region, damit Screenreader neue Werte vorlesen. Cashflow trägt Vorzeichen und Farbe, nie nur Farbe.

Offen nach M3:

- Das Live-Verhalten beim Ziehen des Reglers ist nicht automatisiert geprüft, nur die Startwerte und die Formel. Ein Browser-Test mit Playwright ist bewusst nicht im Repo, siehe Regel gegen Scraping-Werkzeuge.
- Der Mietertrag ist im Rechner fest, weil er aus den Daten stammt. Ein Feld dafür wäre für Objekte ohne bekannte Miete sinnvoll.

### M2 Next.js Kern, 2026-09-08

Fertig-Kriterium erfüllt. `next build` erzeugt 400 statische Detailseiten:

```
┌ ƒ /                                    dynamisch, liest searchParams
├ ○ /_not-found
├   /objekt/[slug]                       1h Gültigkeit, 1y bis Verfall
│ └ ● [400 Pfade]
├ ○ /robots.txt
└ ○ /sitemap.xml                         1h
```

Eine gefilterte Adresse lässt sich teilen und öffnet mit denselben Filtern. Die
Trefferzahlen der Seite stimmen mit der Datenbank überein:

| Adresse | Seite | Datenbank |
|---|---|---|
| ohne Filter | 400 | 400 |
| `?kanton=SO` | 66 | 66 |
| `?kanton=SO&typ=Wohnung` | 42 | 42 |
| `?kanton=SO&typ=Wohnung&rendite=4.0` | 33 | 33 |
| `?rendite=8` | 0 | 0 |

Weitere Prüfungen gegen den Produktionsserver:

| Prüfung | Ergebnis |
|---|---|
| Detailseite aus dem Cache | `x-nextjs-cache: HIT`, `x-nextjs-prerender: 1` |
| Gültigkeit der Detailseite | `Cache-Control: s-maxage=3600, stale-while-revalidate` |
| Listenseite | `no-store`, wird bei jedem Aufruf gerendert |
| Strukturierte Daten | `Accommodation`, `Offer`, `PostalAddress`, `GeoCoordinates` |
| Kanonische Adresse und Titel je Objekt | vorhanden |
| Sitemap | 401 Einträge, Startseite und 400 Objekte |
| Unbekannter Slug | HTTP 404 |
| Seite 2 mit Filter | "Seite 2 von 6", Filter bleiben in der Adresse |
| Ungültiger Kanton in der Adresse | wird verworfen, keine Fehlermeldung |
| ESLint, Prettier, `tsc --noEmit` | ohne Befund |
| Vitest | 22 Tests grün |

Zwei Fehler, die erst die Tests gezeigt haben:

1. **Negative Zahlen in der Adresse kippten das Vorzeichen.** Die Auswertung entfernte alle Zeichen ausser Ziffern und Punkt. Aus `?preis_von=-5000` wurde damit die Zahl 5000, also das Gegenteil des Gemeinten. Jetzt wird der Wert streng geprüft und bei jedem anderen Zeichen verworfen.
2. **Ein geschütztes Leerzeichen sah aus wie ein normales.** Die Formatierung setzt vor `%` und `m²` ein geschütztes Leerzeichen, damit die Einheit nicht umbricht. Der Test erwartete ein normales und schlug mit zwei scheinbar gleichen Werten fehl. Im Test steht das Zeichen jetzt als Escape, damit der Unterschied lesbar ist.


Nach M2 ergänzt: drei GitHub-Actions-Workflows unter `.github/workflows/` erzwingen die prüfbaren Regeln der Skills bei jedem Push. `pipeline` prüft ruff und pytest, `web` prüft Prettier, ESLint, Typen, Vitest und den Build, `qualitaet` prüft Secrets in der Historie, eingecheckte `.env`, fremde Inhalte, Portalnamen, Scraping-Code, Rechtschreibung, Lizenz und den Abschnitt je Meilenstein-Tag. Der erste Lauf war in allen drei rot, siehe `docs/architektur.md`.

Offen nach M2:

- Der Build-Schritt im Workflow `web` läuft erst, wenn die Repository-Secrets `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` gesetzt sind. Bis dahin wird er mit einer Warnung übersprungen.

- Der Renditerechner fehlt, er kommt in M3 als einzige Client Component.
- Der Typ der Tabelle in `web/lib/typen.ts` ist von Hand geschrieben. `supabase gen types typescript` braucht Docker oder ein persönliches Zugriffstoken, beides ist im Setup nicht vorausgesetzt. Bei einer Schemaänderung muss die Datei mitgeändert werden.
- `generateStaticParams` und die Sitemap lesen höchstens 1000 Zeilen, weil die REST-Schnittstelle nicht mehr auf einmal liefert. Ab mehr Objekten muss dort seitenweise gelesen werden.
- Ein Formular mit GET-Methode hängt auch leere Felder an die Adresse. Ohne JavaScript entsteht dadurch für dieselbe Ansicht eine längere Adresse. Die Filterlogik verwirft leere Werte, die kanonische Adresse bleibt sauber.
- Keine Tests für die Komponenten. Getestet ist nur die Logik in `web/lib/`, 22 Tests mit Vitest. Die Darstellung wurde gegen den laufenden Server geprüft, nicht automatisiert.
- `@types/node` musste von Version 20 auf 24 gehoben werden, weil Vitest neuere Typen verlangt. Version 24 entspricht der tatsächlich verwendeten Node-Laufzeit, die Vorlage von create-next-app war veraltet.

### M1 Datenpipeline, 2026-09-08

Fertig-Kriterium erfüllt. Zwei Läufe von `python main.py` hintereinander:

```
Lauf 1: erzeugt: 400 eindeutig, 20 Duplikate, 0 verworfen
        datenbank: 400 neu, 0 aktualisiert, Zeilen 0 -> 400
Lauf 2: erzeugt: 400 eindeutig, 20 Duplikate, 0 verworfen
        datenbank: 0 neu, 400 aktualisiert, Zeilen 400 -> 400
```

Weitere Messungen aus derselben Datenbank:

| Kennwert | Wert |
|---|---|
| Zeilen | 400 |
| Kantone, Orte | 19, 62 |
| Bruttorendite min, Median, max | 2.2 %, 4.5 %, 7.1 % |
| Listenabfrage mit Kanton, Typ, Preisbereich, sortiert nach Rendite | 0.143 ms, Index Scan auf `objekte_kanton_typ_preis_idx` |
| Lesen über die REST-Schnittstelle mit dem Anon-Key | erfolgreich |
| Schreiben über die REST-Schnittstelle mit dem Anon-Key | abgewiesen, HTTP 401, Fehlercode 42501 |

Problem und Lösung: Die Migration wurde zunächst direkt über die
Postgres-Verbindung ausgeführt, statt über die Supabase-CLI. Die Tabelle
entstand korrekt, aber der Eintrag in `supabase_migrations.schema_migrations`
fehlte. Ein späteres `supabase db push` wäre daran gescheitert, weil die
Tabelle bereits existiert. Der Eintrag wurde nachgetragen. Warum es zählt:
Eine Migration ist erst angewendet, wenn die Datenbank auch weiss, dass sie
angewendet wurde. Sonst weichen Schema und Buchführung auseinander, und der
Fehler zeigt sich erst beim nächsten Deployment.

Offen nach M1:

- Der Dedup-Hash fasst PLZ, Strasse und gerundete Fläche zusammen. Zwei verschiedene Wohnungen im selben Haus mit gleicher Fläche gelten damit als dasselbe Objekt. Bei einer echten Quelle bräuchte es die Stockwerkangabe im Hash.
- Die Spalte `geom` fehlt noch, sie kommt in M5 mit PostGIS.
- Die Pipeline schreibt Zeile für Zeile. Bei 400 Objekten genügt das. Ab einigen Zehntausend wäre `execute_many` oder `COPY` in eine Zwischentabelle nötig.
- Das Datenbank-Passwort enthielt Sonderzeichen und musste in der Verbindungszeichenfolge kodiert werden. Im README steht ein Hinweis dazu.

### M0 Fundament, 2026-09-08

Angelegt: Projektstruktur, Lizenz, `.gitignore`, `.env.example`, MCP-Konfiguration mit Platzhaltern, Skills unter `.claude/skills/`, Mockups unter `docs/mockups/`.

Zwischenfall: Zwei Claude-Sitzungen haben gleichzeitig im Repo geschrieben. Dabei fehlte kurz ein Ignore-Eintrag, und 236 Dateien der Tailwind-Dokumentation gerieten in einen gepushten Commit. Die Historie wurde vor dem ersten Klon neu geschrieben, die Regel "nur benannte Dateien stagen" steht seither im Skill `commit`.

Offen nach M0:

- Supabase-Projekt ist noch nicht verbunden. Die Pipeline in M1 braucht die Verbindungsdaten in `.env`.
- Die Hersteller-Skills unter `.claude/skills/` sind Kopien vom Installationszeitpunkt. Sie werden nicht automatisch aktualisiert.
