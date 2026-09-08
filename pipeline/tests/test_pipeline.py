"""Tests für Normalisierung, Duplikaterkennung und Reproduzierbarkeit."""

from generator import RohObjekt, erzeuge_rohdaten
from main import entferne_duplikate, verarbeite
from normalisierung import dedup_hash, normalisiere, slug_aus, zahl_aus_text


def roh(**aenderungen) -> RohObjekt:
    basis = dict(
        typ="Wohnung",
        strasse="Aarburgerstrasse 12",
        plz="4600",
        ort="Olten",
        kanton="SO",
        flaeche="82 m²",
        zimmer="3,5",
        preis="CHF 620'000",
        miete_monat="2'483",
        lat=47.35,
        lon=7.90,
    )
    return RohObjekt(**(basis | aenderungen))


def test_zahl_aus_text_liest_einheiten_und_trennzeichen():
    assert zahl_aus_text("CHF 620'000") == 620_000
    assert zahl_aus_text("82 m²") == 82
    assert zahl_aus_text("3,5") == 3.5
    assert zahl_aus_text("  105  ") == 105


def test_normalisierung_liefert_saubere_werte():
    o = normalisiere(roh())
    assert o.preis_chf == 620_000
    assert o.flaeche_m2 == 82
    assert o.zimmer == 3.5
    assert o.mietertrag_jahr_chf == 2_483 * 12
    assert o.titel == "3.5-Zimmer-Wohnung in Olten"
    assert o.slug.startswith("3-5-zimmer-wohnung-in-olten-")


def test_mehrfamilienhaus_ohne_zimmer_im_titel():
    o = normalisiere(roh(typ="Mehrfamilienhaus", zimmer="12"))
    assert o.titel == "Mehrfamilienhaus in Olten"


def test_dedup_hash_ignoriert_schreibweise():
    a = dedup_hash("4600", "Aarburgerstrasse 12", 82)
    assert dedup_hash("4600", "aarburgerstrasse 12", 82.0) == a
    assert dedup_hash("4600", "Aarburgerstr. 12", 82) == a
    assert dedup_hash("4600", "  Aarburgerstrasse   12 ", 82.4) == a
    assert dedup_hash("4600", "Aarburgerstrasse 14", 82) != a
    assert dedup_hash("4632", "Aarburgerstrasse 12", 82) != a


def test_verfremdete_duplikate_werden_erkannt():
    original = normalisiere(roh())
    variante = normalisiere(
        roh(
            strasse="aarburgerstr. 12",
            ort="OLTEN",
            kanton="so",
            flaeche="82",
            zimmer="3.5",
            preis="620000",
        )
    )
    assert variante.dedup_hash == original.dedup_hash
    assert variante.ort == "Olten"
    assert variante.kanton == "SO"
    eindeutig, duplikate = entferne_duplikate([original, variante])
    assert len(eindeutig) == 1
    assert duplikate == 1


def test_slug_ohne_umlaute_und_sonderzeichen():
    assert slug_aus("4.5-Zimmer-Haus in Zürich") == "4-5-zimmer-haus-in-zuerich"
    assert slug_aus("Mehrfamilienhaus in St. Gallen") == "mehrfamilienhaus-in-st-gallen"


def test_generator_ist_reproduzierbar_und_enthaelt_duplikate():
    a = erzeuge_rohdaten(100, seed=1)
    b = erzeuge_rohdaten(100, seed=1)
    assert a == b
    assert len(a) == 105


def test_verarbeite_entfernt_alle_duplikate():
    objekte, duplikate, verworfen = verarbeite(200, seed=7)
    assert len(objekte) == 200
    assert duplikate == 10
    assert verworfen == 0
    assert len({o.slug for o in objekte}) == 200
    assert all(0.01 < o.kennzahlen.bruttorendite < 0.12 for o in objekte)
