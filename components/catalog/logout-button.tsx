"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => {
        startTransition(async () => {
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.signOut();
          router.push("/login");
          router.refresh();
        });
      }}
      disabled={isPending}
    >
      {isPending ? <Spinner /> : null}
      Sair
    </Button>
  );
}
