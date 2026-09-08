"""Schreibt Objekte nach Postgres, idempotent über den Dedup-Hash."""

from collections.abc import Iterable

import psycopg
from psycopg.rows import tuple_row

from normalisierung import Objekt

UPSERT_SQL = """
insert into public.objekte (
  dedup_hash, titel, slug, typ, plz, ort, kanton, strasse,
  flaeche_m2, zimmer, preis_chf, mietertrag_jahr_chf, nebenkosten_quote,
  bruttorendite, nettorendite, preis_pro_m2, preis_pro_zimmer,
  lat, lon, quelle, erfasst_am
) values (
  %(dedup_hash)s, %(titel)s, %(slug)s, %(typ)s, %(plz)s, %(ort)s, %(kanton)s, %(strasse)s,
  %(flaeche_m2)s, %(zimmer)s, %(preis_chf)s, %(mietertrag_jahr_chf)s, %(nebenkosten_quote)s,
  %(bruttorendite)s, %(nettorendite)s, %(preis_pro_m2)s, %(preis_pro_zimmer)s,
  %(lat)s, %(lon)s, %(quelle)s, %(erfasst_am)s
)
on conflict (dedup_hash) do update set
  titel = excluded.titel,
  typ = excluded.typ,
  ort = excluded.ort,
  kanton = excluded.kanton,
  strasse = excluded.strasse,
  flaeche_m2 = excluded.flaeche_m2,
  zimmer = excluded.zimmer,
  preis_chf = excluded.preis_chf,
  mietertrag_jahr_chf = excluded.mietertrag_jahr_chf,
  nebenkosten_quote = excluded.nebenkosten_quote,
  bruttorendite = excluded.bruttorendite,
  nettorendite = excluded.nettorendite,
  preis_pro_m2 = excluded.preis_pro_m2,
  preis_pro_zimmer = excluded.preis_pro_zimmer,
  lat = excluded.lat,
  lon = excluded.lon,
  quelle = excluded.quelle
returning (xmax = 0) as neu
"""


def _als_zeile(objekt: Objekt) -> dict[str, object]:
    """Flacht ein Objekt zu den Parametern des Upsert-Statements ab."""
    k = objekt.kennzahlen
    return {
        "dedup_hash": objekt.dedup_hash,
        "titel": objekt.titel,
        "slug": objekt.slug,
        "typ": objekt.typ,
        "plz": objekt.plz,
        "ort": objekt.ort,
        "kanton": objekt.kanton,
        "strasse": objekt.strasse,
        "flaeche_m2": objekt.flaeche_m2,
        "zimmer": objekt.zimmer,
        "preis_chf": objekt.preis_chf,
        "mietertrag_jahr_chf": objekt.mietertrag_jahr_chf,
        "nebenkosten_quote": objekt.nebenkosten_quote,
        "bruttorendite": k.bruttorendite,
        "nettorendite": k.nettorendite,
        "preis_pro_m2": k.preis_pro_m2,
        "preis_pro_zimmer": k.preis_pro_zimmer,
        "lat": objekt.lat,
        "lon": objekt.lon,
        "quelle": objekt.quelle,
        "erfasst_am": objekt.erfasst_am,
    }


def schreibe_objekte(database_url: str, objekte: Iterable[Objekt]) -> tuple[int, int]:
    """Schreibt Objekte per Upsert in einer Transaktion.

    Der Slug bleibt beim Upsert unverändert, damit bestehende URLs nicht brechen.
    erfasst_am bleibt ebenfalls, es ist das Datum der Ersterfassung.

    Args:
        database_url: Postgres-Verbindungszeichenfolge aus der Umgebung.
        objekte: geprüfte Objekte, Duplikate nach Hash bereits entfernt.

    Returns:
        Anzahl neu eingefügter und Anzahl aktualisierter Zeilen. Die Summe ist
        beim zweiten Lauf gleich, die Zahl der neuen Zeilen ist dann 0.
    """
    neu = aktualisiert = 0
    with psycopg.connect(database_url, row_factory=tuple_row) as verbindung:
        with verbindung.cursor() as cursor:
            for objekt in objekte:
                cursor.execute(UPSERT_SQL, _als_zeile(objekt))
                zeile = cursor.fetchone()
                if zeile is not None and zeile[0]:
                    neu += 1
                else:
                    aktualisiert += 1
        verbindung.commit()
    return neu, aktualisiert


def zaehle_objekte(database_url: str) -> int:
    """Liefert die Zeilenzahl der Tabelle, für den Idempotenz-Nachweis."""
    with psycopg.connect(database_url) as verbindung:
        zeile = verbindung.execute("select count(*) from public.objekte").fetchone()
        return int(zeile[0]) if zeile else 0
