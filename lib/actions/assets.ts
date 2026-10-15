"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { ensureEditor, fail, type ActionResult } from "@/lib/actions/common";

export type AssetInput = {
  assetTag: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  assetType: string;
  os: string;
  status: string;
  notes: string;
};

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function friendlyError(message: string): string {
  if (message.includes("duplicate key") || message.includes("pc_assets_asset_tag")) {
    return "Ce numéro d'inventaire est déjà utilisé par un autre équipement.";
  }
  return message;
}

function validate(input: AssetInput): string | null {
  if (!input.assetTag.trim() && !input.serialNumber.trim()) {
    return "Renseignez au moins un numéro d'inventaire ou un numéro de série.";
  }
  return null;
}

function revalidateAssets(id?: string) {
  revalidatePath("/assets");
  if (id) {
    revalidatePath(`/assets/${id}`);
  }
  revalidatePath("/cluster");
  revalidatePath("/reports");
  revalidatePath("/");
}

export async function createPcAsset(input: AssetInput): Promise<ActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }
  const invalid = validate(input);
  if (invalid) {
    return fail(invalid);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pc_assets")
    .insert({
      asset_tag: nullable(input.assetTag),
      serial_number: nullable(input.serialNumber),
      manufacturer: nullable(input.manufacturer),
      model: nullable(input.model),
      asset_type: nullable(input.assetType),
      os: nullable(input.os),
      status: input.status || "UNKNOWN",
      notes: nullable(input.notes),
    })
    .select("id")
    .single();

  if (error) {
    return fail(friendlyError(error.message));
  }
  revalidateAssets(data?.id);
  return { ok: true };
}

export async function updatePcAsset(
  id: string,
  input: AssetInput,
): Promise<ActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }
  if (!id) {
    return fail("Équipement introuvable.");
  }
  const invalid = validate(input);
  if (invalid) {
    return fail(invalid);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pc_assets")
    .update({
      asset_tag: nullable(input.assetTag),
      serial_number: nullable(input.serialNumber),
      manufacturer: nullable(input.manufacturer),
      model: nullable(input.model),
      asset_type: nullable(input.assetType),
      os: nullable(input.os),
      status: input.status || "UNKNOWN",
      notes: nullable(input.notes),
    })
    .eq("id", id);

  if (error) {
    return fail(friendlyError(error.message));
  }
  revalidateAssets(id);
  return { ok: true };
}

export async function setPcAssetActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("pc_assets")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    return fail(error.message);
  }
  revalidateAssets(id);
  return { ok: true };
}

export async function assignAssetToSeat(
  pcAssetId: string,
  seatId: string,
): Promise<ActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }
  if (!pcAssetId || !seatId) {
    return fail("Équipement et position sont requis.");
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: seat, error: seatReadError } = await supabase
    .from("seats")
    .select("id, code")
    .eq("id", seatId)
    .maybeSingle();
  if (seatReadError) {
    return fail(seatReadError.message);
  }
  if (!seat) {
    return fail("Position introuvable.");
  }

  const { error: endPreviousError } = await supabase
    .from("assignments")
    .update({ is_active: false, ended_at: now })
    .eq("is_active", true)
    .eq("pc_asset_id", pcAssetId);
  if (endPreviousError) {
    return fail(endPreviousError.message);
  }

  const { error: endSeatError } = await supabase
    .from("assignments")
    .update({ is_active: false, ended_at: now })
    .eq("is_active", true)
    .eq("seat_id", seatId);
  if (endSeatError) {
    return fail(endSeatError.message);
  }

  const { error } = await supabase.from("assignments").insert({
    pc_asset_id: pcAssetId,
    seat_id: seatId,
    is_active: true,
    started_at: now,
  });
  if (error) {
    return fail(error.message);
  }

  const { error: statusError } = await supabase
    .from("pc_assets")
    .update({ status: "IN_USE" })
    .eq("id", pcAssetId);
  if (statusError) {
    return fail(statusError.message);
  }

  const { error: seatStatusError } = await supabase
    .from("seats")
    .update({ status: "OCCUPIED" })
    .eq("id", seatId);
  if (seatStatusError) {
    return fail(seatStatusError.message);
  }

  revalidateAssets(pcAssetId);
  return { ok: true };
}

export async function releaseAsset(pcAssetId: string): Promise<ActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }
  if (!pcAssetId) {
    return fail("Équipement introuvable.");
  }

  const supabase = await createClient();

  const { data: activeRows, error: activeError } = await supabase
    .from("assignments")
    .select("seat_id")
    .eq("is_active", true)
    .eq("pc_asset_id", pcAssetId)
    .not("seat_id", "is", null);
  if (activeError) {
    return fail(activeError.message);
  }
  const seatIds = [
    ...new Set(
      ((activeRows ?? []) as { seat_id: string }[]).map(
        (row) => row.seat_id,
      ),
    ),
  ];

  const now = new Date().toISOString();

  const { error: endError } = await supabase
    .from("assignments")
    .update({ is_active: false, ended_at: now })
    .eq("is_active", true)
    .eq("pc_asset_id", pcAssetId);
  if (endError) {
    return fail(endError.message);
  }

  const { error } = await supabase
    .from("pc_assets")
    .update({ status: "IN_STOCK" })
    .eq("id", pcAssetId);
  if (error) {
    return fail(error.message);
  }

  for (const seatId of seatIds) {
    const { count, error: countError } = await supabase
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("seat_id", seatId);
    if (countError) {
      return fail(countError.message);
    }
    if (count === 0) {
      const { error: resetError } = await supabase
        .from("seats")
        .update({ status: "FREE" })
        .eq("id", seatId)
        .eq("status", "OCCUPIED");
      if (resetError) {
        return fail(resetError.message);
      }
    }
  }

  revalidateAssets(pcAssetId);
  return { ok: true };
}
