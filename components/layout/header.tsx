"use client";

import { Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { findNavItem } from "@/lib/constants/nav";
import type { AppUser } from "@/lib/auth/session";

const roleLabels: Record<AppUser["role"], string> = {
  ADMIN: "Administrateur",
  MANAGER: "Gestionnaire",
  VIEWER: "Consultation",
};

function initials(name: string): string {
  return name
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Header({
  user,
  onOpenMenu,
}: {
  user: AppUser;
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();
  const current = findNavItem(pathname);
  const displayName = user.fullName ?? user.email ?? "Utilisateur";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-ink-950/85 px-4 backdrop-blur">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Ouvrir la navigation"
        className="flex size-9 items-center justify-center rounded border border-line text-text-dim hover:bg-ink-800 hover:text-text lg:hidden"
      >
        <Menu aria-hidden className="size-4" />
      </button>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text">
          {current?.label ?? "Cartographie"}
        </p>
        <p className="hidden truncate text-xs text-text-faint sm:block">
          {current?.description ?? "Cluster CNTO"}
        </p>
      </div>

      <div className="relative ml-auto hidden w-full max-w-xs md:block">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint"
        />
        <input
          type="search"
          disabled
          aria-label="Recherche globale (indisponible avant la Phase 5)"
          placeholder="Recherche globale — Phase 5"
          className="h-9 w-full rounded border border-line bg-ink-900 pl-9 pr-3 text-sm text-text placeholder:text-text-faint disabled:cursor-not-allowed disabled:opacity-70"
        />
      </div>

      <div className="flex items-center gap-2 border-l border-line pl-3">
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full border border-line bg-ink-800 font-mono text-xs text-text-dim"
        >
          {initials(displayName)}
        </span>
        <div className="hidden leading-tight sm:block">
          <p className="max-w-40 truncate text-xs text-text-dim">
            {displayName}
          </p>
          <p className="font-mono text-[10px] text-text-faint">
            {roleLabels[user.role]}
          </p>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
