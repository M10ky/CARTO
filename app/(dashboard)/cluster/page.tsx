import type { Metadata } from "next";

import { ClusterViewer } from "@/components/cartography/cluster-viewer";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlanLayout } from "@/lib/data/spatial";
import type { PlanLayout } from "@/types/plan";

export const metadata: Metadata = { title: "Cartographie" };

export default async function ClusterPage() {
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

  const drawnByZone = new Map<string, number>();
  for (const seat of layout.seats) {
    drawnByZone.set(seat.zoneId, (drawnByZone.get(seat.zoneId) ?? 0) + 1);
  }

  return (
    <>
      <PageHeader
        title="Cartographie"
        description="Plan physique connecté à la base : sélectionnez une position, et (selon votre rôle) renommez les zones ou déplacez les positions."
        badge={
          <Badge tone="success" dot>
            Connectée — Phase 5
          </Badge>
        }
      />

      <ClusterViewer layout={layout} canEdit={canEdit} />

      <Panel className="mt-6">
        <PanelHeader
          title="Volumétrie par zone"
          description={`${layout.seats.length} positions dans la base`}
        />
        <PanelBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Zone</TableHeaderCell>
                <TableHeaderCell className="text-right">
                  Compteur Excel
                </TableHeaderCell>
                <TableHeaderCell className="text-right">
                  Positions en base
                </TableHeaderCell>
                <TableHeaderCell className="text-right">Écart</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {layout.zones.map((zone) => {
                const declared = zone.declaredPositions;
                const drawn = drawnByZone.get(zone.id) ?? 0;
                const gap = declared === null ? null : drawn - declared;
                return (
                  <TableRow key={zone.id}>
                    <TableCell className="text-text">
                      <span className="font-mono text-xs text-text-faint">
                        {zone.code}
                      </span>
                      <span className="ml-2">{zone.name}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {declared ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-text">
                      {drawn}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {gap === null ? (
                        "—"
                      ) : gap === 0 ? (
                        <span className="text-positive">0</span>
                      ) : (
                        <span className="text-warning">
                          {gap > 0 ? `+${gap}` : gap}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </PanelBody>
      </Panel>
    </>
  );
}
