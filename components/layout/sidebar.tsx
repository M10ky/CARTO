"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";
import { NAV_ITEMS } from "@/lib/constants/nav";

export function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex h-full w-60 flex-col border-r border-line bg-ink-900",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-line px-4 py-4">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded border border-accent/50 bg-accent/10 font-mono text-xs font-bold text-accent"
        >
          CN
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">
            Cluster CNTO
          </p>
          <p className="truncate font-mono text-[11px] text-text-faint">
            cartographie
          </p>
        </div>
      </div>

      <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto p-3">
        <p className="px-3 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
          Modules
        </p>
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded border-l-2 px-3 py-2 text-sm transition-colors",
                    active
                      ? "border-accent bg-ink-700 text-text"
                      : "border-transparent text-text-dim hover:bg-ink-800 hover:text-text",
                  )}
                >
                  <Icon
                    aria-hidden
                    className={cn(
                      "size-4 shrink-0",
                      active
                        ? "text-accent"
                        : "text-text-faint group-hover:text-text-dim",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                  <span className="ml-auto font-mono text-[10px] text-text-faint">
                    {item.module}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
          État
        </p>
        <p className="mt-1 text-xs text-text-dim">
          Phase 2 — système visuel
        </p>
      </div>
    </div>
  );
}
