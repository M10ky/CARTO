"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
} from "@/lib/constants/maintenance";
import {
  createMaintenanceTicket,
  updateMaintenanceTicket,
  type MaintenanceInput,
} from "@/lib/actions/maintenance";
import type { AssetOption } from "@/lib/data/assets";
import type { EmployeeOption, SeatOption } from "@/lib/data/employees";
import type { MaintenanceTicket } from "@/types/maintenance";

type Feedback = { tone: "success" | "danger"; message: string };

const EMPTY: MaintenanceInput = {
  title: "",
  description: "",
  priority: "NORMAL",
  status: "OPEN",
  technician: "",
  resolution: "",
  pcAssetId: "",
  employeeId: "",
  seatId: "",
};

function toInput(ticket?: MaintenanceTicket): MaintenanceInput {
  if (!ticket) {
    return EMPTY;
  }
  return {
    title: ticket.title,
    description: ticket.description ?? "",
    priority: ticket.priority,
    status: ticket.status,
    technician: ticket.technician ?? "",
    resolution: ticket.resolution ?? "",
    pcAssetId: ticket.pcAssetId ?? "",
    employeeId: ticket.employeeId ?? "",
    seatId: ticket.seatId ?? "",
  };
}

export function TicketForm({
  ticket,
  assets,
  employees,
  seats,
  onDone,
}: {
  ticket?: MaintenanceTicket;
  assets: AssetOption[];
  employees: EmployeeOption[];
  seats: SeatOption[];
  onDone?: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<MaintenanceInput>(() => toInput(ticket));
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(ticket);

  function set<K extends keyof MaintenanceInput>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = ticket
        ? await updateMaintenanceTicket(ticket.id, values)
        : await createMaintenanceTicket(values);
      if (result.ok) {
        setFeedback({
          tone: "success",
          message: isEdit ? "Ticket mis à jour." : "Ticket créé.",
        });
        if (!isEdit) {
          setValues(EMPTY);
        }
        router.refresh();
        onDone?.();
      } else {
        setFeedback({ tone: "danger", message: result.error });
      }
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}

      <Field
        label="Intitulé"
        htmlFor="ticket-title"
        required
        hint="Décrivez brièvement le problème (ex. écran ne s'allume plus)."
      >
        <Input
          id="ticket-title"
          value={values.title}
          onChange={(event) => set("title", event.target.value)}
          autoComplete="off"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Priorité" htmlFor="ticket-priority">
          <Select
            id="ticket-priority"
            value={values.priority}
            onChange={(event) => set("priority", event.target.value)}
          >
            {MAINTENANCE_PRIORITIES.map((priority) => (
              <option key={priority.code} value={priority.code}>
                {priority.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Statut" htmlFor="ticket-status">
          <Select
            id="ticket-status"
            value={values.status}
            onChange={(event) => set("status", event.target.value)}
          >
            {MAINTENANCE_STATUSES.map((status) => (
              <option key={status.code} value={status.code}>
                {status.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Technicien" htmlFor="ticket-technician">
          <Input
            id="ticket-technician"
            value={values.technician}
            onChange={(event) => set("technician", event.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field label="Équipement concerné" htmlFor="ticket-asset">
          <Select
            id="ticket-asset"
            value={values.pcAssetId}
            onChange={(event) => set("pcAssetId", event.target.value)}
          >
            <option value="">Aucun</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.assetTag ?? asset.model ?? "Équipement sans référence"}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Collaborateur concerné" htmlFor="ticket-employee">
          <Select
            id="ticket-employee"
            value={values.employeeId}
            onChange={(event) => set("employeeId", event.target.value)}
          >
            <option value="">Aucun</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName}
                {employee.matricule ? ` (${employee.matricule})` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Position concernée" htmlFor="ticket-seat">
          <Select
            id="ticket-seat"
            value={values.seatId}
            onChange={(event) => set("seatId", event.target.value)}
          >
            <option value="">Aucune</option>
            {seats.map((seat) => (
              <option key={seat.id} value={seat.id}>
                {seat.code}
                {seat.zoneName ? ` — ${seat.zoneName}` : ""}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Description" htmlFor="ticket-description">
        <Textarea
          id="ticket-description"
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
        />
      </Field>

      <Field
        label="Résolution"
        htmlFor="ticket-resolution"
        hint="À renseigner lorsque l'intervention est terminée."
      >
        <Textarea
          id="ticket-resolution"
          value={values.resolution}
          onChange={(event) => set("resolution", event.target.value)}
        />
      </Field>

      <div className="flex justify-end gap-2">
        {onDone ? (
          <Button variant="ghost" onClick={onDone} disabled={pending}>
            Fermer
          </Button>
        ) : null}
        <Button type="submit" variant="primary" disabled={pending}>
          {isEdit ? "Enregistrer" : "Créer le ticket"}
        </Button>
      </div>
    </form>
  );
}
