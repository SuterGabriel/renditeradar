import Link from "next/link";

import { chf, flaeche, prozent, zimmer as formatZimmer } from "@/lib/format";
import type { ObjektKarteDaten } from "@/lib/typen";

/**
 * Eine Objektkarte in der Liste.
 *
 * Server Component, sie hat keinen Zustand. Die ganze Karte ist ein Link und
 * nicht nur der Titel, damit das Tap-Ziel auf Mobil gross genug ist. Das ist
 * eine bewusste Abweichung vom Mockup, siehe docs/architektur.md.
 *
 * Die Reihenfolge der Werte folgt der Leseordnung eines Anlegers: Kaufpreis
 * am grössten, Bruttorendite als zweitgrösster Wert, Preis pro m² klein.
 */
export function ObjektKarte({ objekt }: { objekt: ObjektKarteDaten }) {
  return (
    <Link
      href={`/objekt/${objekt.slug}`}
      className="block rounded-kante border border-hairline bg-karte p-4 transition-colors hover:border-akzent"
    >
      <h2 className="font-semibold">{objekt.titel}</h2>
      <p className="text-sm text-text-sekundaer">
        {objekt.plz} {objekt.ort}, {objekt.kanton}
      </p>
      <p className="mt-1 text-sm text-text-sekundaer">
        {objekt.typ} · {formatZimmer(objekt.zimmer)} Zi ·{" "}
        {flaeche(objekt.flaeche_m2)}
      </p>
      <p className="mt-3 text-preis font-semibold">{chf(objekt.preis_chf)}</p>
      <p className="mt-1 text-akzent">
        <span className="font-semibold">
          {prozent(objekt.bruttorendite)} brutto
        </span>
        <span className="text-sm"> · {prozent(objekt.nettorendite)} netto</span>
      </p>
      <p className="mt-1 text-xs text-text-sekundaer">
        {chf(objekt.preis_pro_m2)}/m²
      </p>
    </Link>
  );
}
