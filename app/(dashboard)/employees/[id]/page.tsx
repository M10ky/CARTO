import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { EmployeeForm } from "@/components/employees/employee-form";
import { EmployeeStatusToggle } from "@/components/employees/employee-status-toggle";
import { SeatAssignments } from "@/components/employees/seat-assignments";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { getCurrentUser } from "@/lib/auth/session";
import { getEmployeeDetail, listSeatOptions } from "@/lib/data/employees";

export const metadata: Metadata = { title: "Fiche collaborateur" };

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [employee, user] = await Promise.all([
    getEmployeeDetail(id),
    getCurrentUser(),
  ]);

  if (!employee) {
    notFound();
  }

  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";
  const seats = canEdit ? await listSeatOptions() : [];

  return (
    <>
      <Link
        href="/employees"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-text-dim transition-colors hover:text-text"
      >
        <ArrowLeft aria-hidden className="size-3.5" />
        Retour aux collaborateurs
      </Link>

      <PageHeader
        title={employee.fullName || "Collaborateur"}
        description={employee.jobTitle ?? undefined}
        badge={
          <Badge tone={employee.isActive ? "success" : "neutral"} dot>
            {employee.isActive ? "Actif" : "Inactif"}
          </Badge>
        }
        actions={
          canEdit ? (
            <EmployeeStatusToggle
              employeeId={employee.id}
              isActive={employee.isActive}
            />
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
            <EmployeeForm employee={employee} />
          </PanelBody>
        </Panel>
      ) : (
        <>
          <Panel>
            <PanelHeader title="Informations" />
            <PanelBody>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Detail label="Matricule" value={employee.matricule} />
                <Detail label="Service" value={employee.service} />
                <Detail label="Fonction" value={employee.jobTitle} />
                <Detail label="E-mail" value={employee.email} />
                <Detail label="Téléphone" value={employee.phone} />
                <Detail label="Localisation" value={employee.location} />
              </dl>
            </PanelBody>
          </Panel>
          <Alert tone="info" className="mt-4">
            Consultation seule : votre rôle ne permet pas de modifier cette fiche.
          </Alert>
        </>
      )}

      <Panel className="mt-4">
        <PanelHeader
          title="Affectations aux positions"
          description="Une position active à la fois par collaborateur."
        />
        <PanelBody>
          <SeatAssignments
            employeeId={employee.id}
            seats={seats}
            assignments={employee.assignments}
            canEdit={canEdit}
          />
        </PanelBody>
      </Panel>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-text-faint">{label}</dt>
      <dd className="text-text-dim">{value ?? "—"}</dd>
    </div>
  );
}
