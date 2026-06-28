import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variáveis de ambiente ausentes: configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel (Settings → Environment Variables).",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
