"use client";

import { useId, useState } from "react";

import { chf, prozent } from "@/lib/format";
import {
  NEBENKOSTEN_QUOTE_STANDARD,
  rechne,
  type Annahmen,
} from "@/lib/kennzahlen";

/**
 * Interaktiver Renditerechner auf der Detailseite.
 *
 * Die einzige Client Component der Anwendung. Sie muss bei jeder Eingabe neu
 * rechnen, ohne den Server zu fragen, deshalb braucht sie Zustand im Browser.
 * Die Formel liegt in lib/kennzahlen.ts und ist dort getestet. Diese Datei
 * enthält nur Eingabe und Anzeige.
 *
 * Das Ergebnis wird beim Rendern aus dem Zustand abgeleitet, nicht in einem
 * Effekt gespeichert. Es gibt keinen zweiten Zustand, der veralten könnte.
 *
 * @param preisChf Kaufpreis des Objekts als Startwert
 * @param mietertragJahrChf Jahresmiete des Objekts, fest, weil sie aus den Daten stammt
 */
export function Renditerechner({
  preisChf,
  mietertragJahrChf,
}: {
  preisChf: number;
  mietertragJahrChf: number;
}) {
  const [annahmen, setzeAnnahmen] = useState<Annahmen>({
    preisChf,
    mietertragJahrChf,
    eigenkapitalQuote: 0.2,
    zinssatz: 0.02,
    nebenkostenQuote: NEBENKOSTEN_QUOTE_STANDARD,
    leerstandQuote: 0,
  });

  const ergebnis = rechne(annahmen);

  /** Setzt ein einzelnes Feld, damit jede Eingabe dieselbe Funktion nutzt */
  function setze<K extends keyof Annahmen>(feld: K, wert: number) {
    setzeAnnahmen((alt) => ({ ...alt, [feld]: wert }));
  }

  return (
    <section
      aria-labelledby="renditerechner-titel"
      className="rounded-kante border border-hairline bg-karte p-4"
    >
      <h2 id="renditerechner-titel" className="text-abschnitt font-semibold">
        Renditerechner
      </h2>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-4">
          <Eingabe
            beschriftung="Kaufpreis"
            einheit="CHF"
            wert={annahmen.preisChf}
            min={0}
            max={Math.max(preisChf * 2, 100_000)}
            schritt={5_000}
            aufSetzen={(w) => setze("preisChf", w)}
          />
          <Eingabe
            beschriftung="Eigenkapital"
            einheit="%"
            wert={annahmen.eigenkapitalQuote * 100}
            min={0}
            max={100}
            schritt={1}
            aufSetzen={(w) => setze("eigenkapitalQuote", w / 100)}
          />
          <Eingabe
            beschriftung="Zinssatz"
            einheit="%"
            wert={annahmen.zinssatz * 100}
            min={0}
            max={10}
            schritt={0.1}
            aufSetzen={(w) => setze("zinssatz", w / 100)}
          />
          <Eingabe
            beschriftung="Nebenkostenquote"
            einheit="%"
            wert={annahmen.nebenkostenQuote * 100}
            min={0}
            max={60}
            schritt={1}
            aufSetzen={(w) => setze("nebenkostenQuote", w / 100)}
          />
          <Eingabe
            beschriftung="Leerstand"
            einheit="%"
            wert={annahmen.leerstandQuote * 100}
            min={0}
            max={100}
            schritt={1}
            aufSetzen={(w) => setze("leerstandQuote", w / 100)}
          />
        </div>

        {/* aria-live, damit Screenreader die neuen Werte nach einer Eingabe vorlesen */}
        <dl
          aria-live="polite"
          className="self-start border-t border-hairline lg:border-t-0 lg:border-l lg:pl-6"
        >
          <p className="pt-3 text-xs text-text-sekundaer lg:pt-0">
            Bei Ihren Annahmen
          </p>
          <Ergebniszeile
            bezeichnung="Bruttorendite"
            wert={anteil(ergebnis.bruttorendite)}
          />
          <Ergebniszeile
            bezeichnung="Nettorendite"
            wert={anteil(ergebnis.nettorendite)}
          />
          <Ergebniszeile
            bezeichnung="Eigenkapitalrendite"
            wert={anteil(ergebnis.eigenkapitalrendite)}
          />
          <Ergebniszeile
            bezeichnung="Cashflow pro Monat"
            wert={
              ergebnis.cashflowMonatChf === null
                ? "keine Angabe"
                : chf(ergebnis.cashflowMonatChf, true)
            }
            richtung={
              ergebnis.cashflowMonatChf === null
                ? undefined
                : ergebnis.cashflowMonatChf < 0
                  ? "negativ"
                  : "positiv"
            }
          />
        </dl>
      </div>

      <p className="mt-4 text-xs text-text-sekundaer">
        Die Berechnung dient der Demonstration und ist keine Anlageberatung.
      </p>
    </section>
  );
}

/** Formatiert einen Anteil oder zeigt "keine Angabe", wenn er nicht berechenbar ist */
function anteil(wert: number | null): string {
  return wert === null ? "keine Angabe" : prozent(wert);
}

/**
 * Ein Eingabefeld aus Schieberegler und Zahlenfeld, beide an denselben Wert
 * gebunden. Der Regler ist für schnelles Ausprobieren, das Feld für genaue
 * Werte. Beide sind per Tastatur bedienbar, der Regler mit den Pfeiltasten.
 */
function Eingabe({
  beschriftung,
  einheit,
  wert,
  min,
  max,
  schritt,
  aufSetzen,
}: {
  beschriftung: string;
  einheit: string;
  wert: number;
  min: number;
  max: number;
  schritt: number;
  aufSetzen: (wert: number) => void;
}) {
  const id = useId();

  /** Liest die Eingabe als Zahl. Leeres oder unlesbares Feld ergibt 0, nie NaN. */
  function lese(text: string) {
    const zahl = Number(text);
    aufSetzen(Number.isFinite(zahl) ? Math.max(0, zahl) : 0);
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`${id}-zahl`} className="text-sm text-text-sekundaer">
        {beschriftung}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          aria-label={`${beschriftung} als Regler`}
          min={min}
          max={max}
          step={schritt}
          value={Math.min(wert, max)}
          onChange={(e) => lese(e.target.value)}
          className="min-h-11 flex-1 accent-akzent"
        />
        <div className="flex min-h-11 w-36 items-center rounded-kante border border-feldrand bg-karte px-3">
          <input
            id={`${id}-zahl`}
            type="number"
            inputMode="decimal"
            min={0}
            step={schritt}
            value={Number.isInteger(wert) ? wert : Number(wert.toFixed(2))}
            onChange={(e) => lese(e.target.value)}
            className="w-full min-w-0 bg-transparent text-right outline-none"
          />
          <span className="pl-2 text-sm text-text-sekundaer">{einheit}</span>
        </div>
      </div>
    </div>
  );
}

/** Eine Ergebniszeile, Bezeichnung links, Wert rechts, Farbe nach Richtung */
function Ergebniszeile({
  bezeichnung,
  wert,
  richtung,
}: {
  bezeichnung: string;
  wert: string;
  richtung?: "positiv" | "negativ";
}) {
  const farbe =
    richtung === "positiv"
      ? "text-positiv"
      : richtung === "negativ"
        ? "text-negativ"
        : "text-akzent";
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-hairline py-2 last:border-b-0">
      <dt className="text-sm">{bezeichnung}</dt>
      <dd className={`font-semibold ${farbe}`}>{wert}</dd>
    </div>
  );
}
