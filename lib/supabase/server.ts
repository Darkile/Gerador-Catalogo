import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function getSupabaseServerClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Configuração Supabase ausente no ambiente.");
  }

  const cookieStore = cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        try {
          return cookieStore.getAll();
        } catch {
          return [];
        }
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {}
      },
    },
  });
}
