"use client";

import { LogOut } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils/cn";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        aria-label="Se déconnecter"
      >
        <LogOut aria-hidden className="size-3.5" />
        <span className="hidden sm:inline">Déconnexion</span>
      </button>
    </form>
  );
}
