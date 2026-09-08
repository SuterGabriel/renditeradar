import { cache } from "react";

import { db } from "@/lib/db";
import { PRO_SEITE, SORTIERUNGEN, type Filter } from "@/lib/filter";
import { KARTE_FELDER, type Objekt, type ObjektKarteDaten } from "@/lib/typen";

/**
 * Datenbankabfragen der Anwendung.
 *
 * Alle Abfragen laufen serverseitig. Die Filter kommen als geprüfter Filter
 * herein, nicht als Rohtext aus der URL, siehe lib/filter.ts.
 */

/** Ergebnis der Listenabfrage: die Objekte einer Seite und die Gesamtzahl */
export type Listenergebnis = {
  objekte: ObjektKarteDaten[];
  gesamt: number;
  seiten: number;
};

/**
 * Holt eine Seite der gefilterten Liste samt Gesamtzahl.
 *
 * Die Gesamtzahl kommt über `count: "exact"` aus derselben Anfrage, damit für
 * die Trefferzeile und die Seitennavigation keine zweite Abfrage nötig ist.
 * Gefiltert und sortiert wird in der Datenbank, nicht im Browser, weil die
 * Kennzahlen dort als indizierte Spalten liegen.
 *
 * @param filter geprüfter Filterzustand aus der URL
 * @returns Objekte der aktuellen Seite, Gesamtzahl und Seitenzahl
 */
export async function holeListe(filter: Filter): Promise<Listenergebnis> {
  const sortierung = SORTIERUNGEN[filter.sortierung];
  const von = (filter.seite - 1) * PRO_SEITE;

  let abfrage = db.from("objekte").select(KARTE_FELDER, { count: "exact" });

  if (filter.kanton) abfrage = abfrage.eq("kanton", filter.kanton);
  if (filter.typ) abfrage = abfrage.eq("typ", filter.typ);
  if (filter.preisVon !== null)
    abfrage = abfrage.gte("preis_chf", filter.preisVon);
  if (filter.preisBis !== null)
    abfrage = abfrage.lte("preis_chf", filter.preisBis);
  // Die Mindestrendite kommt in Prozent aus der URL, gespeichert ist sie als Anteil
  if (filter.renditeMin !== null) {
    abfrage = abfrage.gte("bruttorendite", filter.renditeMin / 100);
  }

  const { data, count, error } = await abfrage
    .order(sortierung.spalte, { ascending: sortierung.aufsteigend })
    // Zweites Sortierkriterium, damit die Reihenfolge bei gleichen Werten stabil
    // bleibt. Ohne das können Objekte zwischen zwei Seiten springen.
    .order("id", { ascending: true })
    .range(von, von + PRO_SEITE - 1);

  if (error) {
    throw new Error(`Listenabfrage fehlgeschlagen: ${error.message}`);
  }

  const gesamt = count ?? 0;
  return {
    objekte: (data ?? []) as ObjektKarteDaten[],
    gesamt,
    seiten: Math.max(1, Math.ceil(gesamt / PRO_SEITE)),
  };
}

/**
 * Holt ein einzelnes Objekt über seinen Slug.
 *
 * In React.cache eingepackt, damit Seite und generateMetadata sich dieselbe
 * Abfrage teilen. Ohne das würde jede Detailseite zweimal abgefragt.
 *
 * @param slug Slug aus der Route
 * @returns das Objekt, oder null wenn es keines mit diesem Slug gibt
 */
export const holeObjekt = cache(
  async (slug: string): Promise<Objekt | null> => {
    const { data, error } = await db
      .from("objekte")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Objektabfrage fehlgeschlagen: ${error.message}`);
    }
    return (data as Objekt | null) ?? null;
  },
);

/**
 * Holt alle Slugs, für generateStaticParams und die Sitemap.
 *
 * PostgREST liefert standardmässig höchstens 1000 Zeilen. Bei mehr Objekten
 * müsste hier seitenweise gelesen werden, siehe docs/offene-punkte.md.
 *
 * @returns Slug und Erfassungsdatum aller Objekte
 */
export async function holeAlleSlugs(): Promise<
  { slug: string; erfasst_am: string }[]
> {
  const { data, error } = await db
    .from("objekte")
    .select("slug,erfasst_am")
    .order("id", { ascending: true })
    .limit(1000);

  if (error) {
    throw new Error(`Slug-Abfrage fehlgeschlagen: ${error.message}`);
  }
  return data ?? [];
}

/**
 * Holt die Kantone, die tatsächlich Objekte haben, für die Filterauswahl.
 *
 * Eine feste Liste aller 26 Kantone würde Filter anbieten, die kein Ergebnis
 * liefern. Deshalb kommt die Auswahl aus den Daten.
 *
 * @returns Kantonskürzel, alphabetisch
 */
export const holeKantone = cache(async (): Promise<string[]> => {
  const { data, error } = await db.from("objekte").select("kanton").limit(1000);

  if (error) {
    throw new Error(`Kantonsabfrage fehlgeschlagen: ${error.message}`);
  }
  const kantone = new Set(
    (data ?? []).map((zeile) => (zeile as { kanton: string }).kanton),
  );
  return [...kantone].sort();
});
