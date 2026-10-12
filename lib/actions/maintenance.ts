"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { ensureEditor, fail, type ActionResult } from "@/lib/actions/common";
import {
  MAINTENANCE_PRIORITY_CODES,
  MAINTENANCE_STATUS_CODES,
  isClosedStatus,
} from "@/lib/constants/maintenance";

export type MaintenanceInput = {
  title: string;
  description: string;
  priority: string;
  status: string;
  technician: string;
  resolution: string;
  pcAssetId: string;
  employeeId: string;
  seatId: string;
};

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function makeReference(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TCK-${stamp}-${random}`;
}

function validate(input: MaintenanceInput): string | null {
  if (!input.title.trim()) {
    return "L'intitulé du ticket est obligatoire.";
  }
  if (!(MAINTENANCE_STATUS_CODES as string[]).includes(input.status)) {
    return "Statut de ticket inconnu.";
  }
  if (!(MAINTENANCE_PRIORITY_CODES as string[]).includes(input.priority)) {
    return "Priorité de ticket inconnue.";
  }
  return null;
}

function payload(input: MaintenanceInput) {
  return {
    title: input.title.trim(),
    description: nullable(input.description),
    priority: input.priority,
    status: input.status,
    technician: nullable(input.technician),
    resolution: nullable(input.resolution),
    pc_asset_id: nullable(input.pcAssetId),
    employee_id: nullable(input.employeeId),
    seat_id: nullable(input.seatId),
  };
}

function revalidateMaintenance(id?: string) {
  revalidatePath("/maintenance");
  if (id) {
    revalidatePath(`/maintenance/${id}`);
  }
  revalidatePath("/reports");
  revalidatePath("/");
}

export async function createMaintenanceTicket(
  input: MaintenanceInput,
): Promise<ActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }
  const invalid = validate(input);
  if (invalid) {
    return fail(invalid);
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("maintenance_tickets")
    .insert({
      ...payload(input),
      reference: makeReference(),
      closed_at: isClosedStatus(input.status) ? now : null,
    })
    .select("id")
    .single();

  if (error) {
    return fail(error.message);
  }
  revalidateMaintenance(data?.id);
  return { ok: true };
}

export async function updateMaintenanceTicket(
  id: string,
  input: MaintenanceInput,
): Promise<ActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }
  if (!id) {
    return fail("Ticket introuvable.");
  }
  const invalid = validate(input);
  if (invalid) {
    return fail(invalid);
  }

  const supabase = await createClient();

  const { data: current, error: readError } = await supabase
    .from("maintenance_tickets")
    .select("status, closed_at")
    .eq("id", id)
    .maybeSingle();
  if (readError) {
    return fail(readError.message);
  }
  if (!current) {
    return fail("Ticket introuvable.");
  }

  const now = new Date().toISOString();
  let closedAt: string | null;
  if (isClosedStatus(input.status)) {
    closedAt = current.closed_at ?? now;
  } else {
    closedAt = null;
  }

  const { error } = await supabase
    .from("maintenance_tickets")
    .update({ ...payload(input), closed_at: closedAt })
    .eq("id", id);

  if (error) {
    return fail(error.message);
  }
  revalidateMaintenance(id);
  return { ok: true };
}

export async function setMaintenanceStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }
  if (!id) {
    return fail("Ticket introuvable.");
  }
  if (!(MAINTENANCE_STATUS_CODES as string[]).includes(status)) {
    return fail("Statut de ticket inconnu.");
  }

  const supabase = await createClient();
  const { data: current, error: readError } = await supabase
    .from("maintenance_tickets")
    .select("closed_at")
    .eq("id", id)
    .maybeSingle();
  if (readError) {
    return fail(readError.message);
  }
  if (!current) {
    return fail("Ticket introuvable.");
  }

  const now = new Date().toISOString();
  const closedAt = isClosedStatus(status) ? current.closed_at ?? now : null;

  const { error } = await supabase
    .from("maintenance_tickets")
    .update({ status, closed_at: closedAt })
    .eq("id", id);

  if (error) {
    return fail(error.message);
  }
  revalidateMaintenance(id);
  return { ok: true };
}
