"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { assignAsset, releaseAsset } from "@/lib/actions/assets";
import type { EmployeeOption } from "@/lib/data/employees";
import type { AssignmentLink } from "@/types/assignment";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

export function AssetAssignments({
  pcAssetId,
  employees,
  assignments,
  canEdit,
}: {
  pcAssetId: string;
  employees: EmployeeOption[];
  assignments: AssignmentLink[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [feedback, setFeedback] = useState<{
    tone: "success" | "danger";
    message: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  function run(
    action: Promise<{ ok: boolean; error?: string }>,
    okMessage: string,
  ) {
    startTransition(async () => {
      const result = await action;
      if (result.ok) {
        setFeedback({ tone: "success", message: okMessage });
        setEmployeeId("");
        router.refresh();
      } else {
        setFeedback({
          tone: "danger",
          message: result.error ?? "Action impossible.",
        });
      }
    });
  }

  const active = assignments.filter((assignment) => assignment.isActive);

  return (
    <div className="flex flex-col gap-4">
      {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}

      {canEdit ? (
        <div className="flex flex-wrap items-end gap-3 rounded border border-line bg-ink-900/40 p-3">
          <label
            htmlFor="assign-employee"
            className="flex min-w-52 flex-1 flex-col gap-1 text-xs font-medium text-text-dim"
          >
            Affecter à un collaborateur
            <Select
              id="assign-employee"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
            >
              <option value="">Choisir un collaborateur…</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName}
                  {employee.matricule ? ` (${employee.matricule})` : ""}
                </option>
              ))}
            </Select>
          </label>
          <Button
            variant="primary"
            size="sm"
            disabled={pending || !employeeId}
            onClick={() =>
              run(
                assignAsset(pcAssetId, employeeId),
                "Équipement affecté.",
              )
            }
          >
            Affecter
          </Button>
        </div>
      ) : null}

      {active.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {active.map((assignment) => (
            <Badge key={assignment.id} tone="accent" dot>
              {assignment.employeeName ?? "—"}
            </Badge>
          ))}
          {canEdit ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                run(releaseAsset(pcAssetId), "Équipement remis en stock.")
              }
            >
              Remettre en stock
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-text-dim">
          Aucune affectation active : l&apos;équipement est considéré en stock.
        </p>
      )}

      {assignments.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Collaborateur</TableHeaderCell>
              <TableHeaderCell>Position</TableHeaderCell>
              <TableHeaderCell>Depuis</TableHeaderCell>
              <TableHeaderCell>Jusqu&apos;au</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>{assignment.employeeName ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">
                  {assignment.seatCode ?? "—"}
                </TableCell>
                <TableCell>{formatDate(assignment.startedAt)}</TableCell>
                <TableCell>
                  {assignment.endedAt ? (
                    formatDate(assignment.endedAt)
                  ) : (
                    <Badge tone="success" dot>
                      En cours
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-text-dim">Aucun historique d&apos;affectation.</p>
      )}
    </div>
  );
}
