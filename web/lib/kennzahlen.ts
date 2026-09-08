/**
 * Kennzahlen eines Renditeobjekts.
 *
 * Dieselben Formeln stehen in pipeline/kennzahlen.py für die gespeicherten
 * Werte. Wer hier etwas ändert, ändert dort und in beiden Testdateien mit.
 * Der Grund für die Doppelung steht in docs/entscheide/003-kennzahlen-in-der-datenbank.md.
 *
 *     bruttorendite       = mietertrag_jahr / preis
 *     nettorendite        = mietertrag_jahr * (1 - nebenkosten_quote) / preis
 *     preis_pro_m2        = preis / flaeche_m2
 *     preis_pro_zimmer    = preis / zimmer
 *     eigenkapitalrendite = (mietertrag_netto - zinskosten) / eigenkapital
 *
 * Renditen sind Anteile, nicht Prozent: 0.048 bedeutet 4.8 %.
 */

/** Anteil des Mietertrags, der als Nebenkosten abgeht, wenn nichts bekannt ist */
export const NEBENKOSTEN_QUOTE_STANDARD = 0.25;

/** Eingaben des Renditerechners, alle Quoten als Anteil zwischen 0 und 1 */
export type Annahmen = {
  preisChf: number;
  mietertragJahrChf: number;
  eigenkapitalQuote: number;
  zinssatz: number;
  nebenkostenQuote: number;
  leerstandQuote: number;
};

/** Ergebnisse des Renditerechners. null bedeutet nicht berechenbar. */
export type Ergebnis = {
  bruttorendite: number | null;
  nettorendite: number | null;
  eigenkapitalrendite: number | null;
  cashflowMonatChf: number | null;
};

/**
 * Berechnet Brutto- und Nettorendite, Eigenkapitalrendite und Cashflow.
 *
 * Grenzfälle geben null statt NaN zurück, damit die Oberfläche "keine Angabe"
 * zeigen kann: Kaufpreis 0 macht jede Rendite unbestimmt, Eigenkapital 0 macht
 * die Eigenkapitalrendite unbestimmt. Leerstand von 100 Prozent ist gültig und
 * ergibt Rendite 0 und einen negativen Cashflow in Höhe der Zinskosten.
 *
 * @param annahmen Kaufpreis, Mietertrag und die vier Quoten
 * @returns Kennzahlen als Anteil, Cashflow in CHF pro Monat
 */
export function rechne(annahmen: Annahmen): Ergebnis {
  const {
    preisChf,
    mietertragJahrChf,
    eigenkapitalQuote,
    zinssatz,
    nebenkostenQuote,
    leerstandQuote,
  } = annahmen;

  if (!Number.isFinite(preisChf) || preisChf <= 0) {
    return {
      bruttorendite: null,
      nettorendite: null,
      eigenkapitalrendite: null,
      cashflowMonatChf: null,
    };
  }

  // Leerstand mindert den Ertrag, Nebenkosten mindern ihn ein zweites Mal
  const ertragBrutto = mietertragJahrChf * (1 - leerstandQuote);
  const ertragNetto = ertragBrutto * (1 - nebenkostenQuote);

  const eigenkapital = preisChf * eigenkapitalQuote;
  const fremdkapital = preisChf - eigenkapital;
  const zinskosten = fremdkapital * zinssatz;
  const ueberschussJahr = ertragNetto - zinskosten;

  return {
    bruttorendite: ertragBrutto / preisChf,
    nettorendite: ertragNetto / preisChf,
    // Bei vollständiger Eigenfinanzierung ist der Nenner 0 und die Kennzahl unbestimmt
    eigenkapitalrendite:
      eigenkapital > 0 ? ueberschussJahr / eigenkapital : null,
    cashflowMonatChf: ueberschussJahr / 12,
  };
}
