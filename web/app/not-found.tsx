import Link from "next/link";

/** Seite für eine unbekannte Adresse, etwa einen Slug, den es nicht mehr gibt. */
export default function NichtGefunden() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-kante border border-hairline bg-karte p-8">
      <h1 className="text-seitentitel font-semibold">Seite nicht gefunden</h1>
      <p className="text-text-sekundaer">
        Diese Adresse gibt es nicht. Möglicherweise wurde das Objekt entfernt.
      </p>
      <Link
        href="/"
        className="flex min-h-11 items-center rounded-kante border border-feldrand px-4"
      >
        Zur Objektliste
      </Link>
    </div>
  );
}
