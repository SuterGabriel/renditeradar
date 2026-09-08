import { createClient } from "@supabase/supabase-js";

/**
 * Zugang zur Datenbank, nur lesend.
 *
 * Der Anon-Key darf öffentlich sein, weil RLS auf der Tabelle objekte nur eine
 * Policy für select kennt. Schreibversuche weist die Datenbank ab, siehe
 * supabase/migrations/20260908000100_objekte.sql. Der Client wird einmal auf
 * Modulebene erzeugt, damit nicht bei jedem Aufruf eine neue Instanz entsteht.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY fehlen. Siehe .env.example.",
  );
}

export const db = createClient(url, anonKey, {
  auth: { persistSession: false },
});
