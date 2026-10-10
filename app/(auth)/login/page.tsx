import { Map as MapIcon } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Connexion",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const params = await searchParams;
  const redirectTo =
    params.redirectTo && params.redirectTo.startsWith("/")
      ? params.redirectTo
      : "/";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded border border-line bg-ink-800 text-accent"
          >
            <MapIcon className="size-5" />
          </span>
          <div>
            <h1 className="text-base font-semibold text-text">Cluster CNTO</h1>
            <p className="text-xs text-text-faint">
              Cartographie &amp; inventaire du parc
            </p>
          </div>
        </div>

        <div className="rounded border border-line bg-ink-800/60 p-6 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-text">Connexion</h2>
          <p className="mb-5 mt-1 text-xs text-text-dim">
            Accès réservé aux collaborateurs autorisés.
          </p>
          <LoginForm redirectTo={redirectTo} />
        </div>

        <p className="mt-6 text-center text-xs text-text-faint">
          Cluster CNTO — usage interne
        </p>
      </div>
    </main>
  );
}
