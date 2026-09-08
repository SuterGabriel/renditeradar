import Link from "next/link";

import { OBJEKT_TYPEN } from "@/lib/typen";
import {
  SORTIERUNGEN,
  baueZiel,
  zaehleFilter,
  type Filter,
} from "@/lib/filter";

/**
 * Filter der Listenansicht.
 *
 * Server Component ohne "use client". Die Filter sind ein Formular mit
 * GET-Methode: der Browser baut daraus selbst die URL, ohne JavaScript und ohne
 * React-State. Damit funktioniert die Seite auch ohne aktives JavaScript, und
 * jede Ansicht ist teilbar.
 *
 * Auf Mobil steckt der Block in einem details-Element mit Zähler im Titel, auf
 * Desktop steht er offen in der Seitenspalte. Das entspricht dem Mockup.
 *
 * @param filter aktueller Filterzustand aus der URL
 * @param kantone Kantone, die tatsächlich Objekte haben
 */
export function FilterLeiste({
  filter,
  kantone,
}: {
  filter: Filter;
  kantone: string[];
}) {
  const anzahl = zaehleFilter(filter);

  return (
    <details
      open
      className="group rounded-kante border border-hairline bg-karte lg:open:block"
      // Auf Desktop ist der Block immer offen, das Aufklappen betrifft nur Mobil
    >
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-abschnitt font-semibold lg:cursor-default">
        Filter{anzahl > 0 ? ` (${anzahl})` : ""}
        <span aria-hidden className="text-text-sekundaer lg:hidden">
          ▾
        </span>
      </summary>

      <form
        method="get"
        action="/"
        className="flex flex-col gap-4 border-t border-hairline p-4"
      >
        <Feld beschriftung="Kanton" fuer="kanton">
          <select
            id="kanton"
            name="kanton"
            defaultValue={filter.kanton ?? ""}
            className="min-h-11 w-full rounded-kante border border-feldrand bg-karte px-3"
          >
            <option value="">Alle Kantone</option>
            {kantone.map((kanton) => (
              <option key={kanton} value={kanton}>
                {kanton}
              </option>
            ))}
          </select>
        </Feld>

        <Feld beschriftung="Typ" fuer="typ">
          <select
            id="typ"
            name="typ"
            defaultValue={filter.typ ?? ""}
            className="min-h-11 w-full rounded-kante border border-feldrand bg-karte px-3"
          >
            <option value="">Alle Typen</option>
            {OBJEKT_TYPEN.map((typ) => (
              <option key={typ} value={typ}>
                {typ}
              </option>
            ))}
          </select>
        </Feld>

        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm text-text-sekundaer">
            Preis von / bis in CHF
          </legend>
          <div className="flex gap-2">
            <input
              type="number"
              name="preis_von"
              inputMode="numeric"
              min={0}
              step={10000}
              aria-label="Preis von in CHF"
              placeholder="ab"
              defaultValue={filter.preisVon ?? ""}
              className="min-h-11 w-full rounded-kante border border-feldrand bg-karte px-3"
            />
            <input
              type="number"
              name="preis_bis"
              inputMode="numeric"
              min={0}
              step={10000}
              aria-label="Preis bis in CHF"
              placeholder="bis"
              defaultValue={filter.preisBis ?? ""}
              className="min-h-11 w-full rounded-kante border border-feldrand bg-karte px-3"
            />
          </div>
        </fieldset>

        <Feld beschriftung="Mindestrendite brutto in Prozent" fuer="rendite">
          <input
            id="rendite"
            type="number"
            name="rendite"
            inputMode="decimal"
            min={0}
            max={20}
            step={0.1}
            placeholder="4.0"
            defaultValue={filter.renditeMin ?? ""}
            className="min-h-11 w-full rounded-kante border border-feldrand bg-karte px-3"
          />
        </Feld>

        <Feld beschriftung="Sortierung" fuer="sortierung">
          <select
            id="sortierung"
            name="sortierung"
            defaultValue={filter.sortierung}
            className="min-h-11 w-full rounded-kante border border-feldrand bg-karte px-3"
          >
            {Object.entries(SORTIERUNGEN).map(([schluessel, wert]) => (
              <option key={schluessel} value={schluessel}>
                {wert.titel}
              </option>
            ))}
          </select>
        </Feld>

        <div className="flex gap-2">
          <button
            type="submit"
            className="min-h-11 flex-1 rounded-kante bg-text px-4 font-semibold text-karte"
          >
            Anwenden
          </button>
          {anzahl > 0 ? (
            <Link
              href="/"
              className="flex min-h-11 items-center justify-center rounded-kante border border-feldrand px-4"
            >
              Zurücksetzen
            </Link>
          ) : null}
        </div>
      </form>
    </details>
  );
}

/** Beschriftung und Eingabefeld als Paar, damit der Abstand überall gleich ist */
function Feld({
  beschriftung,
  fuer,
  children,
}: {
  beschriftung: string;
  fuer: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fuer} className="text-sm text-text-sekundaer">
        {beschriftung}
      </label>
      {children}
    </div>
  );
}

/**
 * Die aktiven Filter als entfernbare Chips.
 *
 * Jeder Chip ist ein Link auf dieselbe Liste ohne diesen einen Filter. Deshalb
 * braucht das Entfernen kein JavaScript.
 *
 * @param filter aktueller Filterzustand
 */
export function FilterChips({ filter }: { filter: Filter }) {
  const chips: { schluessel: string; titel: string; ohne: Partial<Filter> }[] =
    [];

  if (filter.kanton) {
    chips.push({
      schluessel: "kanton",
      titel: filter.kanton,
      ohne: { kanton: null },
    });
  }
  if (filter.typ) {
    chips.push({ schluessel: "typ", titel: filter.typ, ohne: { typ: null } });
  }
  if (filter.preisVon !== null) {
    chips.push({
      schluessel: "preis_von",
      titel: `ab CHF ${filter.preisVon.toLocaleString("de-CH")}`,
      ohne: { preisVon: null },
    });
  }
  if (filter.preisBis !== null) {
    chips.push({
      schluessel: "preis_bis",
      titel: `bis CHF ${filter.preisBis.toLocaleString("de-CH")}`,
      ohne: { preisBis: null },
    });
  }
  if (filter.renditeMin !== null) {
    chips.push({
      schluessel: "rendite",
      titel: `ab ${filter.renditeMin.toFixed(1)} %`,
      ohne: { renditeMin: null },
    });
  }

  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <li key={chip.schluessel}>
          <Link
            href={baueZiel(filter, chip.ohne)}
            className="flex min-h-9 items-center gap-2 rounded-kante border border-akzent bg-akzent-tint px-3 text-sm text-akzent"
          >
            {chip.titel}
            <span aria-hidden>×</span>
            <span className="sr-only">Filter entfernen</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
