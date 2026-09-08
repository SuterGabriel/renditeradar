/**
 * Eine Kennzahl-Kachel auf der Detailseite.
 *
 * Server Component. Die Bezeichnung steht klein über dem Wert, der Wert gross
 * in der Akzentfarbe. Bei Werten mit Richtung, etwa dem Cashflow, trägt der
 * Wert zusätzlich ein Vorzeichen, damit die Information nicht nur an der Farbe
 * hängt und auch ohne Farbwahrnehmung lesbar bleibt.
 *
 * @param bezeichnung Name der Kennzahl, zum Beispiel "Bruttorendite"
 * @param wert bereits formatierter Wert, zum Beispiel "4.8 %"
 * @param richtung färbt den Wert grün oder rot. Ohne Angabe die Akzentfarbe.
 */
export function KennzahlKachel({
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
    <div className="rounded-kante border border-hairline bg-karte p-4">
      <p className="text-xs text-text-sekundaer">{bezeichnung}</p>
      <p
        className={`mt-1 text-kennzahl-mobil font-semibold sm:text-kennzahl ${farbe}`}
      >
        {wert}
      </p>
    </div>
  );
}
