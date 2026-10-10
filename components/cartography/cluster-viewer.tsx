"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Move, X } from "lucide-react";

import { ClusterPlan } from "@/components/cartography/cluster-plan";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import {
  moveSeat,
  renameRow,
  renameZone,
  updateSeat,
  type PlanActionResult,
} from "@/lib/actions/plan";
import type { PlanLayout, PlanSeat, PlanZone } from "@/types/plan";

type Feedback = { tone: "success" | "danger" | "info"; message: string };

export function ClusterViewer({
  layout,
  canEdit,
}: {
  layout: PlanLayout;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, startTransition] = useTransition();

  const seat = useMemo(
    () => layout.seats.find((s) => s.id === selectedId) ?? null,
    [layout.seats, selectedId],
  );
  const zone = seat
    ? (layout.zones.find((z) => z.id === seat.zoneId) ?? null)
    : null;
  const row =
    seat && seat.rowId
      ? (layout.rows.find((r) => r.id === seat.rowId) ?? null)
      : null;

  function run(action: Promise<PlanActionResult>, successMessage: string) {
    startTransition(async () => {
      const result = await action;
      if (result.ok) {
        setFeedback({ tone: "success", message: successMessage });
        router.refresh();
      } else {
        setFeedback({ tone: "danger", message: result.error });
      }
    });
  }

  function handleCellClick(gridRow: number, gridCol: string) {
    if (!seat) {
      return;
    }
    setMoveMode(false);
    run(
      moveSeat({ seatId: seat.id, gridRow, gridCol }),
      `Position ${seat.label ?? seat.code} déplacée en ${gridCol}${gridRow}.`,
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        {feedback ? (
          <Alert tone={feedback.tone} className="mb-3">
            {feedback.message}
          </Alert>
        ) : null}

        {moveMode && seat ? (
          <Alert tone="info" className="mb-3" title="Mode déplacement">
            Cliquez sur une case cible du plan pour déplacer la position{" "}
            <span className="font-mono">{seat.label ?? seat.code}</span>.
          </Alert>
        ) : null}

        <ClusterPlan
          layout={layout}
          selectedSeatId={selectedId}
          onSelectSeat={(id) => {
            setSelectedId(id);
            setMoveMode(false);
            setFeedback(null);
          }}
          moveMode={moveMode}
          onCellClick={handleCellClick}
        />
      </div>

      <div className="flex flex-col gap-4">
        {seat && zone ? (
          <Panel>
            <PanelHeader
              title={seat.label ?? seat.code}
              description={`${zone.name}${row ? ` · ${row.label}` : ""}`}
              actions={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Fermer la sélection"
                  onClick={() => {
                    setSelectedId(null);
                    setMoveMode(false);
                  }}
                >
                  <X aria-hidden className="size-4" />
                </Button>
              }
            />
            <PanelBody className="flex flex-col gap-4">
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <dt className="text-text-faint">Code</dt>
                <dd className="font-mono text-text-dim">{seat.code}</dd>
                <dt className="text-text-faint">Position Excel</dt>
                <dd className="font-mono text-text-dim">
                  {seat.gridCol}
                  {seat.gridRow}
                </dd>
              </dl>

              {canEdit ? (
                <SeatEditor
                  key={seat.id}
                  seat={seat}
                  zone={zone}
                  rowLabel={row?.label ?? null}
                  rowId={seat.rowId}
                  statuses={layout.statuses}
                  pending={pending}
                  moveMode={moveMode}
                  onToggleMove={() => setMoveMode((value) => !value)}
                  onSave={(label, status) =>
                    run(
                      updateSeat({ seatId: seat.id, label, status }),
                      "Position mise à jour.",
                    )
                  }
                  onRenameRow={(label) => {
                    if (!seat.rowId) {
                      return;
                    }
                    run(renameRow({ rowId: seat.rowId, label }), "Rangée renommée.");
                  }}
                />
              ) : (
                <Alert tone="info">
                  Consultation seule : votre rôle ne permet pas de modifier le plan.
                </Alert>
              )}
            </PanelBody>
          </Panel>
        ) : (
          <Panel>
            <PanelHeader
              title="Sélection"
              description="Cliquez sur une position du plan"
            />
            <PanelBody className="text-xs text-text-dim">
              Le détail de la position (zone, rangée, indice Excel, statut)
              s&apos;affiche ici.
            </PanelBody>
          </Panel>
        )}

        {canEdit ? (
          <ZoneEditor zones={layout.zones} pending={pending} />
        ) : null}
      </div>
    </div>
  );
}

function SeatEditor({
  seat,
  zone,
  rowLabel,
  rowId,
  statuses,
  pending,
  moveMode,
  onToggleMove,
  onSave,
  onRenameRow,
}: {
  seat: PlanSeat;
  zone: PlanZone;
  rowLabel: string | null;
  rowId: string | null;
  statuses: PlanLayout["statuses"];
  pending: boolean;
  moveMode: boolean;
  onToggleMove: () => void;
  onSave: (label: string, status: string) => void;
  onRenameRow: (label: string) => void;
}) {
  const [label, setLabel] = useState(seat.label ?? "");
  const [status, setStatus] = useState(seat.status);
  const [rowDraft, setRowDraft] = useState(rowLabel ?? "");

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(label, status);
        }}
      >
        <Field label="Indice de la position" htmlFor="seat-label">
          <Input
            id="seat-label"
            value={label}
            maxLength={40}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="ex. E13"
          />
        </Field>

        <Field label="Statut" htmlFor="seat-status">
          <Select
            id="seat-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {statuses.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" size="sm" disabled={pending}>
            Enregistrer
          </Button>
          <Button
            type="button"
            variant={moveMode ? "primary" : "secondary"}
            size="sm"
            disabled={pending}
            onClick={onToggleMove}
          >
            <Move aria-hidden className="size-3.5" />
            {moveMode ? "Annuler le déplacement" : "Déplacer"}
          </Button>
        </div>
      </form>

      {rowId ? (
        <form
          className="flex flex-col gap-3 border-t border-line pt-3"
          onSubmit={(event) => {
            event.preventDefault();
            onRenameRow(rowDraft);
          }}
        >
          <Field
            label="Libellé de la rangée"
            htmlFor="row-label"
            hint={`Zone ${zone.code}`}
          >
            <Input
              id="row-label"
              value={rowDraft}
              maxLength={80}
              onChange={(event) => setRowDraft(event.target.value)}
            />
          </Field>
          <Button type="submit" variant="secondary" size="sm" disabled={pending}>
            Renommer la rangée
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function ZoneEditor({
  zones,
  pending,
}: {
  zones: PlanZone[];
  pending: boolean;
}) {
  return (
    <Panel>
      <PanelHeader
        title="Zones"
        description="Renommez les zones — le plan se met à jour"
      />
      <PanelBody className="flex max-h-[420px] flex-col gap-3 overflow-auto">
        {zones.map((zone) => (
          <ZoneNameField key={zone.id} zone={zone} pending={pending} />
        ))}
      </PanelBody>
    </Panel>
  );
}

function ZoneNameField({
  zone,
  pending,
}: {
  zone: PlanZone;
  pending: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(zone.name);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const result = await renameZone({ zoneId: zone.id, name });
    setSaving(false);
    if (result.ok) {
      router.refresh();
    }
  }

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <Field label={zone.code} className="flex-1">
        <Input
          value={name}
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        disabled={pending || saving || name.trim() === zone.name}
      >
        OK
      </Button>
    </form>
  );
}
