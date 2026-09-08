"""Macht aus rohen Textfeldern geprüfte Werte und erkennt Duplikate.

Rohdaten kommen mit Einheiten, Apostrophen, Kommas und unterschiedlicher
Schreibweise. Hier wird alles auf einen Stand gebracht: Fläche in m² als
Dezimalzahl, Preis in CHF als Ganzzahl, Zimmer mit Punkt, Strasse in einer
Form, aus der sich ein stabiler Dedup-Hash bilden lässt.
"""

import hashlib
import re
import unicodedata
from dataclasses import dataclass
from datetime import UTC, datetime

from generator import RohObjekt
from kennzahlen import NEBENKOSTEN_QUOTE_STANDARD, Kennzahlen, berechne_kennzahlen
from quellen import QUELLE_GENERIERT

# Kürzel, die in Strassennamen vorkommen und auf dieselbe Strasse zeigen
STRASSEN_KUERZEL = {"str.": "strasse", "str ": "strasse ", "-str.": "strasse"}


@dataclass(frozen=True)
class Objekt:
    """Ein geprüftes Objekt, bereit für die Datenbank."""

    dedup_hash: str
    titel: str
    slug: str
    typ: str
    plz: str
    ort: str
    kanton: str
    strasse: str
    flaeche_m2: float
    zimmer: float
    preis_chf: int
    mietertrag_jahr_chf: int
    nebenkosten_quote: float
    kennzahlen: Kennzahlen
    lat: float
    lon: float
    quelle: str
    erfasst_am: datetime


def zahl_aus_text(text: str) -> float:
    """Liest eine Zahl aus einem Text mit Einheit, Währung, Apostroph oder Komma.

    "CHF 620'000" wird 620000.0, "82 m²" wird 82.0, "3,5" wird 3.5.

    Raises:
        ValueError: wenn keine Zahl im Text steckt.
    """
    bereinigt = text.replace("'", "").replace(",", ".")
    treffer = re.search(r"-?\d+(?:\.\d+)?", bereinigt)
    if treffer is None:
        raise ValueError(f"Keine Zahl in {text!r}")
    return float(treffer.group())


def normalisiere_strasse(strasse: str) -> str:
    """Bringt eine Strassenangabe in eine Form, die Schreibvarianten zusammenführt.

    Kleinbuchstaben, Kürzel ausgeschrieben, Akzente entfernt, Leerraum gestrafft.
    Das Ergebnis dient nur dem Hash, gespeichert wird die schöne Schreibweise.
    """
    s = strasse.strip().lower()
    for kurz, lang in STRASSEN_KUERZEL.items():
        s = s.replace(kurz, lang)
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", s)


def schoene_strasse(strasse: str) -> str:
    """Stellt eine lesbare Schreibweise her: Wörter gross, Kürzel ausgeschrieben."""
    s = strasse.strip()
    for kurz, lang in STRASSEN_KUERZEL.items():
        s = s.replace(kurz, lang)
    s = re.sub(r"\s+", " ", s)
    return " ".join(w if w[0].isdigit() else w[0].upper() + w[1:] for w in s.split(" "))


def dedup_hash(plz: str, strasse: str, flaeche_m2: float) -> str:
    """Bildet den Duplikat-Hash aus PLZ, normalisierter Strasse und gerundeter Fläche.

    Die Fläche wird auf ganze m² gerundet, damit "82 m²" und "82.0" gleich sind.
    """
    schluessel = f"{plz}|{normalisiere_strasse(strasse)}|{round(flaeche_m2)}"
    return hashlib.sha256(schluessel.encode()).hexdigest()[:24]


def slug_aus(text: str) -> str:
    """Macht aus einem Titel einen URL-tauglichen Slug ohne Umlaute."""
    s = text.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def normalisiere(roh: RohObjekt, erfasst_am: datetime | None = None) -> Objekt:
    """Wandelt ein Rohobjekt in ein geprüftes Objekt mit Kennzahlen um.

    Args:
        roh: Rohobjekt aus dem Generator oder einer anderen Quelle.
        erfasst_am: Zeitstempel, standardmässig jetzt in UTC.

    Returns:
        Objekt mit Dedup-Hash, Slug und berechneten Kennzahlen.

    Raises:
        ValueError: wenn ein Feld keine Zahl enthält oder eine Kennzahl nicht
            berechenbar ist. Solche Objekte überspringt die Pipeline und zählt sie.
    """
    flaeche = zahl_aus_text(roh.flaeche)
    zimmer = zahl_aus_text(roh.zimmer)
    preis = int(zahl_aus_text(roh.preis))
    mietertrag = int(zahl_aus_text(roh.miete_monat)) * 12
    strasse = schoene_strasse(roh.strasse)
    ort = roh.ort.strip().title() if roh.ort.isupper() else roh.ort.strip()
    kanton = roh.kanton.strip().upper()
    zimmer_text = f"{zimmer:g}"
    titel = (
        f"{roh.typ} in {ort}"
        if roh.typ == "Mehrfamilienhaus"
        else f"{zimmer_text}-Zimmer-{roh.typ} in {ort}"
    )
    hash_ = dedup_hash(roh.plz, strasse, flaeche)
    return Objekt(
        dedup_hash=hash_,
        titel=titel,
        # Hash-Suffix, damit zwei gleiche Titel im selben Ort verschiedene Slugs haben
        slug=f"{slug_aus(titel)}-{hash_[:6]}",
        typ=roh.typ,
        plz=roh.plz.strip(),
        ort=ort,
        kanton=kanton,
        strasse=strasse,
        flaeche_m2=flaeche,
        zimmer=zimmer,
        preis_chf=preis,
        mietertrag_jahr_chf=mietertrag,
        nebenkosten_quote=NEBENKOSTEN_QUOTE_STANDARD,
        kennzahlen=berechne_kennzahlen(preis, mietertrag, flaeche, zimmer),
        lat=roh.lat,
        lon=roh.lon,
        quelle=QUELLE_GENERIERT,
        erfasst_am=erfasst_am or datetime.now(UTC),
    )
