import { describe, expect, it } from "vitest";

import { rechne, type Annahmen } from "@/lib/kennzahlen";

// Dieselben Grundfälle wie in pipeline/tests/test_kennzahlen.py. Wer die
// Formel ändert, ändert beide Testdateien.
const beispiel: Annahmen = {
  preisChf: 620_000,
  mietertragJahrChf: 29_800,
  eigenkapitalQuote: 0.2,
  zinssatz: 0.02,
  nebenkostenQuote: 0.25,
  leerstandQuote: 0,
};

describe("rechne, Normalfall", () => {
  it("liefert dieselben Renditen wie die Pipeline", () => {
    const e = rechne(beispiel);
    expect(e.bruttorendite).toBeCloseTo(0.0481, 4);
    expect(e.nettorendite).toBeCloseTo(0.036, 3);
  });

  it("rechnet Eigenkapitalrendite und Cashflow aus Nettoertrag und Zinskosten", () => {
    // Nettoertrag 22'350, Fremdkapital 496'000 zu 2 % = 9'920 Zins
    // Ueberschuss 12'430 pro Jahr, Eigenkapital 124'000
    const e = rechne(beispiel);
    expect(e.eigenkapitalrendite).toBeCloseTo(12_430 / 124_000, 4);
    expect(e.cashflowMonatChf).toBeCloseTo(12_430 / 12, 2);
  });

  it("macht den Cashflow negativ, wenn die Zinsen den Ertrag übersteigen", () => {
    const e = rechne({ ...beispiel, zinssatz: 0.06 });
    expect(e.cashflowMonatChf).toBeLessThan(0);
    expect(e.eigenkapitalrendite).toBeLessThan(0);
  });
});

describe("rechne, Grenzfälle ohne NaN", () => {
  it("Eigenkapital 0 % macht die Eigenkapitalrendite unbestimmt, alles andere bleibt", () => {
    const e = rechne({ ...beispiel, eigenkapitalQuote: 0 });
    expect(e.eigenkapitalrendite).toBeNull();
    expect(e.bruttorendite).toBeCloseTo(0.0481, 4);
    expect(e.cashflowMonatChf).not.toBeNaN();
  });

  it("Eigenkapital 100 % ergibt keine Zinskosten", () => {
    const e = rechne({ ...beispiel, eigenkapitalQuote: 1 });
    expect(e.eigenkapitalrendite).toBeCloseTo(e.nettorendite as number, 6);
    expect(e.cashflowMonatChf).toBeCloseTo((29_800 * 0.75) / 12, 2);
  });

  it("Leerstand 100 % ergibt Rendite 0 und Cashflow gleich minus Zinskosten", () => {
    const e = rechne({ ...beispiel, leerstandQuote: 1 });
    expect(e.bruttorendite).toBe(0);
    expect(e.nettorendite).toBe(0);
    expect(e.cashflowMonatChf).toBeCloseTo(-(496_000 * 0.02) / 12, 2);
  });

  it("Kaufpreis 0 macht alle Kennzahlen unbestimmt statt unendlich", () => {
    const e = rechne({ ...beispiel, preisChf: 0 });
    expect(e).toEqual({
      bruttorendite: null,
      nettorendite: null,
      eigenkapitalrendite: null,
      cashflowMonatChf: null,
    });
  });

  it("Mietertrag 0 ist gültig und ergibt Rendite 0", () => {
    const e = rechne({ ...beispiel, mietertragJahrChf: 0 });
    expect(e.bruttorendite).toBe(0);
    expect(e.cashflowMonatChf).toBeLessThan(0);
  });

  it("liefert nie NaN, auch bei unsinnigen Eingaben", () => {
    const e = rechne({ ...beispiel, preisChf: Number.NaN });
    expect(
      Object.values(e).every((wert) => wert === null || Number.isFinite(wert)),
    ).toBe(true);
  });
});
