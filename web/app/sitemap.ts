import type { MetadataRoute } from "next";

import { holeAlleSlugs } from "@/lib/abfragen";
import { SEITEN_URL } from "@/lib/seite";

/** Die Sitemap wird stündlich erneuert, gleicher Takt wie die Detailseiten */
export const revalidate = 3600;

/**
 * Sitemap mit der Liste und allen Detailseiten.
 *
 * Gefilterte Ansichten kommen nicht hinein: sie zeigen denselben Bestand in
 * anderer Auswahl und würden die Sitemap mit Adressen ohne eigenen Inhalt füllen.
 *
 * @returns Einträge für die Startseite und jedes Objekt
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const objekte = await holeAlleSlugs();

  return [
    {
      url: SEITEN_URL,
      changeFrequency: "hourly",
      priority: 1,
    },
    ...objekte.map(({ slug, erfasst_am }) => ({
      url: `${SEITEN_URL}/objekt/${slug}`,
      lastModified: new Date(erfasst_am),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
