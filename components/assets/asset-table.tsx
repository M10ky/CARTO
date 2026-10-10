import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { pcStatusLabel, pcStatusTone } from "@/lib/constants/inventory";
import type { PcAsset } from "@/types/asset";

export function AssetTable({ assets }: { assets: PcAsset[] }) {
  if (assets.length === 0) {
    return (
      <EmptyState
        title="Aucun équipement"
        description="Aucun résultat ne correspond aux critères de recherche."
      />
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Inventaire</TableHeaderCell>
          <TableHeaderCell className="hidden sm:table-cell">Modèle</TableHeaderCell>
          <TableHeaderCell className="hidden md:table-cell">Type</TableHeaderCell>
          <TableHeaderCell className="hidden lg:table-cell">Système</TableHeaderCell>
          <TableHeaderCell>Statut</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset.id}>
            <TableCell>
              <Link
                href={`/assets/${asset.id}`}
                className="font-mono text-xs font-medium text-text hover:text-accent"
              >
                {asset.assetTag ?? asset.serialNumber ?? "—"}
              </Link>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {[asset.manufacturer, asset.model].filter(Boolean).join(" ") || "—"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {asset.assetType ?? "—"}
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              {asset.os ?? "—"}
            </TableCell>
            <TableCell>
              <Badge tone={pcStatusTone(asset.status)} dot>
                {pcStatusLabel(asset.status)}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
