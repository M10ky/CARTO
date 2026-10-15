import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { after, before, test } from "node:test";

import {
  createAdminClient,
  createTempUser,
  deleteTempUser,
  getConfig,
  getCookieHeader,
  hasCredentials,
  repoRoot,
  waitForServer,
} from "../helpers.mjs";

const cfg = getConfig();
const enabled = hasCredentials(cfg);
const skip = {
  skip: enabled ? false : "identifiants Supabase absents (.env.local)",
};

const port = process.env.E2E_PORT ?? "3210";
const providedBase = process.env.BASE_URL;
const baseUrl = providedBase ?? `http://localhost:${port}`;

const PROTECTED_ROUTES = [
  "/",
  "/cluster",
  "/assets",
  "/maintenance",
  "/reports",
  "/settings",
  "/import",
  "/recherche",
];

let server = null;
let admin;
const createdUsers = [];

async function fetchText(path, cookie) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    headers: cookie ? { cookie } : undefined,
  });
  return { status: response.status, body: await response.text() };
}

before(async () => {
  if (!enabled) return;
  admin = createAdminClient(cfg);
  if (providedBase) {
    await waitForServer(baseUrl);
    return;
  }
  server = spawn(
    process.execPath,
    [resolve(repoRoot, "node_modules/next/dist/bin/next"), "start", "-p", port],
    { cwd: repoRoot, stdio: "ignore", detached: true },
  );
  server.unref();
  await waitForServer(baseUrl);
});

after(async () => {
  if (!enabled) return;
  if (server?.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      // déjà arrêté
    }
  }
  for (const id of createdUsers) {
    await deleteTempUser(admin, id);
  }
});

test("anonyme : les routes protégées redirigent vers /login", skip, async () => {
  for (const route of PROTECTED_ROUTES) {
    const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
    assert.equal(response.status, 307, `${route} -> ${response.status}`);
    const location = response.headers.get("location") ?? "";
    assert.ok(location.startsWith("/login"), `${route} -> ${location}`);
    assert.ok(
      location.includes("redirectTo="),
      `${route} : redirectTo manquant (${location})`,
    );
  }
});

test("anonyme : /login est accessible", skip, async () => {
  const response = await fetch(`${baseUrl}/login`, { redirect: "manual" });
  assert.equal(response.status, 200);
});

test("VIEWER : pages en lecture, contrôle de création masqué", skip, async () => {
  const viewer = await createTempUser(admin, { role: "VIEWER", tag: "phase9-e2e-viewer" });
  createdUsers.push(viewer.id);
  const cookie = await getCookieHeader(cfg, viewer.email, viewer.password);

  const dashboard = await fetchText("/", cookie);
  assert.equal(dashboard.status, 200);
  assert.ok(dashboard.body.includes("Tableau de bord"));

  const maintenance = await fetchText("/maintenance", cookie);
  assert.equal(maintenance.status, 200);
  assert.ok(maintenance.body.includes("Maintenance"));
  assert.ok(
    !maintenance.body.includes("Nouvelle intervention"),
    "la création de ticket ne doit pas être visible pour un VIEWER",
  );

  const importPage = await fetchText("/import", cookie);
  assert.equal(importPage.status, 200);
  assert.ok(importPage.body.includes("Accès restreint"));

  const settings = await fetchText("/settings", cookie);
  assert.equal(settings.status, 200);
  assert.ok(settings.body.includes("Accès restreint"));
});

test("MANAGER : contrôles d'édition présents", skip, async () => {
  const manager = await createTempUser(admin, { role: "MANAGER", tag: "phase9-e2e-manager" });
  createdUsers.push(manager.id);
  const cookie = await getCookieHeader(cfg, manager.email, manager.password);

  const maintenance = await fetchText("/maintenance", cookie);
  assert.equal(maintenance.status, 200);
  assert.ok(maintenance.body.includes("Nouvelle intervention"));

  const importPage = await fetchText("/import", cookie);
  assert.equal(importPage.status, 200);
  assert.ok(
    importPage.body.includes("Fichier source"),
    "le workbench d'import doit être accessible à un MANAGER",
  );

  const settings = await fetchText("/settings", cookie);
  assert.equal(settings.status, 200);
  assert.ok(
    settings.body.includes("Accès restreint"),
    "la page d'administration doit rester interdite à un MANAGER",
  );
});

test("ADMIN : administration et recherche fonctionnelles", skip, async () => {
  const adminUser = await createTempUser(admin, { role: "ADMIN", tag: "phase9-e2e-admin" });
  createdUsers.push(adminUser.id);
  const cookie = await getCookieHeader(cfg, adminUser.email, adminUser.password);

  const settings = await fetchText("/settings", cookie);
  assert.equal(settings.status, 200);
  assert.ok(settings.body.includes("Utilisateurs et rôles"));
  assert.ok(settings.body.includes("Journal d'audit"));

  const search = await fetchText("/recherche?q=cluster", cookie);
  assert.equal(search.status, 200);
  assert.ok(search.body.includes("Résultats"));
});
