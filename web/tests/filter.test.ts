import { describe, expect, it } from "vitest";

import { baueZiel, leseFilter, zaehleFilter, type Filter } from "@/lib/filter";

/** Filter ohne gesetzte Werte, als Ausgangspunkt für die einzelnen Fälle */
const leer: Filter = {
  kanton: null,
  ort: null,
  umkreisKm: null,
  typ: null,
  preisVon: null,
  preisBis: null,
  renditeMin: null,
  sortierung: "rendite",
  seite: 1,
};

describe("leseFilter", () => {
  it("liest die Vorgabewerte aus leeren Suchparametern", () => {
    expect(leseFilter({})).toEqual(leer);
  });

  it("liest gesetzte Filter aus der Adresse", () => {
    expect(
      leseFilter({
        kanton: "so",
        typ: "Wohnung",
        preis_von: "300000",
        preis_bis: "1200000",
        rendite: "4.0",
        sortierung: "preis",
        seite: "3",
      }),
    ).toEqual({
      kanton: "SO",
      ort: null,
      umkreisKm: null,
      typ: "Wohnung",
      preisVon: 300000,
      preisBis: 1200000,
      renditeMin: 4,
      sortierung: "preis",
      seite: 3,
    });
  });

  it("verwirft einen Kanton, der nicht aus zwei Buchstaben besteht", () => {
    expect(leseFilter({ kanton: "Solothurn" }).kanton).toBeNull();
    expect(leseFilter({ kanton: "S" }).kanton).toBeNull();
    expect(leseFilter({ kanton: "12" }).kanton).toBeNull();
  });

  it("verwirft einen unbekannten Typ statt ihn weiterzureichen", () => {
    expect(leseFilter({ typ: "Schloss" }).typ).toBeNull();
    expect(leseFilter({ typ: "wohnung" }).typ).toBeNull();
  });

  it("fällt bei unbekannter Sortierung auf Rendite zurück", () => {
    expect(leseFilter({ sortierung: "irgendwas" }).sortierung).toBe("rendite");
  });

  it("nimmt bei mehrfach gesetztem Parameter den ersten Wert", () => {
    expect(leseFilter({ kanton: ["SO", "ZH"] }).kanton).toBe("SO");
  });

  it("verwirft negative und unlesbare Zahlen", () => {
    expect(leseFilter({ preis_von: "-5000" }).preisVon).toBeNull();
    expect(leseFilter({ preis_von: "abc" }).preisVon).toBeNull();
    expect(leseFilter({ seite: "0" }).seite).toBe(1);
    expect(leseFilter({ seite: "-2" }).seite).toBe(1);
  });

  it("liest Ort und Umkreis, wenn der Radius angeboten wird", () => {
    const f = leseFilter({ ort: "Olten", umkreis: "10" });
    expect(f.ort).toBe("Olten");
    expect(f.umkreisKm).toBe(10);
  });

  it("verwirft einen Radius, den es nicht gibt", () => {
    expect(leseFilter({ ort: "Olten", umkreis: "7" }).umkreisKm).toBeNull();
  });

  it("schneidet eine gebrochene Seitenzahl auf eine ganze ab", () => {
    expect(leseFilter({ seite: "2.7" }).seite).toBe(2);
  });
});

describe("baueZiel", () => {
  it("lässt Vorgabewerte weg, damit die Adresse kurz bleibt", () => {
    expect(baueZiel(leer)).toEqual({ pathname: "/", query: {} });
  });

  it("setzt nur die gesetzten Filter", () => {
    const ziel = baueZiel({ ...leer, kanton: "SO", renditeMin: 4 });
    expect(ziel.query).toEqual({ kanton: "SO", rendite: "4" });
  });

  it("springt bei einer Filteränderung zurück auf Seite 1", () => {
    const ziel = baueZiel({ ...leer, kanton: "SO", seite: 5 }, { typ: "Haus" });
    expect(ziel.query.seite).toBeUndefined();
    expect(ziel.query.typ).toBe("Haus");
  });

  it("behält die Filter beim Blättern", () => {
    const ziel = baueZiel(
      { ...leer, kanton: "SO", typ: "Wohnung" },
      { seite: 3 },
    );
    expect(ziel.query).toEqual({ kanton: "SO", typ: "Wohnung", seite: "3" });
  });

  it("entfernt einen einzelnen Filter und behält die übrigen", () => {
    const ziel = baueZiel(
      { ...leer, kanton: "SO", typ: "Wohnung" },
      { typ: null },
    );
    expect(ziel.query).toEqual({ kanton: "SO" });
  });

  it("lässt einen Umkreis ohne Ort weg, weil ihm der Bezugspunkt fehlt", () => {
    const ziel = baueZiel({ ...leer, umkreisKm: 10 });
    expect(ziel.query.umkreis).toBeUndefined();
  });

  it("setzt Ort und Umkreis gemeinsam", () => {
    const ziel = baueZiel({ ...leer, ort: "Olten", umkreisKm: 10 });
    expect(ziel.query).toEqual({ ort: "Olten", umkreis: "10" });
  });

  it("entfernt mit dem Ort auch den Umkreis", () => {
    const ziel = baueZiel(
      { ...leer, ort: "Olten", umkreisKm: 10, kanton: "SO" },
      { ort: null, umkreisKm: null },
    );
    expect(ziel.query).toEqual({ kanton: "SO" });
  });

  it("ergibt aus gelesenem und wieder gebautem Filter dieselbe Adresse", () => {
    const parameter = {
      kanton: "SO",
      typ: "Wohnung",
      rendite: "4",
      seite: "2",
    };
    const ziel = baueZiel(leseFilter(parameter), { seite: 2 });
    expect(ziel.query).toEqual(parameter);
  });
});

describe("zaehleFilter", () => {
  it("zählt Sortierung und Seite nicht mit", () => {
    expect(zaehleFilter({ ...leer, sortierung: "preis", seite: 4 })).toBe(0);
  });

  it("zählt jeden gesetzten Filter einzeln", () => {
    expect(
      zaehleFilter({ ...leer, kanton: "SO", typ: "Wohnung", renditeMin: 4 }),
    ).toBe(3);
  });
});
