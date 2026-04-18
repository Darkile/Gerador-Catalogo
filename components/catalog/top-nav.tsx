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
    <nav className="flex items-center gap-1 rounded-md border border-neutral-200 bg-white p-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded px-3 py-1.5 text-sm font-medium transition-colors",
            pathname.startsWith(item.href)
              ? "bg-neutral-900 text-neutral-50"
              : "text-neutral-700 hover:bg-neutral-100",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
