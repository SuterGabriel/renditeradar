import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { KennzahlKachel } from "@/components/KennzahlKachel";
import { Renditerechner } from "@/components/Renditerechner";
import { Vergleichsobjekte } from "@/components/Vergleichsobjekte";
import { holeAlleSlugs, holeObjekt } from "@/lib/abfragen";
import {
  chf,
  datum,
  flaeche,
  prozent,
  zimmer as formatZimmer,
} from "@/lib/format";
import { SEITEN_NAME, SEITEN_URL } from "@/lib/seite";
import type { Objekt } from "@/lib/typen";

/**
 * Detailseite eines Objekts.
 *
 * Statisch erzeugt über generateStaticParams und im Hintergrund erneuert.
 * Inserate ändern sich stündlich, nicht sekündlich, deshalb eine Stunde
 * Gültigkeit statt Rendern bei jedem Aufruf. Begründung in
 * docs/entscheide/001-isr-statt-ssr.md.
 */
export const revalidate = 3600;

/**
 * Ein Slug, der beim Bauen nicht bekannt war, wird beim ersten Aufruf erzeugt
 * und danach mitgeliefert. Damit funktioniert die Seite auch für Objekte, die
 * nach dem Bauen dazugekommen sind.
 */
export const dynamicParams = true;

/**
 * Meldet alle Slugs, damit Next.js die Detailseiten beim Bauen statisch erzeugt.
 * @returns ein Eintrag je Objekt
 */
export async function generateStaticParams() {
  const objekte = await holeAlleSlugs();
  return objekte.map(({ slug }) => ({ slug }));
}

/**
 * Erzeugt Titel, Beschreibung und Open-Graph-Daten je Objekt.
 *
 * Die Abfrage ist dieselbe wie in der Seite und über React.cache geteilt,
 * deshalb entsteht kein zweiter Datenbankzugriff.
 */
export async function generateMetadata({
  params,
}: PageProps<"/objekt/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const objekt = await holeObjekt(slug);

  if (!objekt) {
    return { title: "Objekt nicht gefunden" };
  }

  const beschreibung =
    `${objekt.titel}, ${flaeche(objekt.flaeche_m2)}, ${chf(objekt.preis_chf)}. ` +
    `Bruttorendite ${prozent(objekt.bruttorendite)}, Nettorendite ${prozent(objekt.nettorendite)}, ` +
    `${chf(objekt.preis_pro_m2)} pro m². Generierte Daten, keine Anlageberatung.`;

  return {
    title: objekt.titel,
    description: beschreibung,
    alternates: { canonical: `${SEITEN_URL}/objekt/${objekt.slug}` },
    openGraph: {
      type: "article",
      title: objekt.titel,
      description: beschreibung,
      url: `${SEITEN_URL}/objekt/${objekt.slug}`,
    },
  };
}

