import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { AssetAssignments } from "@/components/assets/asset-assignments";
import { AssetForm } from "@/components/assets/asset-form";
import { AssetStatusToggle } from "@/components/assets/asset-status-toggle";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { getCurrentUser } from "@/lib/auth/session";
import { pcStatusLabel, pcStatusTone } from "@/lib/constants/inventory";
import { getPcAssetDetail, listAssetTypes } from "@/lib/data/assets";
import { listEmployeeOptions } from "@/lib/data/employees";

export const metadata: Metadata = { title: "Fiche équipement" };

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [asset, user] = await Promise.all([
    getPcAssetDetail(id),
    getCurrentUser(),
  ]);

  if (!asset) {
    notFound();
  }

  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";
  const [assetTypes, employees] = canEdit
    ? await Promise.all([listAssetTypes(), listEmployeeOptions()])
    : [[], []];

  return (
    <>
      <Link
        href="/assets"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-text-dim transition-colors hover:text-text"
      >
        <ArrowLeft aria-hidden className="size-3.5" />
        Retour au parc informatique
      </Link>

      <PageHeader
        title={asset.assetTag ?? asset.serialNumber ?? "Équipement"}
        description={[asset.manufacturer, asset.model].filter(Boolean).join(" ") || undefined}
        badge={
          <Badge tone={pcStatusTone(asset.status)} dot>
            {pcStatusLabel(asset.status)}
          </Badge>
        }
        actions={
          canEdit ? (
            <AssetStatusToggle assetId={asset.id} isActive={asset.isActive} />
          ) : null
        }
      />

      {canEdit ? (
        <Panel>
          <PanelHeader
            title="Informations"
            description="Modifiez la fiche puis enregistrez."
          />
          <PanelBody>
            <AssetForm asset={asset} assetTypes={assetTypes} />
          </PanelBody>
        </Panel>
      ) : (
        <>
          <Panel>
            <PanelHeader title="Informations" />
            <PanelBody>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Detail label="Numéro d'inventaire" value={asset.assetTag} mono />
                <Detail label="Numéro de série" value={asset.serialNumber} mono />
                <Detail label="Fabricant" value={asset.manufacturer} />
                <Detail label="Modèle" value={asset.model} />
                <Detail label="Type" value={asset.assetType} />
                <Detail label="Système d'exploitation" value={asset.os} />
                <Detail label="Notes" value={asset.notes} />
              </dl>
            </PanelBody>
          </Panel>
          <Alert tone="info" className="mt-4">
            Consultation seule : votre rôle ne permet pas de modifier cet
            équipement.
          </Alert>
        </>
      )}

      <Panel className="mt-4">
        <PanelHeader
          title="Affectations"
          description="Un équipement n'est affecté qu'à un collaborateur à la fois."
        />
        <PanelBody>
          <AssetAssignments
            pcAssetId={asset.id}
            employees={employees}
            assignments={asset.assignments}
            canEdit={canEdit}
          />
        </PanelBody>
      </Panel>
    </>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-text-faint">{label}</dt>
      <dd className={mono ? "font-mono text-xs text-text-dim" : "text-text-dim"}>
        {value ?? "—"}
      </dd>
    </div>
  );
}
