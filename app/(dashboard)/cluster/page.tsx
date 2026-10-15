import type { Metadata } from "next";

import { ClusterViewer } from "@/components/cartography/cluster-viewer";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { listAssignableAssets } from "@/lib/data/assets";
import { getPlanLayout } from "@/lib/data/spatial";
import type { PlanLayout } from "@/types/plan";

export const metadata: Metadata = { title: "Cartographie" };

type SearchParams = { seat?: string };

export default async function ClusterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  let layout: PlanLayout | null = null;
  let loadError: string | null = null;

  try {
    layout = await getPlanLayout();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Erreur de chargement inconnue.";
  }

  const user = await getCurrentUser();
  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";

  let assignableAssets: Awaited<ReturnType<typeof listAssignableAssets>> = [];
  if (canEdit) {
    try {
      assignableAssets = await listAssignableAssets();
    } catch (error) {
      loadError =
        error instanceof Error ? error.message : "Erreur de chargement inconnue.";
    }
  }

  if (!layout) {
    return (
      <>
        <PageHeader title="Cartographie" />
        <Alert tone="danger" title="Base de données injoignable">
          {loadError}
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Cartographie"
        description="Plan physique connecté à la base : sélectionnez une position pour voir son état et ses équipements, et (selon votre rôle) renommez les zones ou déplacez les positions."
        badge={
          <Badge tone="success" dot>
            {layout.seats.length} positions
          </Badge>
        }
      />

      <ClusterViewer
        layout={layout}
        canEdit={canEdit}
        initialSeatId={params.seat ?? null}
        assignableAssets={assignableAssets}
      />
    </>
  );
}