export default async function Detailseite({
  params,
}: PageProps<"/objekt/[slug]">) {
  const { slug } = await params;
  const objekt = await holeObjekt(slug);

  if (!objekt) {
    notFound();
  }

  return (
    <article className="flex flex-col gap-6">
      <nav aria-label="Brotkrumen" className="text-sm text-text-sekundaer">
        <Link href="/" className="text-akzent hover:underline">
          {SEITEN_NAME}
        </Link>
        {" › "}
        <Link
          href={`/?kanton=${objekt.kanton}`}
          className="text-akzent hover:underline"
        >
          {objekt.kanton}
        </Link>
        {" › "}
        <span>{objekt.ort}</span>
      </nav>

      <header>
        <h1 className="text-seitentitel font-semibold">{objekt.titel}</h1>
        <p className="mt-1 text-text-sekundaer">
          {objekt.strasse}, {objekt.plz} {objekt.ort}, {objekt.kanton}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <KennzahlKachel bezeichnung="Kaufpreis" wert={chf(objekt.preis_chf)} />
        <KennzahlKachel
          bezeichnung="Mietertrag pro Jahr"
          wert={chf(objekt.mietertrag_jahr_chf)}
        />
        <KennzahlKachel
          bezeichnung="Bruttorendite"
          wert={prozent(objekt.bruttorendite)}
        />
        <KennzahlKachel
          bezeichnung="Nettorendite"
          wert={prozent(objekt.nettorendite)}
        />
        <KennzahlKachel
          bezeichnung="Preis pro m²"
          wert={chf(objekt.preis_pro_m2)}
        />
        <KennzahlKachel
          bezeichnung="Preis pro Zimmer"
          wert={chf(objekt.preis_pro_zimmer)}
        />
      </div>

      <section className="rounded-kante border border-hairline bg-karte p-4">
        <h2 className="text-abschnitt font-semibold">Eckdaten</h2>
        <dl className="mt-2">
          <Eckdatum bezeichnung="Typ" wert={objekt.typ} />
          <Eckdatum bezeichnung="Zimmer" wert={formatZimmer(objekt.zimmer)} />
          <Eckdatum bezeichnung="Fläche" wert={flaeche(objekt.flaeche_m2)} />
          <Eckdatum
            bezeichnung="Nebenkostenquote"
            wert={`${(objekt.nebenkosten_quote * 100).toFixed(0)} %`}
          />
          <Eckdatum bezeichnung="Datenquelle" wert="Generierte Demodaten" />
          <Eckdatum bezeichnung="Erfasst am" wert={datum(objekt.erfasst_am)} />
        </dl>
      </section>

      <Renditerechner
        preisChf={objekt.preis_chf}
        mietertragJahrChf={objekt.mietertrag_jahr_chf}
      />

      <Vergleichsobjekte
        slug={objekt.slug}
        mitte={{ lat: Number(objekt.lat), lon: Number(objekt.lon) }}
        titel={objekt.titel}
      />

      <p className="text-xs text-text-sekundaer">
        Die Kennzahlen dienen der Demonstration und sind keine Anlageberatung.
        Das Objekt ist erfunden, es steht kein reales Inserat dahinter.
      </p>

      <StrukturierteDaten objekt={objekt} />
    </article>
  );
}

/** Eine Zeile der Eckdaten-Tabelle, Bezeichnung links, Wert rechts */
function Eckdatum({
  bezeichnung,
  wert,
}: {
  bezeichnung: string;
  wert: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-hairline py-2 last:border-b-0">
      <dt className="text-text-sekundaer">{bezeichnung}</dt>
      <dd>{wert}</dd>
    </div>
  );
}

/**
 * Strukturierte Daten nach schema.org, damit Suchmaschinen das Objekt als
 * Angebot mit Preis und Fläche verstehen.
 *
 * Der Typ ist Accommodation mit einem Angebot, weil RealEstateListing bei
 * schema.org kein eigener Typ ist. Der Preis steht als Offer, die Fläche als
 * QuantitativeValue in Quadratmetern.
 */
function StrukturierteDaten({ objekt }: { objekt: Objekt }) {
  const objektDaten = {
    "@context": "https://schema.org",
    "@type": "Accommodation",
    name: objekt.titel,
    url: `${SEITEN_URL}/objekt/${objekt.slug}`,
    numberOfRooms: objekt.zimmer,
    floorSize: {
      "@type": "QuantitativeValue",
      value: objekt.flaeche_m2,
      unitCode: "MTK",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: objekt.strasse,
      postalCode: objekt.plz,
      addressLocality: objekt.ort,
      addressRegion: objekt.kanton,
      addressCountry: "CH",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: objekt.lat,
      longitude: objekt.lon,
    },
    offers: {
      "@type": "Offer",
      price: objekt.preis_chf,
      priceCurrency: "CHF",
      availability: "https://schema.org/InStock",
    },
  };

  // Derselbe Pfad, den die Brotkrumen oben zeigen, noch einmal maschinenlesbar
  const brotkrumen = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SEITEN_NAME, item: SEITEN_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: objekt.kanton,
        item: `${SEITEN_URL}/?kanton=${objekt.kanton}`,
      },
      { "@type": "ListItem", position: 3, name: objekt.ort },
    ],
  };

  // Zwei getrennte Blöcke statt eines Graphen: jeder ist für sich gültig, und
  // ein Fehler im einen macht den anderen nicht unbrauchbar.
  return (
    <>
      {[objektDaten, brotkrumen].map((block, index) => (
        <script
          key={index}
          type="application/ld+json"
          // Die Daten stammen aus der eigenen Datenbank und enthalten keine
          // Nutzereingaben. Das Ersetzen der spitzen Klammer verhindert, dass
          // ein Wert das Skript-Element vorzeitig beendet.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(block).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
