import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function requireUser() {
  if (!hasSupabaseConfig()) {
    redirect("/login");
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  return data.user;
}

export async function getCurrentUser() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
