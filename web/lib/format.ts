/**
 * Formatierung nach Schweizer Schreibweise.
 *
 * Tausendertrennung mit Apostroph, Währung als CHF vorangestellt, Renditen mit
 * einer Nachkommastelle. Die Regeln stehen im Skill projektdoku und gelten für
 * Oberfläche und Dokumentation gleichermassen.
 */

// Schweizerdeutsches Gebietsschema trennt Tausender mit einem Apostroph
const ZAHL = new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 });

/**
 * Formatiert einen Betrag als CHF mit Apostroph-Trennung, ohne Nachkommastellen.
 * @param betrag Betrag in CHF
 * @param mitVorzeichen true zeigt bei positiven Beträgen ein Plus, für den Cashflow
 * @returns zum Beispiel "CHF 620'000" oder "+CHF 1'035"
 */
export function chf(betrag: number, mitVorzeichen = false): string {
  const gerundet = Math.round(betrag);
  const zahl = ZAHL.format(Math.abs(gerundet));
  if (!mitVorzeichen) {
    return `CHF ${ZAHL.format(gerundet)}`;
  }
  // Minuszeichen statt Bindestrich, und das Vorzeichen vor der Währung
  const zeichen = gerundet < 0 ? "−" : "+";
  return `${zeichen}CHF ${zahl}`;
}

/**
 * Formatiert einen Anteil als Prozentwert mit einer Nachkommastelle.
 * @param anteil Anteil, 0.048 ergibt "4.8 %"
 * @returns Prozentwert mit Dezimalpunkt und geschütztem Abstand vor dem Zeichen
 */
export function prozent(anteil: number): string {
  return `${(anteil * 100).toFixed(1)} %`;
}

/**
 * Formatiert eine Zimmerzahl mit Dezimalpunkt und ohne unnötige Null.
 * @param zimmer Zimmerzahl, 3.5 oder 4
 * @returns "3.5" oder "4"
 */
export function zimmer(zimmer: number): string {
  return String(zimmer).replace(/\.0$/, "");
}

/**
 * Formatiert eine Fläche in Quadratmetern.
 * @param quadratmeter Fläche
 * @returns zum Beispiel "82 m²"
 */
export function flaeche(quadratmeter: number): string {
  return `${ZAHL.format(quadratmeter)} m²`;
}

/**
 * Formatiert ein Datum ausgeschrieben auf Deutsch.
 * @param wert ISO-Zeitstempel aus der Datenbank
 * @returns zum Beispiel "8. September 2026"
 */
export function datum(wert: string): string {
  return new Intl.DateTimeFormat("de-CH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Zurich",
  }).format(new Date(wert));
}
