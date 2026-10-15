"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
import { assignAssetToSeat, releaseAsset } from "@/lib/actions/assets";
import type { SeatOption } from "@/lib/data/seats";
import type { AssignmentLink } from "@/types/assignment";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

export function AssetAssignments({
  pcAssetId,
  seats,
  assignments,
  canEdit,
}: {
  pcAssetId: string;
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

  function run(
    action: Promise<{ ok: boolean; error?: string }>,
    okMessage: string,
  ) {
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
                  {seat.code}
                  {seat.zoneName ? ` — ${seat.zoneName}` : ""}
                </option>
              ))}
            </Select>
          </label>
          <Button
            variant="primary"
            size="sm"
            disabled={pending || !seatId}
            onClick={() =>
              run(
                assignAssetToSeat(pcAssetId, seatId),
                "Équipement affecté à la position.",
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
            <Link key={assignment.id} href="/cluster" className="inline-flex">
              <Badge tone="accent" dot>
                Position {assignment.seatCode ?? "—"}
              </Badge>
            </Link>
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
              <TableHeaderCell>Position</TableHeaderCell>
              <TableHeaderCell>Depuis</TableHeaderCell>
              <TableHeaderCell>Jusqu&apos;au</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  <span className="font-mono text-xs">
                    {assignment.seatCode ?? "—"}
                  </span>
                  {assignment.zoneName ? (
                    <span className="ml-2 text-text-dim">
                      {assignment.zoneName}
                    </span>
                  ) : null}
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