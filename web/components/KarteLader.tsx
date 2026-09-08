"use client";

import dynamic from "next/dynamic";

/*
 * Leaflet spricht den DOM direkt an und läuft auf dem Server nicht. Der Import
 * muss deshalb mit ssr: false erfolgen. Diese Option ist seit Next.js 15 nur in
 * einer Client Component erlaubt, in einer Server Component bricht der Build ab.
 * Darum diese Zwischenschicht: sie ist selbst eine Client Component und enthält
 * ausser dem Laden nichts.
 *
 * Der Nutzen bleibt derselbe: die Detailseite wird weiterhin statisch erzeugt,
 * und die Kartenbibliothek kommt erst im Browser dazu.
 */
const Umgebungskarte = dynamic(
  () => import("@/components/Umgebungskarte").then((m) => m.Umgebungskarte),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-60 items-center justify-center rounded-kante bg-platzhalter text-sm text-text-sekundaer">
        Karte wird geladen …
      </div>
    ),
  },
);

/** Reicht die Eigenschaften unverändert an die Karte weiter. */
export function KarteLader(props: {
  mitte: { lat: number; lon: number };
  titel: string;
  nachbarn: {
    slug: string;
    titel: string;
    lat: number;
    lon: number;
    distanzKm: string;
  }[];
}) {
  return <Umgebungskarte {...props} />;
}
