"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/upload", label: "Upload" },
  { href: "/editor", label: "Editor" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 rounded-md border border-neutral-200 bg-white/50 p-0.5 sm:p-1 backdrop-blur-sm">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-sm font-medium transition-all uppercase tracking-wider",
            pathname.startsWith(item.href)
              ? "bg-neutral-900 text-neutral-50 shadow-sm"
              : "text-neutral-700 hover:bg-neutral-100",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
