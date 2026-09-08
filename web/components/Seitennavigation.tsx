import Link from "next/link";

import { baueZiel, type Filter } from "@/lib/filter";

/**
 * Blättern zwischen den Seiten der Liste.
 *
 * Server Component. Auf Mobil nur Zurück, Seitenangabe und Weiter, weil einzelne
 * Seitenzahlen dort zu kleine Tap-Ziele wären. Auf Desktop kommen die Zahlen
 * dazu. Deaktivierte Knöpfe sind span-Elemente statt Links, damit sie nicht
 * fokussierbar sind und Screenreader sie nicht als Ziel anbieten.
 *
 * @param filter aktueller Filterzustand, damit die Filter beim Blättern bleiben
 * @param seiten Gesamtzahl der Seiten
 */
export function Seitennavigation({
  filter,
  seiten,
}: {
  filter: Filter;
  seiten: number;
}) {
  if (seiten <= 1) return null;

  const aktuell = Math.min(filter.seite, seiten);
  const knopf =
    "flex min-h-11 items-center justify-center rounded-kante border border-feldrand px-4";
  const knopfAus =
    "flex min-h-11 items-center justify-center rounded-kante border border-hairline px-4 text-text-deaktiviert";

  return (
    <nav
      aria-label="Seiten"
      className="flex items-center justify-between gap-2"
    >
      {aktuell > 1 ? (
        <Link href={baueZiel(filter, { seite: aktuell - 1 })} className={knopf}>
          Zurück
        </Link>
      ) : (
        <span className={knopfAus} aria-disabled>
          Zurück
        </span>
      )}

      <p className="text-sm text-text-sekundaer lg:hidden">
        Seite {aktuell} von {seiten}
      </p>

      <ul className="hidden items-center gap-1 lg:flex">
        {seitenzahlen(aktuell, seiten).map((eintrag, index) =>
          eintrag === null ? (
            <li key={`luecke-${index}`} className="px-2 text-text-sekundaer">
              …
            </li>
          ) : (
            <li key={eintrag}>
              {eintrag === aktuell ? (
                <span
                  aria-current="page"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-kante border border-akzent bg-akzent-tint px-3 font-semibold text-akzent"
                >
                  {eintrag}
                </span>
              ) : (
                <Link
                  href={baueZiel(filter, { seite: eintrag })}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-kante px-3 hover:bg-akzent-tint"
                >
                  {eintrag}
                </Link>
              )}
            </li>
          ),
        )}
      </ul>

      {aktuell < seiten ? (
        <Link href={baueZiel(filter, { seite: aktuell + 1 })} className={knopf}>
          Weiter
        </Link>
      ) : (
        <span className={knopfAus} aria-disabled>
          Weiter
        </span>
      )}
    </nav>
  );
}

/**
 * Baut die Folge der Seitenzahlen mit Auslassungen.
 *
 * Gezeigt werden die erste Seite, die aktuelle mit einer Nachbarin links und
 * rechts und die letzte. Dazwischen steht null für eine Auslassung.
 *
 * @param aktuell aktuelle Seite
 * @param seiten Gesamtzahl
 * @returns Seitenzahlen, null steht für die Auslassung
 */
function seitenzahlen(aktuell: number, seiten: number): (number | null)[] {
  const gezeigt = new Set<number>([
    1,
    seiten,
    aktuell - 1,
    aktuell,
    aktuell + 1,
  ]);
  const folge: (number | null)[] = [];
  let letzte = 0;

  for (let seite = 1; seite <= seiten; seite += 1) {
    if (!gezeigt.has(seite)) continue;
    if (letzte && seite - letzte > 1) folge.push(null);
    folge.push(seite);
    letzte = seite;
  }
  return folge;
}
