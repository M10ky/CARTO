import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function FilterBar({
  resetHref,
  children,
  className,
}: {
  resetHref: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      method="get"
      className={cn(
        "flex flex-wrap items-end gap-3 rounded border border-line bg-ink-800/60 p-3",
        className,
      )}
    >
      {children}
      <Button type="submit" variant="secondary" size="sm">
        Filtrer
      </Button>
      <Link
        href={resetHref}
        className="inline-flex h-8 items-center rounded px-3 text-xs font-medium text-text-dim transition-colors hover:bg-ink-800 hover:text-text"
      >
        Réinitialiser
      </Link>
    </form>
  );
}

export function FilterField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-40 flex-1 flex-col gap-1", className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-text-dim">
        {label}
      </label>
      {children}
    </div>
  );
}
