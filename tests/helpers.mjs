import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const here = dirname(fileURLToPath(import.meta.url));

export const repoRoot = resolve(here, "..");

export const PROTECTED_TABLES = [
  "profiles",
  "seat_statuses",
  "zones",
  "zone_rows",
  "seats",
  "plan_annotations",
  "employees",
  "pc_assets",
  "assignments",
  "maintenance_tickets",
  "audit_log",
];

export function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(resolve(repoRoot, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      const quoted =
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"));
      if (quoted) value = value.slice(1, -1);
      if (env[key] === undefined) env[key] = value;
    }
  } catch {
    // .env.local absent : on utilise l'environnement du shell.
  }
  return env;
}

export function getConfig() {
  const env = loadEnv();
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    secretKey: env.SUPABASE_SECRET_KEY,
  };
}

export function hasCredentials(cfg) {
  return Boolean(cfg.url && cfg.publishableKey && cfg.secretKey);
}

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};

export function createAdminClient(cfg) {
  return createClient(cfg.url, cfg.secretKey, clientOptions);
}

export function createAnonClient(cfg) {
  return createClient(cfg.url, cfg.publishableKey, clientOptions);
}

export async function createUserSession(cfg, email, password) {
  const client = createAnonClient(cfg);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Connexion impossible : ${error.message}`);
  return client;
}

export async function getCookieHeader(cfg, email, password) {
  const jar = [];
  const supabase = createServerClient(cfg.url, cfg.publishableKey, {
    cookies: {
      getAll: () => [],
      setAll: (list) => {
        for (const cookie of list) jar.push(`${cookie.name}=${cookie.value}`);
      },
    },
  });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Session cookie impossible : ${error.message}`);
  return jar.join("; ");
}

export function uniqueTag(prefix = "phase9") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Force un rôle autre que VIEWER : le trigger d'inscription crée toujours un
// profil VIEWER, et l'anti-escalade interdit la promotion. On contourne via le
// service_role (delete + insert, sans trigger d'UPDATE ni RLS).
export async function setRoleDirect(admin, id, email, role) {
  const del = await admin.from("profiles").delete().eq("id", id);
  if (del.error) throw del.error;
  const ins = await admin.from("profiles").insert({ id, email, role });
  if (ins.error) throw ins.error;
}

export async function createTempUser(admin, { role = "VIEWER", tag = "phase9" } = {}) {
  const email = `${uniqueTag(tag)}@example.com`;
  const password = `Tmp-${Math.random().toString(36).slice(2)}-2026!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  const id = data.user.id;
  if (role !== "VIEWER") {
    await setRoleDirect(admin, id, email, role);
  }
  return { id, email, password, role };
}

export async function deleteTempUser(admin, id) {
  await admin.auth.admin.deleteUser(id);
}

export function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

export async function waitForServer(baseUrl, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/login`, { redirect: "manual" });
      if (response.status < 500) return true;
    } catch {
      // serveur pas encore prêt
    }
    await sleep(500);
  }
  throw new Error(`Serveur indisponible sur ${baseUrl} après ${timeoutMs} ms`);
}
