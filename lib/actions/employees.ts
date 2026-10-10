"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { ensureEditor, fail, type ActionResult } from "@/lib/actions/common";

export type EmployeeInput = {
  matricule: string;
  firstName: string;
  lastName: string;
  service: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
};

function normalize(value: string): string {
  return value.trim();
}

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function friendlyError(message: string): string {
  if (message.includes("duplicate key")) {
    return "Ce matricule est déjà utilisé par un autre collaborateur.";
  }
  if (message.includes("employees_matricule")) {
    return "Ce matricule est déjà utilisé par un autre collaborateur.";
  }
  return message;
}

function validate(input: EmployeeInput): string | null {
  if (!normalize(input.firstName) && !normalize(input.lastName)) {
    return "Renseignez au moins un nom ou un prénom.";
  }
  if (input.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email.trim())) {
    return "Adresse e-mail invalide.";
  }
  return null;
}

function revalidateEmployees(id?: string) {
  revalidatePath("/employees");
  if (id) {
    revalidatePath(`/employees/${id}`);
  }
  revalidatePath("/cluster");
  revalidatePath("/");
}

export async function createEmployee(
  input: EmployeeInput,
): Promise<ActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }
  const invalid = validate(input);
  if (invalid) {
    return fail(invalid);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .insert({
      matricule: nullable(input.matricule),
      first_name: nullable(input.firstName),
      last_name: nullable(input.lastName),
      service: nullable(input.service),
      job_title: nullable(input.jobTitle),
      email: nullable(input.email),
      phone: nullable(input.phone),
      location: nullable(input.location),
    })
    .select("id")
    .single();

  if (error) {
    return fail(friendlyError(error.message));
  }
  revalidateEmployees(data?.id);
  return { ok: true };
}

export async function updateEmployee(
  id: string,
  input: EmployeeInput,
): Promise<ActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }
  if (!id) {
    return fail("Collaborateur introuvable.");
  }
  const invalid = validate(input);
  if (invalid) {
    return fail(invalid);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({
      matricule: nullable(input.matricule),
      first_name: nullable(input.firstName),
      last_name: nullable(input.lastName),
      service: nullable(input.service),
      job_title: nullable(input.jobTitle),
      email: nullable(input.email),
      phone: nullable(input.phone),
      location: nullable(input.location),
    })
    .eq("id", id);

  if (error) {
    return fail(friendlyError(error.message));
  }
  revalidateEmployees(id);
  return { ok: true };
}

export async function setEmployeeActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    return fail(error.message);
  }
  revalidateEmployees(id);
  return { ok: true };
}

export async function assignSeat(
  employeeId: string,
  seatId: string,
): Promise<ActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }
  if (!employeeId || !seatId) {
    return fail("Collaborateur et position sont requis.");
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error: seatError } = await supabase
    .from("assignments")
    .update({ is_active: false, ended_at: now })
    .eq("is_active", true)
    .eq("seat_id", seatId);
  if (seatError) {
    return fail(seatError.message);
  }

  const { error: previousError } = await supabase
    .from("assignments")
    .update({ is_active: false, ended_at: now })
    .eq("is_active", true)
    .eq("employee_id", employeeId)
    .not("seat_id", "is", null);
  if (previousError) {
    return fail(previousError.message);
  }

  const { error } = await supabase.from("assignments").insert({
    employee_id: employeeId,
    seat_id: seatId,
    is_active: true,
    started_at: now,
  });
  if (error) {
    return fail(error.message);
  }

  revalidateEmployees(employeeId);
  return { ok: true };
}

export async function endAssignment(id: string): Promise<ActionResult> {
  if (!(await ensureEditor())) {
    return fail("Action réservée aux administrateurs et gestionnaires.");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("assignments")
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return fail(error.message);
  }
  revalidateEmployees();
  return { ok: true };
}
