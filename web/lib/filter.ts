import { OBJEKT_TYPEN, type ObjektTyp } from "@/lib/typen";

/**
 * Filter, Sortierung und Seitenzahl der Listenansicht.
 *
 * Der gesamte Zustand der Liste steht in der URL, nicht in React-State. Damit
 * ist jede gefilterte Ansicht teilbar, im Verlauf navigierbar und für
 * Suchmaschinen erreichbar. Die Seite bleibt eine Server Component, weil sie
 * keinen Zustand halten muss.
 */

/** Objekte pro Seite. Drei Spalten auf Desktop, deshalb ein Vielfaches von 3. */
export const PRO_SEITE = 12;

/** Sortierungen, die die Liste anbietet. Der Schlüssel steht in der URL. */
export const SORTIERUNGEN = {
  rendite: {
    titel: "Rendite absteigend",
    spalte: "bruttorendite",
    aufsteigend: false,
  },
  preis: { titel: "Preis aufsteigend", spalte: "preis_chf", aufsteigend: true },
  quadratmeter: {
    titel: "Preis pro m² aufsteigend",
    spalte: "preis_pro_m2",
    aufsteigend: true,
  },
} as const;

export type SortierSchluessel = keyof typeof SORTIERUNGEN;

const SORTIER_SCHLUESSEL = Object.keys(SORTIERUNGEN) as SortierSchluessel[];

/** Geprüfter Filterzustand. Ein fehlender Wert bedeutet: nicht gefiltert. */
export type Filter = {
  kanton: string | null;
  typ: ObjektTyp | null;
  preisVon: number | null;
  preisBis: number | null;
  renditeMin: number | null;
  sortierung: SortierSchluessel;
  seite: number;
};

/** Rohform der Suchparameter, wie Next.js sie übergibt */
export type SuchParameter = Record<string, string | string[] | undefined>;

/**
 * Liest einen einzelnen Wert aus den Suchparametern.
 * Bei mehrfach gesetztem Parameter gilt der erste, damit ein manipulierter
 * Link nicht zu einem Array führt, wo ein Text erwartet wird.
 */
function einzelwert(roh: string | string[] | undefined): string | null {
  const wert = Array.isArray(roh) ? roh[0] : roh;
  return wert && wert.trim() !== "" ? wert.trim() : null;
}

/**
 * Liest eine positive Zahl aus den Suchparametern.
 * @returns die Zahl, oder null bei fehlendem, negativem oder unlesbarem Wert
 */
function zahl(roh: string | string[] | undefined): number | null {
  const wert = einzelwert(roh);
  if (wert === null) return null;
  // Streng geprüft statt Zeichen entfernt: ein Filtern der Nicht-Ziffern würde
  // aus "-5000" die Zahl 5000 machen und damit das Gegenteil des Gemeinten.
  if (!/^\d+(\.\d+)?$/.test(wert)) return null;
  const n = Number(wert);
  return Number.isFinite(n) ? n : null;
}

/**
 * Wandelt die Suchparameter einer URL in einen geprüften Filter um.
 *
 * Unbekannte Werte werden verworfen statt an die Datenbank weitergereicht.
 * Der Kanton wird auf zwei Grossbuchstaben begrenzt, der Typ muss einer der
 * drei bekannten sein. Damit kann kein Wert aus der URL die Abfrage verbiegen.
 *
 * @param parameter Suchparameter aus der Route
 * @returns Filter mit Vorgabewerten für Sortierung und Seite
 */
export function leseFilter(parameter: SuchParameter): Filter {
  const kantonRoh = einzelwert(parameter.kanton)?.toUpperCase() ?? null;
  const typRoh = einzelwert(parameter.typ);
  const sortierungRoh = einzelwert(parameter.sortierung);
  const seiteRoh = zahl(parameter.seite);

  return {
    kanton: kantonRoh && /^[A-Z]{2}$/.test(kantonRoh) ? kantonRoh : null,
    typ: OBJEKT_TYPEN.includes(typRoh as ObjektTyp)
      ? (typRoh as ObjektTyp)
      : null,
    preisVon: zahl(parameter.preis_von),
    preisBis: zahl(parameter.preis_bis),
    renditeMin: zahl(parameter.rendite),
    sortierung: SORTIER_SCHLUESSEL.includes(sortierungRoh as SortierSchluessel)
      ? (sortierungRoh as SortierSchluessel)
      : "rendite",
    seite: seiteRoh && seiteRoh >= 1 ? Math.floor(seiteRoh) : 1,
  };
}

/** Ziel eines Links auf die Liste, in der Form, die next/link typisiert akzeptiert */
export type Listenziel = { pathname: "/"; query: Record<string, string> };

/**
 * Baut aus einem Filter das Ziel eines Links auf die Liste.
 *
 * Vorgabewerte werden weggelassen, damit die URL kurz bleibt und dieselbe
 * Ansicht immer dieselbe Adresse hat. Das ist auch für die kanonische Adresse
 * wichtig, sonst entstehen für einen Inhalt mehrere Adressen.
 *
 * @param filter Filterzustand
 * @param aenderung Felder, die überschrieben werden. Die Seite springt dabei
 *   auf 1, ausser die Änderung betrifft die Seite selbst.
 * @returns Pfad und Abfrageparameter, für den href von next/link
 */
export function baueZiel(
  filter: Filter,
  aenderung: Partial<Filter> = {},
): Listenziel {
  const neu: Filter = { ...filter, ...aenderung };
  if (aenderung.seite === undefined) {
    neu.seite = 1;
  }

  const query: Record<string, string> = {};
  if (neu.kanton) query.kanton = neu.kanton;
  if (neu.typ) query.typ = neu.typ;
  if (neu.preisVon !== null) query.preis_von = String(neu.preisVon);
  if (neu.preisBis !== null) query.preis_bis = String(neu.preisBis);
  if (neu.renditeMin !== null) query.rendite = String(neu.renditeMin);
  if (neu.sortierung !== "rendite") query.sortierung = neu.sortierung;
  if (neu.seite > 1) query.seite = String(neu.seite);

  return { pathname: "/", query };
}

/** Zählt die gesetzten Filter, für die Anzeige "Filter (2)" auf Mobil */
export function zaehleFilter(filter: Filter): number {
  return [
    filter.kanton,
    filter.typ,
    filter.preisVon,
    filter.preisBis,
    filter.renditeMin,
  ].filter((wert) => wert !== null).length;
}
