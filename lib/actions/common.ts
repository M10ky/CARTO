import { getCurrentUser } from "@/lib/auth/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function ensureEditor(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return null;
  }
  return user.id;
}

export function fail(error: string): ActionResult {
  return { ok: false, error };
}
