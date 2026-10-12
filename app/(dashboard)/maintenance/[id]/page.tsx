import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { TicketForm } from "@/components/maintenance/ticket-form";
import { TicketStatusControls } from "@/components/maintenance/ticket-status-controls";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { getCurrentUser } from "@/lib/auth/session";
import {
  maintenancePriorityLabel,
  maintenancePriorityTone,
  maintenanceStatusLabel,
  maintenanceStatusTone,
} from "@/lib/constants/maintenance";
import { listAssetOptions } from "@/lib/data/assets";
import { listEmployeeOptions, listSeatOptions } from "@/lib/data/employees";
import { getMaintenanceTicket } from "@/lib/data/maintenance";

export const metadata: Metadata = { title: "Fiche intervention" };

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

export default async function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ticket, user] = await Promise.all([
    getMaintenanceTicket(id),
    getCurrentUser(),
  ]);

  if (!ticket) {
    notFound();
  }

  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";
  const options = canEdit
    ? await Promise.all([
        listAssetOptions(),
        listEmployeeOptions(),
        listSeatOptions(),
      ])
    : null;

  return (
    <>
      <Link
        href="/maintenance"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-text-dim transition-colors hover:text-text"
      >
        <ArrowLeft aria-hidden className="size-3.5" />
        Retour à la maintenance
      </Link>

      <PageHeader
        title={ticket.reference ?? ticket.title}
        description={ticket.reference ? ticket.title : undefined}
        badge={
          <Badge tone={maintenanceStatusTone(ticket.status)} dot>
            {maintenanceStatusLabel(ticket.status)}
          </Badge>
        }
      />

      {canEdit && options ? (
        <>
          <Panel className="mb-4">
            <PanelHeader
              title="Cycle de vie"
              description="Faites évoluer le statut du ticket en un clic."
            />
            <PanelBody>
              <TicketStatusControls
                ticketId={ticket.id}
                status={ticket.status}
              />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Informations"
              description="Modifiez le ticket puis enregistrez."
              actions={
                <Badge tone={maintenancePriorityTone(ticket.priority)} dot>
                  Priorité : {maintenancePriorityLabel(ticket.priority)}
                </Badge>
              }
            />
            <PanelBody>
              <TicketForm
                ticket={ticket}
                assets={options[0]}
                employees={options[1]}
                seats={options[2]}
              />
            </PanelBody>
          </Panel>
        </>
      ) : (
        <>
          <Panel>
            <PanelHeader
              title="Informations"
              actions={
                <Badge tone={maintenancePriorityTone(ticket.priority)} dot>
                  Priorité : {maintenancePriorityLabel(ticket.priority)}
                </Badge>
              }
            />
            <PanelBody>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Detail label="Référence" value={ticket.reference} mono />
                <Detail label="Équipement" value={ticket.pcAssetTag} mono />
                <Detail label="Collaborateur" value={ticket.employeeName} />
                <Detail label="Position" value={ticket.seatCode} mono />
                <Detail label="Technicien" value={ticket.technician} />
                <Detail
                  label="Ouvert le"
                  value={formatDate(ticket.openedAt)}
                />
                <Detail
                  label="Clôturé le"
                  value={formatDate(ticket.closedAt)}
                />
                <Detail
                  label="Statut"
                  value={maintenanceStatusLabel(ticket.status)}
                />
              </dl>
              <div className="mt-4 flex flex-col gap-4">
                <ReadOnlyBlock title="Description" value={ticket.description} />
                <ReadOnlyBlock title="Résolution" value={ticket.resolution} />
              </div>
            </PanelBody>
          </Panel>
          <Alert tone="info" className="mt-4">
            Consultation seule : votre rôle ne permet pas de modifier ce ticket.
          </Alert>
        </>
      )}
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

function ReadOnlyBlock({
  title,
  value,
}: {
  title: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-xs text-text-faint">{title}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-text-dim">
        {value ?? "—"}
      </p>
    </div>
  );
}
