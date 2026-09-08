import { config as ladeUmgebung } from "dotenv";
import type { NextConfig } from "next";

/*
 * Die Umgebungsvariablen liegen in einer einzigen .env im Repo-Stamm, damit
 * Pipeline und Anwendung dieselbe Quelle nutzen. Next.js liest nur im eigenen
 * Verzeichnis, deshalb wird die Datei hier zusätzlich geladen. Auf Vercel
 * existiert sie nicht, dort kommen die Werte aus den Projekteinstellungen, und
 * dieser Aufruf bleibt wirkungslos.
 */
ladeUmgebung({ path: "../.env", quiet: true });

const nextConfig: NextConfig = {
  typedRoutes: true,
};

export default nextConfig;
