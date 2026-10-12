import type { Metadata } from "next";

import { TicketTable } from "@/components/maintenance/ticket-table";
import { PageHeader } from "@/components/layout/page-header";
import { BreakdownList } from "@/components/overview/breakdown-list";
import { StatCard } from "@/components/overview/stat-card";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { listRecentMaintenanceTickets } from "@/lib/data/maintenance";
import { getReportsOverview, type StatBreakdown } from "@/lib/data/reports";

export const metadata: Metadata = { title: "Tableau de bord" };

function countOf(items: StatBreakdown[], code: string): number {
  return items.find((item) => item.code === code)?.count ?? 0;
}

export default async function DashboardPage() {
  const [overview, recentTickets] = await Promise.all([
    getReportsOverview(),
    listRecentMaintenanceTickets(5),
  ]);

  const occupied = countOf(overview.seats.byStatus, "OCCUPIED");
  const free = countOf(overview.seats.byStatus, "FREE");
  const unavailable = countOf(overview.seats.byStatus, "UNAVAILABLE");
  const inMaintenance = countOf(overview.assets.byStatus, "MAINTENANCE");
  const occupancy =
    overview.seats.total > 0
      ? Math.round((occupied / overview.seats.total) * 100)
      : 0;

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble du Cluster CNTO, calculée à partir des données réelles de la base."
        badge={<Badge tone="accent">{overview.seats.total} positions</Badge>}
      />

      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Zones"
            value={overview.zones}
            hint={`${overview.rows} rangées`}
          />
          <StatCard
            label="Positions occupées"
            value={occupied}
            hint={`${occupancy}% du plan`}
          />
          <StatCard label="Positions libres" value={free} hint={`${unavailable} indisponible(s)`} />
          <StatCard
            label="Collaborateurs"
            value={overview.employees.total}
            hint={`${overview.employees.active} actif(s)`}
          />
          <StatCard
            label="Équipements"
            value={overview.assets.total}
            hint={`${overview.assets.active} actif(s)`}
          />
          <StatCard
            label="Équipements en maintenance"
            value={inMaintenance}
          />
          <StatCard
            label="Interventions en cours"
            value={overview.tickets.open}
            hint={`${overview.tickets.total} ticket(s) au total`}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader
              title="Positions par état"
              description="Répartition des positions du plan."
            />
            <PanelBody>
              <BreakdownList items={overview.seats.byStatus} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Équipements par statut"
              description="État du parc informatique."
            />
            <PanelBody>
              <BreakdownList items={overview.assets.byStatus} />
            </PanelBody>
          </Panel>
        </div>

        <Panel>
          <PanelHeader
            title="Dernières interventions"
            description="Les cinq tickets les plus récents."
          />
          <PanelBody className="p-0">
            <TicketTable tickets={recentTickets} />
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}
