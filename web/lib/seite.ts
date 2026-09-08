/**
 * Öffentliche Adresse der Anwendung.
 *
 * Wird für kanonische Adressen, Open Graph, Sitemap und robots gebraucht. Eine
 * falsche Adresse ist hier schlimmer als keine, weil eine kanonische Adresse
 * ins Leere Suchmaschinen auf eine Seite verweist, die es nicht gibt.
 *
 * Deshalb drei Quellen in dieser Reihenfolge:
 *
 * 1. `NEXT_PUBLIC_SITE_URL`, gesetzt für eine eigene Domain.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL`, von Vercel selbst gesetzt und immer die
 *    tatsächliche Produktionsadresse. Damit stimmt sie auch dann, wenn der
 *    Projektname bereits vergeben war und Vercel einen Zusatz angehängt hat.
 * 3. Der Entwicklungsserver.
 *
 * Alle Stellen, die diesen Wert lesen, laufen auf dem Server. Deshalb genügt
 * eine Variable ohne das Präfix NEXT_PUBLIC.
 */
function ermittleUrl(): string {
  const gesetzt = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (gesetzt) return gesetzt;

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const SEITEN_URL = ermittleUrl().replace(/\/$/, "");

/** Name der Anwendung, einheitlich für Titel und strukturierte Daten */
export const SEITEN_NAME = "renditeradar";
