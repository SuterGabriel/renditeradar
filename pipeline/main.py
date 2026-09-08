"""Einstieg der Pipeline: erzeugen, normalisieren, Duplikate entfernen, speichern.

Aufruf:
    python main.py              schreibt nach Postgres, DATABASE_URL aus .env
    python main.py --trocken    schreibt stattdessen objekte.json ins Verzeichnis
    python main.py --anzahl 50  erzeugt weniger Objekte

Der Lauf ist idempotent: ein zweiter Lauf mit gleichem Seed ändert die
Zeilenzahl in der Datenbank nicht.
"""

import argparse
import json
import os
import sys
from dataclasses import asdict
from pathlib import Path

from dotenv import load_dotenv

from generator import SEED_STANDARD, erzeuge_rohdaten
from normalisierung import Objekt, normalisiere


def entferne_duplikate(objekte: list[Objekt]) -> tuple[list[Objekt], int]:
    """Behält je Dedup-Hash das erste Objekt und zählt die entfernten.

    Returns:
        Eindeutige Objekte in ursprünglicher Reihenfolge und Anzahl Duplikate.
    """
    gesehen: set[str] = set()
    eindeutig: list[Objekt] = []
    for objekt in objekte:
        if objekt.dedup_hash in gesehen:
            continue
        gesehen.add(objekt.dedup_hash)
        eindeutig.append(objekt)
    return eindeutig, len(objekte) - len(eindeutig)


def verarbeite(anzahl: int, seed: int) -> tuple[list[Objekt], int, int]:
    """Führt alle Schritte bis vor das Speichern aus.

    Returns:
        Eindeutige Objekte, Anzahl entfernter Duplikate, Anzahl verworfener
        Rohobjekte, die sich nicht normalisieren liessen.
    """
    verworfen = 0
    normalisiert: list[Objekt] = []
    for roh in erzeuge_rohdaten(anzahl, seed):
        try:
            normalisiert.append(normalisiere(roh))
        except ValueError as fehler:
            verworfen += 1
            print(f"verworfen: {fehler}", file=sys.stderr)
    eindeutig, duplikate = entferne_duplikate(normalisiert)
    return eindeutig, duplikate, verworfen


def schreibe_json(objekte: list[Objekt], ziel: Path) -> None:
    """Schreibt die Objekte als JSON, für den Trockenlauf ohne Datenbank."""
    daten = [asdict(o) | {"erfasst_am": o.erfasst_am.isoformat()} for o in objekte]
    ziel.write_text(json.dumps(daten, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    """Liest Argumente, führt die Pipeline aus und gibt eine Zusammenfassung aus."""
    parser = argparse.ArgumentParser(description="renditeradar Pipeline")
    parser.add_argument("--anzahl", type=int, default=400, help="Anzahl eindeutiger Objekte")
    parser.add_argument("--seed", type=int, default=SEED_STANDARD, help="Zufalls-Seed")
    parser.add_argument("--trocken", action="store_true", help="JSON statt Datenbank")
    args = parser.parse_args()

    objekte, duplikate, verworfen = verarbeite(args.anzahl, args.seed)
    print(f"erzeugt: {len(objekte)} eindeutig, {duplikate} Duplikate, {verworfen} verworfen")

    if args.trocken:
        ziel = Path(__file__).with_name("objekte.json")
        schreibe_json(objekte, ziel)
        print(f"geschrieben: {ziel}")
        return 0

    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL fehlt. Siehe .env.example oder --trocken verwenden.", file=sys.stderr)
        return 1

    from db import schreibe_objekte, zaehle_objekte

    vorher = zaehle_objekte(database_url)
    neu, aktualisiert = schreibe_objekte(database_url, objekte)
    nachher = zaehle_objekte(database_url)
    print(f"datenbank: {neu} neu, {aktualisiert} aktualisiert, Zeilen {vorher} -> {nachher}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
