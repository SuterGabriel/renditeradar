/**
 * Typ der Tabelle public.objekte.
 *
 * Von Hand geschrieben und mit supabase/migrations/20260908000100_objekte.sql
 * abzugleichen. Die Erzeugung mit `supabase gen types typescript` braucht
 * entweder Docker oder ein persönliches Zugriffstoken, beides ist im Setup
 * nicht vorausgesetzt. Bei einer Schemaänderung muss diese Datei mitgeändert
 * werden, siehe docs/offene-punkte.md.
 */

/** Zulässige Objekttypen, entspricht dem Check-Constraint auf der Spalte typ */
export const OBJEKT_TYPEN = ["Wohnung", "Haus", "Mehrfamilienhaus"] as const;

export type ObjektTyp = (typeof OBJEKT_TYPEN)[number];

/** Eine Zeile der Tabelle objekte, wie sie die Datenbank liefert */
export type Objekt = {
  id: number;
  dedup_hash: string;
  titel: string;
  slug: string;
  typ: ObjektTyp;
  plz: string;
  ort: string;
  kanton: string;
  strasse: string;
  flaeche_m2: number;
  zimmer: number;
  preis_chf: number;
  mietertrag_jahr_chf: number;
  nebenkosten_quote: number;
  bruttorendite: number;
  nettorendite: number;
  preis_pro_m2: number;
  preis_pro_zimmer: number;
  lat: number;
  lon: number;
  quelle: string;
  erfasst_am: string;
};

/** Felder, die die Listenansicht braucht. Weniger Daten pro Karte, kleinere Antwort. */
export const KARTE_FELDER =
  "slug,titel,typ,plz,ort,kanton,zimmer,flaeche_m2,preis_chf,bruttorendite,nettorendite,preis_pro_m2" as const;

export type ObjektKarteDaten = Pick<
  Objekt,
  | "slug"
  | "titel"
  | "typ"
  | "plz"
  | "ort"
  | "kanton"
  | "zimmer"
  | "flaeche_m2"
  | "preis_chf"
  | "bruttorendite"
  | "nettorendite"
  | "preis_pro_m2"
>;

/** Eine Zeile der Sicht public.orte, für die Auswahl im Umkreisfilter */
export type Ort = {
  ort: string;
  kanton: string;
  anzahl: number;
  lat: number;
  lon: number;
};

/** Eine Zeile der Funktion public.vergleichsobjekte, mit Distanz in Metern */
export type Vergleichsobjekt = {
  slug: string;
  titel: string;
  ort: string;
  distanz_m: number;
  preis_chf: number;
  preis_pro_m2: number;
  bruttorendite: number;
};
