import Link from "next/link";

import { KarteLader } from "@/components/KarteLader";
import { holeObjekt, holeVergleichsobjekte } from "@/lib/abfragen";
import { chf, prozent } from "@/lib/format";

/**
 * Die nächstgelegenen Vergleichsobjekte, als Karte und als Liste.
 *
 * Server Component. Sie holt die Nachbarn über die Datenbankfunktion, die den
 * GiST-Index nutzt, und dazu deren Koordinaten für die Karte. Die Liste steht
 * unabhängig von der Karte, deshalb bleibt der Abschnitt auch dann brauchbar,
 * wenn die Karte nicht lädt oder JavaScript aus ist.
 *
 * @param slug Slug des Objekts, zu dem verglichen wird
 * @param mitte Koordinate dieses Objekts
 * @param titel Titel dieses Objekts
 */
export async function Vergleichsobjekte({
  slug,
  mitte,
  titel,
}: {
  slug: string;
  mitte: { lat: number; lon: number };
  titel: string;
}) {
  const nachbarn = await holeVergleichsobjekte(slug, 5);

  if (nachbarn.length === 0) return null;

  // Die Funktion liefert keine Koordinaten, deshalb werden sie hier nachgeholt.
  // Fünf Abfragen parallel, nicht nacheinander, sonst summieren sich die Wege.
  const mitKoordinaten = await Promise.all(
    nachbarn.map(async (n) => {
      const objekt = await holeObjekt(n.slug);
      return {
        ...n,
        lat: objekt?.lat ?? mitte.lat,
        lon: objekt?.lon ?? mitte.lon,
      };
    }),
  );

  return (
    <section
      aria-labelledby="vergleich-titel"
      className="rounded-kante border border-hairline bg-karte p-4"
    >
      <h2 id="vergleich-titel" className="text-abschnitt font-semibold">
        Vergleichsobjekte in der Nähe
      </h2>
      <p className="mt-1 text-sm text-text-sekundaer">
        Die fünf nächstgelegenen Objekte, gesucht über den räumlichen Index in
        der Datenbank.
      </p>

      <div className="mt-4">
        <KarteLader
          mitte={mitte}
          titel={titel}
          nachbarn={mitKoordinaten.map((n) => ({
            slug: n.slug,
            titel: n.titel,
            lat: n.lat,
            lon: n.lon,
            distanzKm: (n.distanz_m / 1000).toFixed(1),
          }))}
        />
      </div>

      <ul className="mt-4">
        {mitKoordinaten.map((n) => (
          <li key={n.slug} className="border-b border-hairline last:border-b-0">
            <Link
              href={`/objekt/${n.slug}`}
              className="flex min-h-11 flex-col justify-center py-2 hover:text-akzent"
            >
              <span className="break-words">{n.titel}</span>
              <span className="text-sm text-text-sekundaer">
                {(n.distanz_m / 1000).toFixed(1)} km · {chf(n.preis_pro_m2)}/m²
                · {prozent(n.bruttorendite)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
