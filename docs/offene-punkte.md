# Offene Punkte

Was fehlt, was bewusst weggelassen wurde und was beim Abschluss eines Meilensteins geprüft wurde. Neueste Einträge oben.

## Bewusst nicht im Umfang

- **Auth, Stripe, Cron, Benachrichtigungen.** Durch andere Projekte belegt, hier weggelassen, damit der Umfang in einen Abend passt.
- **Scraping realer Portale.** Rechtlich heikel und für die Demonstration der Pipeline nicht nötig. Die Daten werden generiert, siehe README unter Datenherkunft.
- **Dunkelmodus.** Nicht im Mockup, nicht in der Umsetzung.

## Meilensteine

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
