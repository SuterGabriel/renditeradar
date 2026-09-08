/**
 * Öffentliche Adresse der Anwendung.
 *
 * Wird für kanonische Adressen, Open Graph, Sitemap und robots gebraucht. Auf
 * Vercel setzt die Umgebung NEXT_PUBLIC_SITE_URL, lokal gilt der Entwicklungsserver.
 */
export const SEITEN_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** Name der Anwendung, einheitlich für Titel und strukturierte Daten */
export const SEITEN_NAME = "renditeradar";
