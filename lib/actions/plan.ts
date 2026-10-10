"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type PlanActionResult = { ok: true } | { ok: false; error: string };

async function ensureEditor(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return null;
  }
  return user.id;
}

function fail(error: string): PlanActionResult {
  return { ok: false, error };
}

async function finish(
  error: { message: string } | null,
): Promise<PlanActionResult> {
  if (error) {
    return fail(error.message);
  }
  revalidatePath("/cluster");
  return { ok: true };
}

export async function renameZone(input: {
  zoneId: string;
  name: string;
}): Promise<PlanActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }
  const name = input.name.trim();
  if (!input.zoneId || name.length === 0 || name.length > 80) {
    return fail("Nom de zone invalide (1 à 80 caractères).");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("zones")
    .update({ name })
    .eq("id", input.zoneId);
  return finish(error);
}

export async function renameRow(input: {
  rowId: string;
  label: string;
}): Promise<PlanActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }
  const label = input.label.trim();
  if (!input.rowId || label.length === 0 || label.length > 80) {
    return fail("Libellé de rangée invalide (1 à 80 caractères).");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("zone_rows")
    .update({ label })
    .eq("id", input.rowId);
  return finish(error);
}

export async function updateSeat(input: {
  seatId: string;
  label?: string;
  status?: string;
}): Promise<PlanActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }

  const patch: { label?: string; status?: string } = {};

  if (input.label !== undefined) {
    const label = input.label.trim();
    if (label.length > 40) {
      return fail("Indice de position trop long (40 caractères maximum).");
    }
    patch.label = label;
  }

  if (input.status !== undefined) {
    if (!input.status) {
      return fail("Statut invalide.");
    }
    patch.status = input.status;
  }

  if (Object.keys(patch).length === 0) {
    return fail("Aucune modification demandée.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("seats")
    .update(patch)
    .eq("id", input.seatId);
  return finish(error);
}

export async function moveSeat(input: {
  seatId: string;
  gridRow: number;
  gridCol: string;
}): Promise<PlanActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }

  const gridCol = input.gridCol.toUpperCase();
  if (!input.seatId || !/^[A-Z]{1,2}$/.test(gridCol)) {
    return fail("Colonne cible invalide.");
  }
  if (!Number.isInteger(input.gridRow) || input.gridRow < 1 || input.gridRow > 200) {
    return fail("Ligne cible invalide.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("seats")
    .update({ grid_row: input.gridRow, grid_col: gridCol })
    .eq("id", input.seatId);
  return finish(error);
}
