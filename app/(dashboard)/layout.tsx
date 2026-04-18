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
      <header className="no-print sticky top-0 z-50 w-full bg-background/60 backdrop-blur-xl transition-all duration-500">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 sm:gap-8 px-3 py-3 lg:px-8 lg:py-8">
          <div className="flex flex-col">
            <p className="text-[7px] sm:text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-0.5">Gregory Paper</p>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif text-[#8A0303] tracking-widest drop-shadow-sm leading-none">GREGORY</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-6">
            <TopNav />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8 lg:py-16">{children}</main>
    </div>
  );
}
