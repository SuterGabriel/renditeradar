---
name: veroeffentlichung
description: Prüfliste vor dem ersten Push auf das öffentliche Remote, vor jedem Deployment auf Vercel und danach. Jeder Punkt wird mit einem Befehl geprüft, nicht mit Augenmass. Laden vor jedem Push und in M4.
---

# Veröffentlichung prüfen

Das Repo ist öffentlich. Was einmal gepusht ist, bleibt in der Historie sichtbar, auch nach dem Löschen. Deshalb wird vor dem Push geprüft, nicht danach.

## Teil A: Vor jedem Push

Alle Befehle vom Repo-Stamm aus. Jeder Befehl muss leer oder ohne Fehler zurückkommen.

### Secrets in der Historie

```
git log -p --all | grep -E "eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|sbp_[A-Za-z0-9]{20,}|sk_(live|test)_|postgresql://[^:<]+:[^@<]+@"
```

Bei einem Treffer: nicht pushen. Historie mit `git filter-repo` bereinigen, Schlüssel im Anbieter-Dashboard rotieren, danach erneut prüfen.

### .env nie eingecheckt

```
git log --all --name-only --pretty=format: | grep -E "^\.env$|^\.env\.local$"
```

### .env.example nur Platzhalter

```
grep -vE "^#|^$|<[a-z-]+>|localhost" .env.example
```

Jede Zeile, die hier erscheint, enthält einen echten Wert.

### Keine fremden Inhalte

```
git log --all --name-only --pretty=format: | grep -E "tailwind-4-docs/references/(docs/|docs-index)"
```

Der Dokumentationssnapshot des Skills `tailwind-4-docs` ist nicht frei lizenziert und bleibt lokal. Grund für diese Prüfung: in M0 sind 236 dieser Dateien einmal in einen Commit geraten.

### Kein Portalname bei Datenbeschaffung

```
git grep -i -E "immoscout|immowelt|homegate|comparis|newhome" -- ':!docs/entscheide' ':!README.md' ':!.claude'
```

Erlaubt ist die Nennung nur in README, Entscheid-Dokumenten und Skills, und dort nur mit der Aussage, dass nicht von dort gelesen wird.

### Kein Scraping-Code

```
git grep -i -E "playwright|selenium|scrapy|puppeteer|bright ?data" -- ':!docs' ':!README.md' ':!.claude'
```

### Lizenz und Haftungsausschluss

```
test -f LICENSE && grep -q "Anlageberatung" README.md
```

### Build und Lint

```
cd web && npx tsc --noEmit && npx eslint . && npx prettier --check . && npx next build
cd pipeline && ruff check . && ruff format --check .
```

`next build` darf keine Warnung ausgeben. Die Build-Ausgabe zeigt je Route, ob sie statisch, ISR oder dynamisch ist. Alle Inhaltsseiten müssen statisch oder ISR sein.

### Rechtschreibung

```
git grep -n -E "—|ß" -- '*.md' '*.py' '*.ts' '*.tsx' '*.sql' ':!.claude/skills/veroeffentlichung'
```

## Teil B: Deployment auf Vercel

### Vorher

1. Teil A vollständig durchlaufen.
2. Umgebungsvariablen in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`. Kein Service-Role-Key, kein Access-Token, keine `DATABASE_URL` in Vercel.
3. Skill `seo` anwenden: Titel und Beschreibung pro Seite, kanonische Adresse, JSON-LD für Inserate, Sitemap und robots erreichbar.
4. Skill `web-design-guidelines` auf die Seiten anwenden und Befunde beheben.
5. Die Seite sagt sichtbar, dass die Inserate generiert sind. Kein Text darf als echtes Angebot verstanden werden.

### Deployment

- Verbindung über die Vercel-GitHub-Integration, Root-Verzeichnis `web/`, Produktion aus `main`. Kein manueller Upload.
- Bei einem Fehler im Build die Vercel-Protokolle lesen und lokal reproduzieren, nicht in Vercel herumprobieren.

### Nachher

1. Demo-URL von einem Gerät ausserhalb des eigenen Netzes öffnen: Liste, Leerzustand, zwei Detailseiten.
2. Skill `core-web-vitals` anwenden: Lighthouse auf Liste und Detailseite, Ziel grün bei LCP, INP und CLS. Werte mit Datum in `docs/offene-punkte.md` festhalten.
3. ISR prüfen: der Antwortkopf `x-vercel-cache` zeigt nach dem zweiten Aufruf `HIT`. Nach Ablauf der Revalidierung `STALE`, dann wieder `HIT`.
4. Sitemap mit der Live-Adresse aufrufen und stichprobenartig eine Adresse daraus öffnen.
5. README auf GitHub ansehen: Bilder laden, Links funktionieren. Demo-URL im README eintragen und committen.

### Bei Problemen

- Fehlende Umgebungsvariable: Build bricht mit Hinweis auf `undefined` ab. Variable in Vercel setzen und neu deployen.
- Seiten dynamisch statt statisch: meist ein Zugriff auf `headers()`, `cookies()` oder `searchParams` ohne `generateStaticParams`. Auf der Liste ist `searchParams` gewollt und die Seite deshalb dynamisch, auf Detailseiten nicht.
- RLS blockiert Abfragen: Policy für `select` mit der Rolle `anon` fehlt. Migration ergänzen, nie im Dashboard klicken.
