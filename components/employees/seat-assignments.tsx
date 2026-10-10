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
import { assignSeat, endAssignment } from "@/lib/actions/employees";
import type { SeatOption } from "@/lib/data/employees";
import type { AssignmentLink } from "@/types/assignment";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
});

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

export function SeatAssignments({
  employeeId,
  seats,
  assignments,
  canEdit,
}: {
  employeeId: string;
  seats: SeatOption[];
  assignments: AssignmentLink[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [seatId, setSeatId] = useState("");
  const [feedback, setFeedback] = useState<{
    tone: "success" | "danger";
    message: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: Promise<{ ok: boolean; error?: string }>, okMessage: string) {
    startTransition(async () => {
      const result = await action;
      if (result.ok) {
        setFeedback({ tone: "success", message: okMessage });
        setSeatId("");
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
            htmlFor="assign-seat"
            className="flex min-w-52 flex-1 flex-col gap-1 text-xs font-medium text-text-dim"
          >
            Affecter à une position
            <Select
              id="assign-seat"
              value={seatId}
              onChange={(event) => setSeatId(event.target.value)}
            >
              <option value="">Choisir une position…</option>
              {seats.map((seat) => (
                <option key={seat.id} value={seat.id}>
                  {seat.label ? `${seat.label} — ` : ""}
                  {seat.code}
                  {seat.zoneName ? ` (${seat.zoneName})` : ""}
                </option>
              ))}
            </Select>
          </label>
          <Button
            variant="primary"
            size="sm"
            disabled={pending || !seatId}
            onClick={() =>
              run(assignSeat(employeeId, seatId), "Position affectée.")
            }
          >
            Affecter
          </Button>
        </div>
      ) : null}

      {active.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {active.map((assignment) => (
            <Badge key={assignment.id} tone="accent" dot>
              {assignment.seatLabel ? `${assignment.seatLabel} · ` : ""}
              {assignment.seatCode ?? "—"}
              {assignment.zoneName ? ` (${assignment.zoneName})` : ""}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-dim">Aucune position affectée.</p>
      )}

      {assignments.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Position</TableHeaderCell>
              <TableHeaderCell>Équipement</TableHeaderCell>
              <TableHeaderCell>Depuis</TableHeaderCell>
              <TableHeaderCell>Jusqu&apos;au</TableHeaderCell>
              <TableHeaderCell className="text-right">Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  {assignment.seatCode ? (
                    <span>
                      {assignment.seatLabel ? `${assignment.seatLabel} · ` : ""}
                      <span className="font-mono text-xs">
                        {assignment.seatCode}
                      </span>
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {assignment.pcAssetTag ?? "—"}
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
                <TableCell className="text-right">
                  {canEdit && assignment.isActive ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        run(
                          endAssignment(assignment.id),
                          "Affectation terminée.",
                        )
                      }
                    >
                      Terminer
                    </Button>
                  ) : null}
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
