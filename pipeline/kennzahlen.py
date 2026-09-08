"""Kennzahlen eines Renditeobjekts.

Dieselben Formeln stehen in web/lib/kennzahlen.ts für den Renditerechner.
Wer hier etwas ändert, ändert dort und in beiden Testdateien mit.

    bruttorendite       = mietertrag_jahr / preis
    nettorendite        = mietertrag_jahr * (1 - nebenkosten_quote) / preis
    preis_pro_m2        = preis / flaeche_m2
    preis_pro_zimmer    = preis / zimmer
    eigenkapitalrendite = (mietertrag_netto - zinskosten) / eigenkapital

Renditen sind Anteile, nicht Prozent: 0.048 bedeutet 4.8 %.
"""

from dataclasses import dataclass

# Anteil des Mietertrags, der als Nebenkosten abgeht, wenn nichts anderes bekannt ist
NEBENKOSTEN_QUOTE_STANDARD = 0.25


@dataclass(frozen=True)
class Kennzahlen:
    """Berechnete Kennzahlen eines Objekts, alle auf vier Nachkommastellen gerundet."""

    bruttorendite: float
    nettorendite: float
    preis_pro_m2: float
    preis_pro_zimmer: float


def berechne_kennzahlen(
    preis_chf: int,
    mietertrag_jahr_chf: int,
    flaeche_m2: float,
    zimmer: float,
    nebenkosten_quote: float = NEBENKOSTEN_QUOTE_STANDARD,
) -> Kennzahlen:
    """Berechnet Brutto- und Nettorendite sowie Preis pro m² und pro Zimmer.

    Args:
        preis_chf: Kaufpreis in CHF, muss grösser als 0 sein.
        mietertrag_jahr_chf: Jahresmiete in CHF.
        flaeche_m2: Wohnfläche in m², muss grösser als 0 sein.
        zimmer: Zimmerzahl, muss grösser als 0 sein.
        nebenkosten_quote: Anteil der Nebenkosten am Mietertrag, zwischen 0 und 1.

    Returns:
        Kennzahlen mit Renditen als Anteil (0.048 für 4.8 %).

    Raises:
        ValueError: bei Preis, Fläche oder Zimmerzahl von 0 oder kleiner. Die
            Pipeline lässt solche Objekte gar nicht erst in die Datenbank,
            deshalb ein Fehler und kein stilles None.
    """
    if preis_chf <= 0 or flaeche_m2 <= 0 or zimmer <= 0:
        raise ValueError("Preis, Fläche und Zimmerzahl müssen grösser als 0 sein")
    if not 0 <= nebenkosten_quote < 1:
        raise ValueError("Nebenkostenquote muss zwischen 0 und 1 liegen")

    brutto = mietertrag_jahr_chf / preis_chf
    netto = mietertrag_jahr_chf * (1 - nebenkosten_quote) / preis_chf
    return Kennzahlen(
        bruttorendite=round(brutto, 4),
        nettorendite=round(netto, 4),
        preis_pro_m2=round(preis_chf / flaeche_m2, 2),
        preis_pro_zimmer=round(preis_chf / zimmer, 2),
    )
