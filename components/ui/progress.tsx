import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-neutral-200", className)}>
      <div
        className="h-full bg-neutral-900 transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
