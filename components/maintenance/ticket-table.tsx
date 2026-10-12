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
import {
  maintenancePriorityLabel,
  maintenancePriorityTone,
  maintenanceStatusLabel,
  maintenanceStatusTone,
} from "@/lib/constants/maintenance";
import type { MaintenanceTicket } from "@/types/maintenance";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

export function TicketTable({ tickets }: { tickets: MaintenanceTicket[] }) {
  if (tickets.length === 0) {
    return (
      <EmptyState
        title="Aucune intervention"
        description="Aucun ticket ne correspond aux critères de recherche."
      />
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Référence</TableHeaderCell>
          <TableHeaderCell>Intitulé</TableHeaderCell>
          <TableHeaderCell className="hidden sm:table-cell">
            Équipement
          </TableHeaderCell>
          <TableHeaderCell>Priorité</TableHeaderCell>
          <TableHeaderCell>Statut</TableHeaderCell>
          <TableHeaderCell className="hidden md:table-cell">
            Ouvert le
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.id}>
            <TableCell>
              <Link
                href={`/maintenance/${ticket.id}`}
                className="font-mono text-xs font-medium text-text hover:text-accent"
              >
                {ticket.reference ?? "—"}
              </Link>
            </TableCell>
            <TableCell className="max-w-xs truncate text-text">
              {ticket.title}
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {ticket.pcAssetTag ?? "—"}
            </TableCell>
            <TableCell>
              <Badge tone={maintenancePriorityTone(ticket.priority)} dot>
                {maintenancePriorityLabel(ticket.priority)}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge tone={maintenanceStatusTone(ticket.status)} dot>
                {maintenanceStatusLabel(ticket.status)}
              </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {formatDate(ticket.openedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
