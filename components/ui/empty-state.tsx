import { Inbox, LoaderCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded border border-line bg-ink-900">
        <Icon aria-hidden className="size-4 text-text-faint" />
      </span>
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-sm text-xs text-text-dim">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Spinner({
  className,
  label = "Chargement",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-text-dim">
      <LoaderCircle
        aria-hidden
        className={cn("size-4 animate-spin", className)}
      />
      <span className="text-xs">{label}</span>
    </span>
  );
}
