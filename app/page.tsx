import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const user = await getCurrentUser();

    if (user) {
      redirect("/upload");
    }
  } catch {}

  redirect("/login");
}
