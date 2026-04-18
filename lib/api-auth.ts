import { getSupabaseServerClient } from "@/lib/supabase/server";

export class UnauthorizedApiError extends Error {
  constructor(message = "Não autenticado") {
    super(message);
    this.name = "UnauthorizedApiError";
  }
}

export async function requireApiUser() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new UnauthorizedApiError();
  }

  return data.user;
}
