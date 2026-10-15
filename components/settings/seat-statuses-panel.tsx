"use client";

"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import {
  createSeatStatus,
  deleteSeatStatus,
  updateSeatStatus,
} from "@/lib/actions/admin";
import type { ActionResult } from "@/lib/actions/common";
import type { AdminSeatStatus } from "@/lib/data/admin";

type Feedback = { tone: "success" | "danger"; message: string };

export function SeatStatusesPanel({
  statuses,
}: {
  statuses: AdminSeatStatus[];
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function done(result: ActionResult, successMessage: string) {
    if (result.ok) {
      setFeedback({ tone: "success", message: successMessage });
      router.refresh();
    } else {
      setFeedback({ tone: "danger", message: result.error });
    }
  }

  return (
    <Panel>
      <PanelHeader
        title="États de position"
        description="Référentiel utilisé par le plan et les listes — un état en cours d'utilisation ne peut pas être supprimé."
      />
      <PanelBody>
        {feedback ? (
          <Alert tone={feedback.tone} className="mb-3">
            {feedback.message}
          </Alert>
        ) : null}

        <NewStatusForm onResult={done} />

        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Code</TableHeaderCell>
              <TableHeaderCell>Libellé</TableHeaderCell>
              <TableHeaderCell>Couleur</TableHeaderCell>
              <TableHeaderCell>Ordre</TableHeaderCell>
              <TableHeaderCell>Actif</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {statuses.map((status) => (
              <StatusRow
                key={status.code}
                status={status}
                onResult={done}
              />
            ))}
          </TableBody>
        </Table>
      </PanelBody>
    </Panel>
  );
}

function NewStatusForm({
  onResult,
}: {
  onResult: (result: ActionResult, successMessage: string) => void;
}) {
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createSeatStatus({
        code,
        label,
        color: color || null,
        description: description || null,
        sortOrder: 99,
      });
      onResult(result, "État créé.");
      if (result.ok) {
        setCode("");
        setLabel("");
        setColor("");
        setDescription("");
      }
    });
  }

  return (
    <form
      className="mb-4 flex flex-wrap items-end gap-3 rounded border border-line bg-ink-900/50 p-3"
      onSubmit={submit}
    >
      <Field label="Code" htmlFor="ns-code" className="w-36">
        <Input
          id="ns-code"
          value={code}
          maxLength={40}
          required
          placeholder="ex. ZONE_VIDE"
          onChange={(event) =>
            setCode(
              event.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9_]/g, ""),
            )
          }
        />
      </Field>
      <Field label="Libellé" htmlFor="ns-label" className="w-52">
        <Input
          id="ns-label"
          value={label}
          maxLength={80}
          required
          placeholder="ex. Zone vide"
          onChange={(event) => setLabel(event.target.value)}
        />
      </Field>
      <Field label="Couleur" htmlFor="ns-color" className="w-40">
        <Input
          id="ns-color"
          value={color}
          maxLength={9}
          placeholder="#3ecf8e"
          onChange={(event) => setColor(event.target.value)}
        />
      </Field>
      <Field label="Description" htmlFor="ns-description" className="min-w-52 flex-1">
        <Input
          id="ns-description"
          value={description}
          maxLength={200}
          placeholder="Usage explicite de cet état"
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>
      <Button type="submit" variant="primary" size="sm" disabled={pending}>
        <Plus aria-hidden className="size-3.5" />
        Ajouter
      </Button>
    </form>
  );
}

function StatusRow({
  status,
  onResult,
}: {
  status: AdminSeatStatus;
  onResult: (result: ActionResult, successMessage: string) => void;
}) {
  const [label, setLabel] = useState(status.label);
  const [color, setColor] = useState(status.color ?? "");
  const [description, setDescription] = useState(status.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(status.sortOrder));
  const [isActive, setIsActive] = useState(status.isActive);
  const [pending, startTransition] = useTransition();

  const dirty =
    label !== status.label ||
    color !== (status.color ?? "") ||
    description !== (status.description ?? "") ||
    sortOrder !== String(status.sortOrder) ||
    isActive !== status.isActive;

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateSeatStatus({
        code: status.code,
        label,
        color: color || null,
        description: description || null,
        sortOrder: Number.parseInt(sortOrder, 10) || 0,
        isActive,
      });
      onResult(result, "État enregistré.");
    });
  }

  function remove() {
    if (!window.confirm(`Supprimer l'état « ${label} » ?`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteSeatStatus({ code: status.code });
      onResult(result, "État supprimé.");
    });
  }

  return (
    <TableRow>
      <TableCell>
        <span className="font-mono text-xs">{status.code}</span>
      </TableCell>
      <TableCell>
        <form onSubmit={save} className="contents">
          <div className="flex max-w-80 flex-wrap items-center gap-2">
            <Input
              aria-label="Libellé"
              value={label}
              maxLength={80}
              required
              className="w-44"
              onChange={(event) => setLabel(event.target.value)}
            />
            <Input
              aria-label="Couleur"
              value={color}
              maxLength={9}
              placeholder="#3ecf8e"
              className="w-28"
              onChange={(event) => setColor(event.target.value)}
            />
            <Input
              aria-label="Description"
              value={description}
              maxLength={200}
              placeholder="Description"
              className="min-w-40 flex-1"
              onChange={(event) => setDescription(event.target.value)}
            />
            <Input
              aria-label="Ordre"
              type="number"
              value={sortOrder}
              className="w-20"
              onChange={(event) => setSortOrder(event.target.value)}
            />
            <label className="flex items-center gap-1.5 text-xs text-text-dim">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Actif
            </label>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={pending || !dirty}
            >
              <Save aria-hidden className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={remove}
            >
              <Trash2 aria-hidden className="size-3.5" />
            </Button>
          </div>
        </form>
      </TableCell>
      <TableCell>
        <Badge
          tone="neutral"
          className="font-mono"
        >
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: status.color ?? "#7e8ca6" }}
          />
          {status.code}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs">{status.sortOrder}</TableCell>
      <TableCell>
        {status.isActive ? (
          <Badge tone="success">Actif</Badge>
        ) : (
          <Badge tone="neutral">Inactif</Badge>
        )}
      </TableCell>
      <TableCell />
    </TableRow>
  );
}