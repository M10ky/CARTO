import type { Metadata } from "next";
import Link from "next/link";
import { Search, SearchX } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/field";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import {
  pcStatusLabel,
  pcStatusTone,
} from "@/lib/constants/inventory";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Recherche" };

function escapeSearch(value: string): string {
  return value.replace(/[\\%_,()]/g, (char) => `\\${char}`);
}

type SeatHitRow = {
  id: string;
  code: string;
  label: string | null;
  status: string;
  grid_row: number | null;
  grid_col: string | null;
  zones: { code: string; name: string }[] | null;
};

type AssetHitRow = {
  id: string;
  asset_tag: string | null;
  serial_number: string | null;
  manufacturer: string | null;
  model: string | null;
  asset_type: string | null;
  status: string;
};

type ZoneHitRow = {
  id: string;
  code: string;
  name: string;
};

type SearchParams = { q?: string | string[] };

async function runSearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  q: string,
) {
  const pattern = `%${escapeSearch(q)}%`;

  const [seatsRes, assetsRes, zonesRes, statusesRes] = await Promise.all([
    supabase
      .from("seats")
      .select(
        "id, code, label, status, grid_row, grid_col, zones:zones(code, name)",
      )
      .or(`code.ilike.${pattern},label.ilike.${pattern}`)
      .eq("is_active", true)
      .order("code")
      .limit(30),
    supabase
      .from("pc_assets")
      .select(
        "id, asset_tag, serial_number, manufacturer, model, asset_type, status",
      )
      .or(
        `asset_tag.ilike.${pattern},serial_number.ilike.${pattern},manufacturer.ilike.${pattern},model.ilike.${pattern},asset_type.ilike.${pattern}`,
      )
      .eq("is_active", true)
      .order("asset_tag")
      .limit(30),
    supabase
      .from("zones")
      .select("id, code, name")
      .or(`code.ilike.${pattern},name.ilike.${pattern}`)
      .eq("is_active", true)
      .order("code")
      .limit(10),
    supabase.from("seat_statuses").select("code, label, color"),
  ]);

  return {
    seatsRes,
    assetsRes,
    zonesRes,
    statusesRes,
  };
}

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const q = raw?.trim().slice(0, 80) ?? "";

  if (!q) {
    return (
      <>
        <PageHeader
          title="Recherche"
          description="Recherchez une position, un équipement ou une zone dans le cluster."
        />
        <div className="mx-auto max-w-md">
          <SearchForm initialValue="" />
          <Panel className="mt-4">
            <EmptyState
              icon={Search}
              title="Que cherchez-vous ?"
              description="Saisissez un code de position (ex. A12), une référence d'équipement, un modèle ou un nom de zone."
            />
          </Panel>
        </div>
      </>
    );
  }

  const supabase = await createClient();
  const { seatsRes, assetsRes, zonesRes, statusesRes } = await runSearch(
    supabase,
    q,
  );

  if (seatsRes.error) {
    return (
      <>
        <PageHeader title="Recherche" />
        <Alert tone="danger" title="Recherche impossible">
          {seatsRes.error.message}
        </Alert>
      </>
    );
  }

  const seats = (seatsRes.data ?? []) as SeatHitRow[];
  const assets = (assetsRes.data ?? []) as AssetHitRow[];
  const zones = (zonesRes.data ?? []) as ZoneHitRow[];
  const statusLabel = new Map(
    ((statusesRes.data ?? []) as { code: string; label: string }[]).map(
      (status) => [status.code, status.label] as const,
    ),
  );

  const total = seats.length + assets.length + zones.length;

  return (
    <>
      <PageHeader
        title="Recherche"
        badge={<Badge tone="accent">{total} résultat{total > 1 ? "s" : ""}</Badge>}
        description={`Résultats pour « ${q} » — cherchez encore :`}
      />

      <div className="mx-auto mb-5 max-w-md">
        <SearchForm initialValue={raw ?? ""} />
      </div>

      {total === 0 ? (
        <Panel>
          <EmptyState
            icon={SearchX}
            title="Aucun résultat"
            description={`Aucune position, équipement ni zone ne correspond à « ${q} ».`}
          />
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {seats.length > 0 ? (
            <Panel>
              <PanelHeader title="Positions" description={`${seats.length} résultat(s)`} />
              <PanelBody className="flex flex-col gap-1.5">
                {seats.map((seat) => (
                  <Link
                    key={seat.id}
                    href={`/cluster?seat=${seat.id}`}
                    className="flex flex-wrap items-center gap-2 rounded border border-line bg-ink-900/40 px-3 py-2 text-xs transition-colors hover:border-accent/50"
                  >
                    <span className="font-mono text-text">{seat.code}</span>
                    {seat.label ? (
                      <span className="text-text-dim">{seat.label}</span>
                    ) : null}
                    {seat.zones?.[0] ? (
                      <span className="ml-auto truncate text-text-faint">
                        {seat.zones[0].name}
                      </span>
                    ) : null}
                    <Badge tone="neutral" className="font-mono">
                      {statusLabel.get(seat.status) ?? seat.status}
                    </Badge>
                  </Link>
                ))}
              </PanelBody>
            </Panel>
          ) : null}

          {assets.length > 0 ? (
            <Panel>
              <PanelHeader
                title="Équipements"
                description={`${assets.length} résultat(s)`}
              />
              <PanelBody className="flex flex-col gap-1.5">
                {assets.map((asset) => (
                  <Link
                    key={asset.id}
                    href={`/assets/${asset.id}`}
                    className="flex flex-wrap items-center gap-2 rounded border border-line bg-ink-900/40 px-3 py-2 text-xs transition-colors hover:border-accent/50"
                  >
                    <span className="font-mono text-text">
                      {asset.asset_tag ?? "—"}
                    </span>
                    {asset.model ? (
                      <span className="truncate text-text-dim">
                        {asset.model}
                      </span>
                    ) : null}
                    {asset.manufacturer ? (
                      <span className="truncate text-text-faint">
                        {asset.manufacturer}
                      </span>
                    ) : null}
                    <Badge
                      tone={pcStatusTone(asset.status)}
                      className="ml-auto"
                    >
                      {pcStatusLabel(asset.status)}
                    </Badge>
                  </Link>
                ))}
              </PanelBody>
            </Panel>
          ) : null}

          {zones.length > 0 ? (
            <Panel className="lg:col-span-2">
              <PanelHeader title="Zones" description={`${zones.length} résultat(s)`} />
              <PanelBody className="flex flex-col gap-1.5">
                {zones.map((zone) => (
                  <Link
                    key={zone.id}
                    href="/cluster"
                    className="flex items-center gap-2 rounded border border-line bg-ink-900/40 px-3 py-2 text-xs transition-colors hover:border-accent/50"
                  >
                    <span className="font-mono text-text">{zone.code}</span>
                    <span className="truncate text-text-dim">{zone.name}</span>
                  </Link>
                ))}
              </PanelBody>
            </Panel>
          ) : null}
        </div>
      )}
    </>
  );
}

function SearchForm({ initialValue }: { initialValue: string }) {
  return (
    <form
      action="/recherche"
      method="get"
      role="search"
      className="relative"
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint"
      />
      <Input
        type="search"
        name="q"
        defaultValue={initialValue}
        aria-label="Rechercher une position, un équipement ou une zone"
        placeholder="Code position, référence, modèle, zone…"
        autoComplete="off"
        className="h-11 pl-10"
      />
    </form>
  );
}