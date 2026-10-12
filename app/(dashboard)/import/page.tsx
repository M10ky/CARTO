import type { Metadata } from "next";

import { ImportWorkbench } from "@/components/import/import-workbench";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Import Excel / CSV" };

type SearchParams = { kind?: string };

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";

  if (!canEdit) {
    return (
      <>
        <PageHeader title="Import Excel / CSV" />
        <Alert tone="warning" title="Accès restreint">
          L&apos;import de données est réservé aux administrateurs et
          gestionnaires.
        </Alert>
      </>
    );
  }

  const initialKind = params.kind === "assets" ? "assets" : "employees";

  return (
    <>
      <PageHeader
        title="Import Excel / CSV"
        description="Intégrez les collaborateurs ou le parc informatique depuis un fichier : analyse, correspondance des colonnes, aperçu puis rapport d'erreurs."
        badge={<Badge tone="accent">Phase 7</Badge>}
      />

      <ImportWorkbench initialKind={initialKind} />
    </>
  );
}
