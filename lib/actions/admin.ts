"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  ensureAdmin,
  ensureEditor,
  fail,
  type ActionResult,
} from "@/lib/actions/common";

const VALID_ROLES = ["ADMIN", "MANAGER", "VIEWER"] as const;
type Role = (typeof VALID_ROLES)[number];

function normalizeSeatStatusCode(code: string): string | null {
  const normalized = code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return normalized.length > 0 ? normalized : null;
}

export async function updateUserRole(params: {
  userId: string;
  role: string;
}): Promise<ActionResult> {
  const actorId = await ensureAdmin();
  const role = params.role;
  if (!actorId) {
    return fail("Accès réservé aux administrateurs.");
  }
  if (!VALID_ROLES.includes(role as Role)) {
    return fail("Rôle invalide.");
  }
  if (actorId === params.userId) {
    return fail("Vous ne pouvez pas modifier votre propre rôle.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", params.userId);

  if (error) {
    return fail(`Changement de rôle impossible : ${error.message}`);
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function toggleUserActive(params: {
  userId: string;
  isActive: boolean;
}): Promise<ActionResult> {
  const actorId = await ensureAdmin();
  if (!actorId) {
    return fail("Accès réservé aux administrateurs.");
  }
  if (actorId === params.userId && !params.isActive) {
    return fail("Vous ne pouvez pas désactiver votre propre compte.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: params.isActive })
    .eq("id", params.userId);

  if (error) {
    return fail(`Modification du compte impossible : ${error.message}`);
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function createSeatStatus(params: {
  code: string;
  label: string;
  color: string | null;
  description: string | null;
  sortOrder: number;
}): Promise<ActionResult> {
  const actorId = await ensureAdmin();
  if (!actorId) {
    return fail("Accès réservé aux administrateurs.");
  }

  const code = normalizeSeatStatusCode(params.code);
  if (!code) {
    return fail("Code de statut invalide (lettres, chiffres et tirets bas).");
  }
  const label = params.label.trim();
  if (!label) {
    return fail("Le libellé est obligatoire.");
  }
  if (!Number.isFinite(params.sortOrder)) {
    return fail("Ordre d'affichage invalide.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("seat_statuses").insert({
    code,
    label,
    color: params.color?.trim() || null,
    description: params.description?.trim() || null,
    sort_order: params.sortOrder,
  });

  if (error) {
    if (error.code === "23505") {
      return fail(`Le code « ${code} » existe déjà.`);
    }
    return fail(`Création impossible : ${error.message}`);
  }

  revalidatePath("/settings");
  revalidatePath("/cluster");
  return { ok: true };
}

export async function updateSeatStatus(params: {
  code: string;
  label: string;
  color: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}): Promise<ActionResult> {
  const actorId = await ensureEditor();
  if (!actorId) {
    return fail("Action non autorisée pour votre rôle.");
  }

  const label = params.label.trim();
  if (!label) {
    return fail("Le libellé est obligatoire.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("seat_statuses")
    .update({
      label,
      color: params.color?.trim() || null,
      description: params.description?.trim() || null,
      sort_order: params.sortOrder,
      is_active: params.isActive,
    })
    .eq("code", params.code);

  if (error) {
    return fail(`Enregistrement impossible : ${error.message}`);
  }

  revalidatePath("/settings");
  revalidatePath("/cluster");
  return { ok: true };
}

export async function deleteSeatStatus(params: {
  code: string;
}): Promise<ActionResult> {
  const actorId = await ensureAdmin();
  if (!actorId) {
    return fail("Accès réservé aux administrateurs.");
  }

  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("seats")
    .select("id", { count: "exact", head: true })
    .eq("status", params.code);

  if (countError) {
    return fail(`Vérification impossible : ${countError.message}`);
  }
  if ((count ?? 0) > 0) {
    return fail(
      `Impossible de supprimer « ${params.code} » : ${count} position(s) l'utilisent encore.`,
    );
  }

  const { error } = await supabase
    .from("seat_statuses")
    .delete()
    .eq("code", params.code);

  if (error) {
    return fail(`Suppression impossible : ${error.message}`);
  }

  revalidatePath("/settings");
  revalidatePath("/cluster");
  return { ok: true };
}

export async function saveSetting(params: {
  key: string;
  value: string;
}): Promise<ActionResult> {
  const actorId = await ensureAdmin();
  if (!actorId) {
    return fail("Accès réservé aux administrateurs.");
  }

  const key = params.key.trim();
  if (!key || /[^a-z0-9._-]/i.test(key)) {
    return fail("Clé de paramètre invalide.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("app_settings").upsert({
    key,
    value: params.value,
    updated_by: actorId,
  });

  if (error) {
    return fail(
      `Enregistrement impossible (table « app_settings » indisponible) : ${error.message}`,
    );
  }

  revalidatePath("/settings");
  return { ok: true };
}