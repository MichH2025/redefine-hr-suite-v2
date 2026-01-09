
import { createClient } from '@supabase/supabase-js';

/**
 * Wir nutzen import.meta.env (Vite-Standard).
 * Falls das Projekt lokal mit Vite läuft, werden diese Variablen aus der .env.local geladen.
 * In dieser Preview-Umgebung verhindern wir durch Fallbacks einen Absturz.
 */
// Fix: Cast import.meta to any to resolve TS error for .env property
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "REDEFINE Suite: Supabase-Konfiguration unvollständig. " +
    "Bitte stellen Sie sicher, dass VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY gesetzt sind."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
