import type { Metadata } from "next";

import { NewTicket } from "@/components/maintenance/new-ticket";
import { TicketTable } from "@/components/maintenance/ticket-table";
import { FilterBar, FilterField } from "@/components/inventory/filter-bar";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { getCurrentUser } from "@/lib/auth/session";
import {
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
} from "@/lib/constants/maintenance";
import { listAssetOptions } from "@/lib/data/assets";
import { listSeatOptions } from "@/lib/data/seats";
import { listMaintenanceTickets } from "@/lib/data/maintenance";

export const metadata: Metadata = { title: "Maintenance" };

type SearchParams = {
  search?: string;
  status?: string;
  priority?: string;
};

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";

  const tickets = await listMaintenanceTickets({
    search: params.search,
    status: params.status,
    priority: params.priority,
  });

  const options = canEdit
    ? await Promise.all([listAssetOptions(), listSeatOptions()])
    : null;

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Suivi des interventions sur les équipements du cluster."
        badge={<Badge tone="accent">{tickets.length} ticket(s)</Badge>}
      />

      <div className="flex flex-col gap-4">
        {options ? (
          <NewTicket assets={options[0]} seats={options[1]} />
        ) : null}

        <FilterBar resetHref="/maintenance">
          <FilterField label="Recherche" htmlFor="ticket-search">
            <Input
              id="ticket-search"
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Référence, intitulé, technicien"
            />
          </FilterField>
          <FilterField label="Statut" htmlFor="ticket-filter-status">
            <Select
              id="ticket-filter-status"
              name="status"
              defaultValue={params.status ?? ""}
            >
              <option value="">Tous les statuts</option>
              {MAINTENANCE_STATUSES.map((status) => (
                <option key={status.code} value={status.code}>
                  {status.label}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Priorité" htmlFor="ticket-filter-priority">
            <Select
              id="ticket-filter-priority"
              name="priority"
              defaultValue={params.priority ?? ""}
            >
              <option value="">Toutes les priorités</option>
              {MAINTENANCE_PRIORITIES.map((priority) => (
                <option key={priority.code} value={priority.code}>
                  {priority.label}
                </option>
              ))}
            </Select>
          </FilterField>
        </FilterBar>

        <Panel>
          <PanelHeader
            title="Interventions"
            description="Cliquez sur une référence pour ouvrir le ticket."
          />
          <PanelBody className="p-0">
            <TicketTable tickets={tickets} />
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}
