import { cache } from "react";

import { db } from "@/lib/db";
import { PRO_SEITE, SORTIERUNGEN, type Filter } from "@/lib/filter";
import {
  KARTE_FELDER,
  type Objekt,
  type ObjektKarteDaten,
  type Ort,
  type Vergleichsobjekt,
} from "@/lib/typen";

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

  // Ein gesetzter Umkreis geht über die Datenbankfunktion, weil ST_DWithin
  // sich nicht als Filter der REST-Schnittstelle ausdrücken lässt. Die Funktion
  // liefert setof objekte, deshalb greifen alle übrigen Filter unverändert.
  const umkreisGewaehlt = Boolean(filter.ort && filter.umkreisKm);
  const ort = umkreisGewaehlt ? await holeOrt(filter.ort as string) : null;

  // Einen unbekannten Ort still zu ignorieren waere irreführend: die Liste
  // zeigte dann alle Objekte, obwohl der Chip einen Umkreis nennt. Ein Ort,
  // den es nicht gibt, hat null Treffer.
  if (umkreisGewaehlt && ort === null) {
    return { objekte: [], gesamt: 0, seiten: 1 };
  }

  let abfrage = ort
    ? db
        .rpc(
          "objekte_im_umkreis",
          {
            p_lat: ort.lat,
            p_lon: ort.lon,
            p_radius_m: (filter.umkreisKm as number) * 1000,
          },
          { count: "exact" },
        )
        .select(KARTE_FELDER)
    : db.from("objekte").select(KARTE_FELDER, { count: "exact" });

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
    // bleibt. Ohne das können Objekte zwischen zwei Seiten springen. Der Slug
    // statt der id, weil er eindeutig und in der Auswahl enthalten ist. Die
    // Umkreisabfrage über die Datenbankfunktion kann nur nach ausgewählten
    // Spalten sortieren.
    .order("slug", { ascending: true })
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

/**
 * Holt einen Ort mit seiner Koordinate aus der Sicht public.orte.
 *
 * @param name Ortsname aus der Adresse
 * @returns der Ort, oder null wenn es ihn nicht gibt. Ein unbekannter Ort
 *   führt so zu einer leeren Liste statt zu einem Fehler.
 */
export const holeOrt = cache(async (name: string): Promise<Ort | null> => {
  const { data, error } = await db
    .from("orte")
    .select("ort,kanton,anzahl,lat,lon")
    .eq("ort", name)
    .maybeSingle();

  if (error) {
    throw new Error(`Ortsabfrage fehlgeschlagen: ${error.message}`);
  }
  return (data as Ort | null) ?? null;
});

/**
 * Holt alle Orte mit Objekten, für die Auswahl im Umkreisfilter.
 *
 * @returns Orte nach Namen sortiert
 */
export const holeOrte = cache(async (): Promise<Ort[]> => {
  const { data, error } = await db
    .from("orte")
    .select("ort,kanton,anzahl,lat,lon")
    .order("ort", { ascending: true })
    .limit(1000);

  if (error) {
    throw new Error(`Ortsliste fehlgeschlagen: ${error.message}`);
  }
  return (data ?? []) as Ort[];
});

/**
 * Holt die nächstgelegenen Vergleichsobjekte zu einem Objekt.
 *
 * Die Suche nach dem nächsten Nachbarn läuft in der Datenbank über den
 * GiST-Index, siehe supabase/migrations/20260908010000_standort.sql.
 *
 * @param slug Slug des Ausgangsobjekts
 * @param anzahl wie viele Vergleichsobjekte, standardmässig fünf
 * @returns Vergleichsobjekte mit Distanz in Metern, aufsteigend nach Distanz
 */
export const holeVergleichsobjekte = cache(
  async (slug: string, anzahl = 5): Promise<Vergleichsobjekt[]> => {
    const { data, error } = await db.rpc("vergleichsobjekte", {
      p_slug: slug,
      p_anzahl: anzahl,
    });

    if (error) {
      throw new Error(`Vergleichsobjekte fehlgeschlagen: ${error.message}`);
    }
    return (data ?? []) as Vergleichsobjekt[];
  },
);
