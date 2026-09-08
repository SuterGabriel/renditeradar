import type { Metadata } from "next";
import Link from "next/link";

import { FilterChips, FilterLeiste } from "@/components/FilterLeiste";
import { ObjektKarte } from "@/components/ObjektKarte";
import { Seitennavigation } from "@/components/Seitennavigation";
import { holeKantone, holeListe } from "@/lib/abfragen";
import { leseFilter } from "@/lib/filter";
import { SEITEN_URL } from "@/lib/seite";

/**
 * Listenseite mit Filtern, Sortierung und Seitennavigation.
 *
 * Server Component. Der ganze Zustand steht in searchParams, also in der URL.
 * Dadurch ist jede gefilterte Ansicht teilbar und der Zurück-Knopf des Browsers
 * funktioniert ohne eigenes Zutun. Die Seite wird bei jedem Aufruf gerendert,
 * weil searchParams zur Laufzeit gelesen werden. Die Detailseiten sind
 * dagegen statisch, siehe app/objekt/[slug]/page.tsx.
 */

export const metadata: Metadata = {
  alternates: { canonical: SEITEN_URL },
  // Gefilterte Ansichten sind für Suchmaschinen wertlos und erzeugen beliebig
  // viele Adressen für denselben Bestand. Die Liste selbst bleibt indexierbar.
  robots: { index: true, follow: true },
};

export default async function Listenseite({ searchParams }: PageProps<"/">) {
  const filter = leseFilter(await searchParams);
  const [{ objekte, gesamt, seiten }, kantone] = await Promise.all([
    holeListe(filter),
    holeKantone(),
  ]);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
      <div className="lg:w-[280px] lg:shrink-0">
        <FilterLeiste filter={filter} kantone={kantone} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="font-semibold">
            {gesamt} {gesamt === 1 ? "Objekt" : "Objekte"}
          </p>
          <FilterChips filter={filter} />
        </div>

        {objekte.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-kante border border-dashed border-feldrand bg-karte p-8">
            <p className="text-text-sekundaer">
              Keine Objekte für diese Filter
            </p>
            <Link
              href="/"
              className="flex min-h-11 items-center rounded-kante border border-feldrand px-4"
            >
              Filter zurücksetzen
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-3">
            {objekte.map((objekt) => (
              <li key={objekt.slug}>
                <ObjektKarte objekt={objekt} />
              </li>
            ))}
          </ul>
        )}

        <Seitennavigation filter={filter} seiten={seiten} />
      </div>
    </div>
  );
}
