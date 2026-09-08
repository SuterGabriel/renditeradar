"""Erzeugt Rohdaten für Objekte, so wie sie aus einer fremden Quelle kämen.

Der Generator liefert absichtlich unsaubere Rohdaten: Preise als Text mit
Apostroph, Flächen mit Einheit, Zimmerzahlen mit Komma, und rund fünf Prozent
Duplikate mit leicht anderer Schreibweise. Die Normalisierung und die
Duplikaterkennung in der Pipeline haben damit etwas zu tun.
"""

import random
from dataclasses import dataclass

from quellen import GEMEINDEN, Gemeinde

# Fester Seed: derselbe Lauf liefert dieselben Objekte, Duplikate eingeschlossen
SEED_STANDARD = 20260908

# Anteil der Objekte, die als Duplikat mit abweichender Schreibweise wiederholt werden
DUPLIKAT_ANTEIL = 0.05

STRASSEN = (
    "Bahnhofstrasse",
    "Hauptstrasse",
    "Dorfstrasse",
    "Kirchweg",
    "Ringstrasse",
    "Aarburgerstrasse",
    "Bergstrasse",
    "Feldweg",
    "Gartenstrasse",
    "Lindenweg",
    "Mühlegasse",
    "Poststrasse",
    "Rosenweg",
    "Schulstrasse",
    "Seestrasse",
    "Sonnhalde",
    "Talstrasse",
    "Weinbergstrasse",
    "Zürcherstrasse",
    "Industriestrasse",
)

# Typ, Gewicht in der Verteilung, Zimmerspanne, m² pro Zimmer, Preisfaktor gegenüber Wohnung
TYPEN = (
    ("Wohnung", 0.65, (1.5, 5.5), (20, 28), 1.00),
    ("Haus", 0.25, (4.5, 7.5), (26, 34), 1.15),
    ("Mehrfamilienhaus", 0.10, (8.0, 20.0), (22, 28), 0.85),
)


@dataclass(frozen=True)
class RohObjekt:
    """Ein Objekt, wie es roh aus einer Quelle käme: alles Text, nichts geprüft."""

    typ: str
    strasse: str
    plz: str
    ort: str
    kanton: str
    flaeche: str
    zimmer: str
    preis: str
    miete_monat: str
    lat: float
    lon: float


def _waehle_typ(zufall: random.Random) -> tuple[str, tuple[float, float], tuple[int, int], float]:
    """Zieht einen Objekttyp nach seiner Gewichtung.

    Returns:
        Typname, Zimmerspanne, m²-pro-Zimmer-Spanne und Preisfaktor.
    """
    gewichte = [t[1] for t in TYPEN]
    typ, _, zimmer, m2_pro_zimmer, faktor = zufall.choices(TYPEN, weights=gewichte)[0]
    return typ, zimmer, m2_pro_zimmer, faktor


def _erzeuge_objekt(zufall: random.Random, gemeinde: Gemeinde) -> RohObjekt:
    """Erzeugt ein plausibles Objekt für eine Gemeinde.

    Preis und Miete hängen am Preisniveau der Gemeinde. Die Bruttorendite
    landet je nach Zufall zwischen etwa 2.5 % in teuren und 6 % in günstigen
    Lagen, was der Grössenordnung in der Schweiz entspricht.
    """
    typ, zimmer_spanne, m2_spanne, faktor = _waehle_typ(zufall)
    zimmer = round(zufall.uniform(*zimmer_spanne) * 2) / 2
    flaeche = round(zimmer * zufall.uniform(*m2_spanne))
    preis_m2 = gemeinde.preis_m2 * faktor * zufall.uniform(0.8, 1.2)
    preis = round(flaeche * preis_m2 / 5000) * 5000
    # Mietrendite sinkt mit dem Preisniveau: teure Lagen rentieren schlechter
    rendite = zufall.uniform(0.028, 0.062) * (8000 / gemeinde.preis_m2) ** 0.35
    miete_monat = round(preis * rendite / 12 / 10) * 10
    # Koordinaten leicht um das Ortszentrum streuen, rund 1 km
    lat = round(gemeinde.lat + zufall.uniform(-0.009, 0.009), 6)
    lon = round(gemeinde.lon + zufall.uniform(-0.013, 0.013), 6)
    return RohObjekt(
        typ=typ,
        strasse=f"{zufall.choice(STRASSEN)} {zufall.randint(1, 120)}",
        plz=gemeinde.plz,
        ort=gemeinde.ort,
        kanton=gemeinde.kanton,
        flaeche=f"{flaeche} m²",
        zimmer=str(zimmer).replace(".", ","),
        preis=f"CHF {preis:,}".replace(",", "'"),
        miete_monat=f"{miete_monat:,}".replace(",", "'"),
        lat=lat,
        lon=lon,
    )


def _verfremde(zufall: random.Random, objekt: RohObjekt) -> RohObjekt:
    """Erzeugt ein Duplikat mit anderer Schreibweise, aber gleichem Objekt.

    Strasse in Kleinbuchstaben oder mit "str." abgekürzt, Fläche ohne Einheit,
    Preis ohne Apostroph. Der Dedup-Hash muss trotzdem gleich bleiben.
    """
    varianten = (
        lambda o: o.strasse.lower(),
        lambda o: o.strasse.replace("strasse", "str."),
        lambda o: f"  {o.strasse}  ",
    )
    return RohObjekt(
        typ=objekt.typ,
        strasse=zufall.choice(varianten)(objekt),
        plz=objekt.plz,
        ort=objekt.ort.upper(),
        kanton=objekt.kanton.lower(),
        flaeche=objekt.flaeche.replace(" m²", ""),
        zimmer=objekt.zimmer.replace(",", "."),
        preis=objekt.preis.replace("'", "").replace("CHF ", ""),
        miete_monat=objekt.miete_monat.replace("'", ""),
        lat=objekt.lat,
        lon=objekt.lon,
    )


def erzeuge_rohdaten(anzahl: int = 400, seed: int = SEED_STANDARD) -> list[RohObjekt]:
    """Erzeugt eine Liste roher Objekte mit eingestreuten Duplikaten.

    Args:
        anzahl: Anzahl eindeutiger Objekte. Dazu kommen rund fünf Prozent Duplikate.
        seed: Startwert des Zufallsgenerators für reproduzierbare Läufe.

    Returns:
        Rohobjekte in zufälliger Reihenfolge, Duplikate irgendwo dazwischen.
    """
    zufall = random.Random(seed)
    objekte = [_erzeuge_objekt(zufall, zufall.choice(GEMEINDEN)) for _ in range(anzahl)]
    duplikate = [
        _verfremde(zufall, o) for o in zufall.sample(objekte, round(anzahl * DUPLIKAT_ANTEIL))
    ]
    alle = objekte + duplikate
    zufall.shuffle(alle)
    return alle
