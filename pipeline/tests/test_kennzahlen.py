"""Tests der Kennzahlen. Dieselben Fälle stehen in web/lib/kennzahlen.test.ts."""

import pytest

from kennzahlen import berechne_kennzahlen


def test_beispiel_aus_dem_mockup():
    k = berechne_kennzahlen(620_000, 29_800, 82, 3.5)
    assert k.bruttorendite == pytest.approx(0.0481, abs=1e-4)
    assert k.nettorendite == pytest.approx(0.0360, abs=1e-4)
    assert k.preis_pro_m2 == pytest.approx(7560.98, abs=0.01)
    assert k.preis_pro_zimmer == pytest.approx(177_142.86, abs=0.01)


def test_nebenkostenquote_null_macht_netto_gleich_brutto():
    k = berechne_kennzahlen(500_000, 20_000, 80, 3.5, nebenkosten_quote=0)
    assert k.nettorendite == k.bruttorendite


def test_mietertrag_null_gibt_rendite_null():
    k = berechne_kennzahlen(500_000, 0, 80, 3.5)
    assert k.bruttorendite == 0
    assert k.nettorendite == 0


@pytest.mark.parametrize(
    "preis, flaeche, zimmer", [(0, 80, 3.5), (500_000, 0, 3.5), (500_000, 80, 0)]
)
def test_null_werte_werfen_fehler(preis, flaeche, zimmer):
    with pytest.raises(ValueError):
        berechne_kennzahlen(preis, 20_000, flaeche, zimmer)


def test_nebenkostenquote_ausserhalb_wirft_fehler():
    with pytest.raises(ValueError):
        berechne_kennzahlen(500_000, 20_000, 80, 3.5, nebenkosten_quote=1.0)
