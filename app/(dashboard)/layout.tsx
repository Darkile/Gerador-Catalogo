import { requireUser } from "@/lib/auth";
import { TopNav } from "@/components/catalog/top-nav";
import { LogoutButton } from "@/components/catalog/logout-button";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="catalog-shell min-h-screen">
      <header className="no-print border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Gregory Paper</p>
            <h1 className="text-lg font-semibold">Gerador de Catálogo</h1>
          </div>
          <div className="flex items-center gap-3">
            <TopNav />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
