"""Datenherkunft der Pipeline.

Die Objekte werden generiert, nicht von Immobilienportalen gelesen. Echt sind
nur die Gemeinden mit PLZ, Kanton, Koordinaten und einem groben Preisniveau
pro m². Alles Übrige (Strasse, Fläche, Preis, Miete) ist Zufall mit festem
Seed, damit jeder Lauf dieselben Objekte liefert.

Preisniveaus sind Grössenordnungen für Eigentumswohnungen im Jahr 2026 und
dienen nur der Plausibilität. Sie sind keine Marktdaten.
"""

from dataclasses import dataclass

# Bezeichnung, die in der Spalte quelle jedes Objekts steht
QUELLE_GENERIERT = "generiert-v1"


@dataclass(frozen=True)
class Gemeinde:
    """Eine Schweizer Gemeinde mit Lage und Preisniveau.

    Attributes:
        plz: Postleitzahl als Text, weil führende Nullen nicht vorkommen,
            aber PLZ keine Zahl im Sinn von Rechnen ist.
        ort: Gemeindename.
        kanton: Zweibuchstabiges Kantonskürzel.
        lat: Breitengrad des Ortszentrums.
        lon: Längengrad des Ortszentrums.
        preis_m2: Grobes Preisniveau in CHF pro m² für Wohneigentum.
    """

    plz: str
    ort: str
    kanton: str
    lat: float
    lon: float
    preis_m2: int


