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
  revalidatePath("/employees");
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

export async function assignAsset(
  pcAssetId: string,
  employeeId: string,
): Promise<ActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }
  if (!pcAssetId || !employeeId) {
    return fail("Équipement et collaborateur sont requis.");
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error: endError } = await supabase
    .from("assignments")
    .update({ is_active: false, ended_at: now })
    .eq("is_active", true)
    .eq("pc_asset_id", pcAssetId);
  if (endError) {
    return fail(endError.message);
  }

  const { error } = await supabase.from("assignments").insert({
    pc_asset_id: pcAssetId,
    employee_id: employeeId,
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

  revalidateAssets(pcAssetId);
  revalidatePath(`/employees/${employeeId}`);
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

  revalidateAssets(pcAssetId);
  return { ok: true };
}
