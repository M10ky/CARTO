import type { Metadata } from "next";

import { EmployeeTable } from "@/components/employees/employee-table";
import { FilterBar, FilterField } from "@/components/inventory/filter-bar";
import { NewEmployee } from "@/components/employees/new-employee";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { getCurrentUser } from "@/lib/auth/session";
import { listEmployees, listServices } from "@/lib/data/employees";

export const metadata: Metadata = { title: "Collaborateurs" };

type SearchParams = {
  search?: string;
  service?: string;
  status?: string;
};

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const status =
    params.status === "inactive" || params.status === "all"
      ? params.status
      : "active";

  const [employees, services, user] = await Promise.all([
    listEmployees({
      search: params.search,
      service: params.service,
      status,
    }),
    listServices(),
    getCurrentUser(),
  ]);

  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";

  return (
    <>
      <PageHeader
        title="Collaborateurs"
        description="Référentiel des collaborateurs et de leurs affectations à une position."
        badge={<Badge tone="accent">{employees.length} résultat(s)</Badge>}
      />

      <div className="flex flex-col gap-4">
        {canEdit ? <NewEmployee /> : null}

        <FilterBar resetHref="/employees">
          <FilterField label="Recherche" htmlFor="filter-search">
            <Input
              id="filter-search"
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Nom, matricule, e-mail, service"
            />
          </FilterField>
          <FilterField label="Service" htmlFor="filter-service">
            <Select
              id="filter-service"
              name="service"
              defaultValue={params.service ?? ""}
            >
              <option value="">Tous les services</option>
              {services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Statut" htmlFor="filter-status">
            <Select id="filter-status" name="status" defaultValue={status}>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="all">Tous</option>
            </Select>
          </FilterField>
        </FilterBar>

        <Panel>
          <PanelHeader
            title="Liste"
            description="Cliquez sur un collaborateur pour ouvrir sa fiche."
          />
          <PanelBody className="p-0">
            <EmployeeTable employees={employees} />
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}
