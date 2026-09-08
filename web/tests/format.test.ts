import { describe, expect, it } from "vitest";

import { chf, flaeche, prozent, zimmer } from "@/lib/format";

describe("chf", () => {
  it("trennt Tausender mit Apostroph", () => {
    expect(chf(620000)).toBe("CHF 620'000");
    expect(chf(1200000)).toBe("CHF 1'200'000");
    expect(chf(950)).toBe("CHF 950");
  });

  it("rundet auf ganze Franken", () => {
    expect(chf(7560.98)).toBe("CHF 7'561");
  });

  it("zeigt auf Wunsch ein Vorzeichen, für den Cashflow", () => {
    expect(chf(1035, true)).toBe("+CHF 1'035");
    expect(chf(-410, true)).toBe("−CHF 410");
  });
});

// Vor Prozentzeichen und Einheit steht ein geschütztes Leerzeichen (U+00A0),
// damit die Einheit nicht auf die nächste Zeile umbricht. Im Test steht es als
// Escape, sonst wäre der Unterschied zum normalen Leerzeichen unsichtbar.
const NBSP = "\u00a0";

describe("prozent", () => {
  it("rechnet den Anteil in Prozent mit einer Nachkommastelle", () => {
    expect(prozent(0.048)).toBe(`4.8${NBSP}%`);
    expect(prozent(0.0361)).toBe(`3.6${NBSP}%`);
    expect(prozent(0)).toBe(`0.0${NBSP}%`);
  });
});

describe("zimmer und flaeche", () => {
  it("schreibt Zimmerzahlen mit Punkt und ohne unnötige Null", () => {
    expect(zimmer(3.5)).toBe("3.5");
    expect(zimmer(4)).toBe("4");
  });

  it("haengt die Einheit an die Flaeche", () => {
    expect(flaeche(82)).toBe(`82${NBSP}m²`);
    expect(flaeche(105)).toBe(`105${NBSP}m²`);
  });
});
