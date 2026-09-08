# Offene Punkte

Was fehlt, was bewusst weggelassen wurde und was beim Abschluss eines Meilensteins geprüft wurde. Neueste Einträge oben.

## Bewusst nicht im Umfang

- **Auth, Stripe, Cron, Benachrichtigungen.** Durch andere Projekte belegt, hier weggelassen, damit der Umfang in einen Abend passt.
- **Scraping realer Portale.** Rechtlich heikel und für die Demonstration der Pipeline nicht nötig. Die Daten werden generiert, siehe README unter Datenherkunft.
- **Dunkelmodus.** Nicht im Mockup, nicht in der Umsetzung.

## Meilensteine

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


Offen nach M2:

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
