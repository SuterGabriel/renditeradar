---
name: stack-regeln
description: Verbindliche Versionen und Regeln für den Technologie-Stack von renditeradar. Immer laden, bevor Code, Konfiguration oder Schema geschrieben oder geändert wird. Spitzt die Hersteller-Skills (vercel-react-best-practices, supabase-postgres-best-practices, tailwind-4-docs, postgis, seo) auf dieses Projekt zu.
---

# Stack-Regeln für renditeradar

Dieser Skill legt fest, welche Version gilt und welche Regeln der Hersteller-Skills in diesem Projekt verbindlich sind. Bei Widersprüchen zwischen einem Hersteller-Skill und diesem Skill gilt dieser Skill.

## Versionen

| Bereich | Version | Bemerkung |
|---------|---------|-----------|
| Next.js | 16, App Router | Kein Pages Router, keine `getStaticProps` |
| React | 19 | Server Components sind Standard |
| TypeScript | 5, strict | Kein `any` ohne Begründung im Kommentar |
| Tailwind CSS | 4 | Konfiguration in CSS, keine `tailwind.config.js` |
| Supabase | Postgres 15 mit PostGIS | Zugriff nur über Anon-Key mit RLS |
| Python | 3.13 | Pipeline unter `pipeline/`, geprüft mit ruff |
| Node.js | 24 LTS | Paketmanager npm |

## Next.js

- Jede Seite ist eine Server Component. Client Components nur mit `"use client"` und nur dort, wo Interaktion nötig ist. Im Umfang bis M4 ist der Renditerechner die einzige Client Component.
- Statische Erzeugung mit ISR: `generateStaticParams` für bekannte Pfade, `revalidate` als exportierte Konstante pro Route. Kein `dynamic = "force-dynamic"`.
- Metadaten über `generateMetadata`, nicht über manuelle `<head>`-Tags. Sitemap und robots über die Dateikonventionen `app/sitemap.ts` und `app/robots.ts`.
- Datenzugriff ausschliesslich in Server Components oder in `lib/`. Kein Supabase-Client im Browser, ausser für den Renditerechner, der ohne Datenbank auskommt.
- Vor Antworten zu Next.js-APIs die Dokumentation über Context7 oder den Next.js DevTools MCP prüfen. Trainingswissen zu Next.js gilt als veraltet.

## Tailwind 4

- Konfiguration über `@import "tailwindcss"` und `@theme` in `app/globals.css`. Keine `tailwind.config.js`, kein `content`-Array.
- Design-Token als CSS-Variablen im `@theme`-Block. Keine Hex-Werte direkt in Klassen.
- Bei Unsicherheit über eine Klasse den Skill `tailwind-4-docs` konsultieren, nicht raten. Viele v3-Klassen und Optionen existieren in v4 nicht mehr.

## Supabase und Postgres

- Die App greift nur mit dem Anon-Key zu. Jede Tabelle hat RLS aktiviert mit einer expliziten Policy für `select`. Keine Policy für `insert`, `update` oder `delete` über den Anon-Key.
- Der Service-Role-Key wird nur von der Python-Pipeline verwendet und nur lokal über `.env`.
- Schema-Änderungen als Migrationen unter `supabase/migrations/`, nie manuell im Dashboard.
- Räumliche Spalten als `geography(Point, 4326)` mit GiST-Index. Umkreissuche mit `ST_DWithin`, nicht mit `ST_Distance` im `where`. Gilt erst ab M5.
- Der Supabase MCP-Server läuft im Nur-Lese-Modus. Schreibende Operationen laufen über Migrationen und die CLI.

## Python-Pipeline

- Eine Datei pro Schritt unter `pipeline/`, Einstieg über `pipeline/main.py`.
- Formatierung und Lint mit ruff, Konfiguration in `pyproject.toml`. Kein black, kein flake8.
- Typannotationen an allen Funktionen. Docstrings nach den Regeln des Skills `code-stil`.
- Daten werden generiert, nicht von realen Portalen geladen.

## MCP-Server

| Server | Zweck | Grenzen |
|--------|-------|---------|
| supabase | Schema lesen, Abfragen prüfen | Nur-Lese-Modus, ein Projekt |
| next-devtools | Build-Fehler, Routen, Rendering aus dem Dev-Server | Nur bei laufendem `next dev` |
| context7 | Versionsgenaue Dokumentation | Vor Antworten zu Next.js, Supabase, Tailwind |

Die Konfiguration liegt in `.mcp.json` mit Platzhaltern. Echte Werte stehen in `.env` und werden nie eingecheckt.

## Nicht im Umfang

Auth, Stripe, Scraping realer Portale und Cron sind bewusst ausgeschlossen. Vorschläge in diese Richtung werden abgelehnt, mit Verweis auf diesen Skill.
