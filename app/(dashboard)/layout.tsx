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
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 sm:gap-8 px-4 py-4 lg:px-8 lg:py-8">
          <div>
            <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Gregory Paper</p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-[#8A0303] tracking-widest drop-shadow-sm">GREGORY</h1>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-sm font-medium tracking-wider">
            <TopNav />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8 lg:py-16">{children}</main>
    </div>
  );
}
