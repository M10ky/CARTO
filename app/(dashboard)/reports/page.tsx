import type { Metadata } from "next";

import { BreakdownList } from "@/components/overview/breakdown-list";
import { StatCard } from "@/components/overview/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { getReportsOverview } from "@/lib/data/reports";

export const metadata: Metadata = { title: "Statistiques" };

export default async function ReportsPage() {
  const overview = await getReportsOverview();

  return (
    <>
      <PageHeader
        title="Statistiques et rapports"
        description="Indicateurs agrégés calculés à partir des données réelles de la base."
        badge={<Badge tone="accent">Phase 8</Badge>}
      />

      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Zones"
            value={overview.zones}
            hint={`${overview.rows} rangées`}
          />
          <StatCard label="Positions" value={overview.seats.total} />
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
            label="Tickets de maintenance"
            value={overview.tickets.total}
            hint={`${overview.tickets.open} en cours`}
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

          <Panel>
            <PanelHeader
              title="Équipements par type"
              description="Catégories de matériel référencées."
            />
            <PanelBody>
              <BreakdownList items={overview.assets.byType} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Tickets par statut"
              description="Répartition des interventions."
            />
            <PanelBody>
              <BreakdownList items={overview.tickets.byStatus} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Tickets par priorité"
              description="Charge par niveau d'urgence."
            />
            <PanelBody>
              <BreakdownList items={overview.tickets.byPriority} />
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  );
}
