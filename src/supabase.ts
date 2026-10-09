import { createClient } from "@supabase/supabase-js";

// Valores públicos (la clave publicable está diseñada para ir en el navegador;
// la seguridad la dan las políticas RLS de la base de datos).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://zaxivsggncaimskheukn.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable__XaHD0ZkI6bc9EsBWoCVwQ_a63aM4dj";

// Si la app se abre desde el enlace de "recuperar contraseña", hay que mostrar
// la pantalla para escribir la contraseña nueva.
export const openedFromRecoveryLink = window.location.hash.includes("type=recovery");

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" },
});
