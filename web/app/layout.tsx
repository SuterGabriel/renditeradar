import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import Link from "next/link";

import { SEITEN_NAME, SEITEN_URL } from "@/lib/seite";
import "./globals.css";

/*
 * IBM Plex Sans in zwei Schnitten, wie im Mockup festgelegt. Die Schrift wird
 * auf Modulebene geladen und von Next.js selbst ausgeliefert, deshalb entsteht
 * keine Anfrage an einen fremden Server und kein Schriftflackern.
 */
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SEITEN_URL),
  title: {
    default: `${SEITEN_NAME}, Renditeobjekte mit berechneten Kennzahlen`,
    template: `%s | ${SEITEN_NAME}`,
  },
  description:
    "Renditeobjekte in der Schweiz mit Brutto- und Nettorendite, Preis pro m² und Renditerechner. Arbeitsprobe mit generierten Daten, kein produktives Portal.",
  openGraph: {
    type: "website",
    locale: "de_CH",
    siteName: SEITEN_NAME,
  },
};

/** Rahmen aller Seiten: Kopfzeile mit Wortmarke, Inhalt, Fusszeile. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de-CH" className={`${plexSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-hairline bg-karte">
          <div className="mx-auto max-w-[1200px] px-4 py-4 lg:px-8">
            <Link href="/" className="text-abschnitt font-semibold">
              {SEITEN_NAME}
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 lg:px-8">
          {children}
        </main>

        <footer className="border-t border-hairline bg-karte">
          <div className="mx-auto flex max-w-[1200px] flex-wrap gap-x-6 gap-y-2 px-4 py-4 text-sm text-text-sekundaer lg:px-8">
            <a
              href="https://github.com/SuterGabriel/renditeradar"
              className="text-akzent underline-offset-2 hover:underline"
            >
              Quellcode auf GitHub
            </a>
            <span>Lizenz MIT</span>
            <span>Generierte Daten, keine Anlageberatung</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
