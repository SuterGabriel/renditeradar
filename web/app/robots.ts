import type { MetadataRoute } from "next";

import { SEITEN_URL } from "@/lib/seite";

/**
 * Regeln für Suchmaschinen.
 *
 * Die Liste und die Detailseiten sind frei. Gefilterte Ansichten werden
 * ausgeschlossen: sie zeigen denselben Bestand in anderer Auswahl, und jede
 * Filterkombination wäre eine eigene Adresse ohne eigenen Inhalt.
 *
 * @returns robots.txt mit Verweis auf die Sitemap
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/?", "/*?kanton=", "/*?typ=", "/*?seite=", "/*?sortierung="],
    },
    sitemap: `${SEITEN_URL}/sitemap.xml`,
  };
}