GEMEINDEN: tuple[Gemeinde, ...] = (
    # Solothurn und Umgebung Olten, Schwerpunkt für die Umkreissuche in M5
    Gemeinde("4600", "Olten", "SO", 47.3500, 7.9037, 7200),
    Gemeinde("4632", "Trimbach", "SO", 47.3647, 7.8873, 6000),
    Gemeinde("4658", "Däniken", "SO", 47.3560, 7.9860, 6100),
    Gemeinde("4653", "Obergösgen", "SO", 47.3660, 7.9540, 5900),
    Gemeinde("4665", "Oftringen", "AG", 47.3140, 7.9250, 6300),
    Gemeinde("4663", "Aarburg", "AG", 47.3200, 7.9010, 6500),
    Gemeinde("4800", "Zofingen", "AG", 47.2880, 7.9450, 6600),
    Gemeinde("4500", "Solothurn", "SO", 47.2088, 7.5372, 7600),
    Gemeinde("4562", "Biberist", "SO", 47.1810, 7.5620, 6300),
    Gemeinde("4528", "Zuchwil", "SO", 47.2010, 7.5660, 5900),
    Gemeinde("2540", "Grenchen", "SO", 47.1920, 7.3960, 5300),
    Gemeinde("4710", "Balsthal", "SO", 47.3150, 7.6930, 5600),
    Gemeinde("4900", "Langenthal", "BE", 47.2150, 7.7890, 6400),
    # Aargau
    Gemeinde("5000", "Aarau", "AG", 47.3925, 8.0442, 8200),
    Gemeinde("5400", "Baden", "AG", 47.4730, 8.3060, 9400),
    Gemeinde("5200", "Brugg", "AG", 47.4830, 8.2090, 7300),
    Gemeinde("5600", "Lenzburg", "AG", 47.3880, 8.1750, 7900),
    Gemeinde("4310", "Rheinfelden", "AG", 47.5540, 7.7940, 7500),
    Gemeinde("5610", "Wohlen", "AG", 47.3510, 8.2760, 7400),
    # Zürich
    Gemeinde("8001", "Zürich", "ZH", 47.3769, 8.5417, 15500),
    Gemeinde("8400", "Winterthur", "ZH", 47.4990, 8.7240, 9800),
    Gemeinde("8600", "Dübendorf", "ZH", 47.3970, 8.6180, 10800),
    Gemeinde("8610", "Uster", "ZH", 47.3470, 8.7210, 9600),
    Gemeinde("8620", "Wetzikon", "ZH", 47.3260, 8.7980, 8900),
    Gemeinde("8800", "Thalwil", "ZH", 47.2920, 8.5640, 13800),
    Gemeinde("8180", "Bülach", "ZH", 47.5190, 8.5400, 9300),
    Gemeinde("8953", "Dietikon", "ZH", 47.4020, 8.4000, 9900),
    # Bern
    Gemeinde("3000", "Bern", "BE", 46.9480, 7.4474, 10200),
    Gemeinde("3600", "Thun", "BE", 46.7580, 7.6280, 8400),
    Gemeinde("2500", "Biel", "BE", 47.1370, 7.2470, 6200),
    Gemeinde("3400", "Burgdorf", "BE", 47.0590, 7.6260, 6900),
    Gemeinde("3800", "Interlaken", "BE", 46.6863, 7.8632, 8700),
    Gemeinde("3072", "Ostermundigen", "BE", 46.9560, 7.4900, 8300),
    # Basel
    Gemeinde("4051", "Basel", "BS", 47.5596, 7.5886, 10900),
    Gemeinde("4410", "Liestal", "BL", 47.4840, 7.7350, 7600),
    Gemeinde("4142", "Münchenstein", "BL", 47.5180, 7.6160, 8500),
    Gemeinde("4153", "Reinach", "BL", 47.4930, 7.5930, 9100),
    Gemeinde("4133", "Pratteln", "BL", 47.5210, 7.6930, 7400),
    # Luzern und Zentralschweiz
    Gemeinde("6003", "Luzern", "LU", 47.0502, 8.3093, 11200),
    Gemeinde("6020", "Emmenbrücke", "LU", 47.0790, 8.2760, 8100),
    Gemeinde("6210", "Sursee", "LU", 47.1710, 8.1110, 7800),
    Gemeinde("6300", "Zug", "ZG", 47.1662, 8.5155, 16800),
    Gemeinde("6330", "Cham", "ZG", 47.1820, 8.4630, 14200),
    Gemeinde("6460", "Altdorf", "UR", 46.8800, 8.6440, 7000),
    # Ostschweiz
    Gemeinde("9000", "St. Gallen", "SG", 47.4245, 9.3767, 8100),
    Gemeinde("8640", "Rapperswil-Jona", "SG", 47.2270, 8.8180, 11400),
    Gemeinde("9500", "Wil", "SG", 47.4620, 9.0450, 7300),
    Gemeinde("8200", "Schaffhausen", "SH", 47.6970, 8.6340, 7700),
    Gemeinde("8500", "Frauenfeld", "TG", 47.5560, 8.8990, 7600),
    Gemeinde("8280", "Kreuzlingen", "TG", 47.6470, 9.1750, 7900),
    Gemeinde("7000", "Chur", "GR", 46.8500, 9.5320, 8300),
    # Westschweiz
    Gemeinde("1003", "Lausanne", "VD", 46.5197, 6.6323, 12600),
    Gemeinde("1400", "Yverdon-les-Bains", "VD", 46.7785, 6.6412, 7400),
    Gemeinde("1800", "Vevey", "VD", 46.4630, 6.8430, 10800),
    Gemeinde("1201", "Genf", "GE", 46.2044, 6.1432, 15200),
    Gemeinde("1700", "Freiburg", "FR", 46.8065, 7.1620, 7900),
    Gemeinde("2000", "Neuenburg", "NE", 46.9900, 6.9290, 6900),
    Gemeinde("1950", "Sitten", "VS", 46.2330, 7.3600, 7200),
    Gemeinde("3900", "Brig", "VS", 46.3160, 7.9880, 6600),
    # Tessin
    Gemeinde("6900", "Lugano", "TI", 46.0037, 8.9511, 9700),
    Gemeinde("6500", "Bellinzona", "TI", 46.1950, 9.0290, 6800),
    Gemeinde("6600", "Locarno", "TI", 46.1700, 8.7990, 8600),
)
