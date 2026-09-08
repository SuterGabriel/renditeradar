import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Testlauf für die reine Logik in lib/.
 *
 * Getestet werden Filterauswertung, Formatierung und Kennzahlen. Alles davon
 * ist frei von React und Datenbank, deshalb braucht es keine Browserumgebung
 * und keine Testdatenbank.
 */
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
