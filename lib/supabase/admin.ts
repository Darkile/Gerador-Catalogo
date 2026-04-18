import { createClient } from "@supabase/supabase-js";
import { env, requireEnv } from "@/lib/env";

export function getSupabaseAdminClient() {
  return createClient(env.supabaseUrl || requireEnv("NEXT_PUBLIC_SUPABASE_URL"), env.supabaseServiceRoleKey || requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
