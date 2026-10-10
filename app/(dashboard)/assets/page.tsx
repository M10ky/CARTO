import type { Metadata } from "next";

import { AssetTable } from "@/components/assets/asset-table";
import { NewAsset } from "@/components/assets/new-asset";
import { FilterBar, FilterField } from "@/components/inventory/filter-bar";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { getCurrentUser } from "@/lib/auth/session";
import { PC_STATUSES } from "@/lib/constants/inventory";
import { listAssetTypes, listPcAssets } from "@/lib/data/assets";

export const metadata: Metadata = { title: "Parc informatique" };

type SearchParams = {
  search?: string;
  status?: string;
  type?: string;
  active?: string;
};

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const active =
    params.active === "inactive" || params.active === "all"
      ? params.active
      : "active";

  const [assets, assetTypes, user] = await Promise.all([
    listPcAssets({
      search: params.search,
      status: params.status,
      assetType: params.type,
      active,
    }),
    listAssetTypes(),
    getCurrentUser(),
  ]);

  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";

  return (
    <>
      <PageHeader
        title="Parc informatique"
        description="Inventaire des ordinateurs et de leurs affectations aux collaborateurs."
        badge={<Badge tone="accent">{assets.length} résultat(s)</Badge>}
      />

      <div className="flex flex-col gap-4">
        {canEdit ? <NewAsset assetTypes={assetTypes} /> : null}

        <FilterBar resetHref="/assets">
          <FilterField label="Recherche" htmlFor="asset-search">
            <Input
              id="asset-search"
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Inventaire, série, modèle, système"
            />
          </FilterField>
          <FilterField label="Statut" htmlFor="asset-filter-status">
            <Select
              id="asset-filter-status"
              name="status"
              defaultValue={params.status ?? ""}
            >
              <option value="">Tous les statuts</option>
              {PC_STATUSES.map((status) => (
                <option key={status.code} value={status.code}>
                  {status.label}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Type" htmlFor="asset-filter-type">
            <Select
              id="asset-filter-type"
              name="type"
              defaultValue={params.type ?? ""}
            >
              <option value="">Tous les types</option>
              {assetTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Activation" htmlFor="asset-filter-active">
            <Select
              id="asset-filter-active"
              name="active"
              defaultValue={active}
            >
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="all">Tous</option>
            </Select>
          </FilterField>
        </FilterBar>

        <Panel>
          <PanelHeader
            title="Liste"
            description="Cliquez sur un équipement pour ouvrir sa fiche."
          />
          <PanelBody className="p-0">
            <AssetTable assets={assets} />
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}
