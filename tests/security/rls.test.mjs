import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import {
  createAdminClient,
  createAnonClient,
  createTempUser,
  createUserSession,
  deleteTempUser,
  getConfig,
  hasCredentials,
  PROTECTED_TABLES,
  uniqueTag,
} from "../helpers.mjs";

const cfg = getConfig();
const enabled = hasCredentials(cfg);
const skip = {
  skip: enabled ? false : "identifiants Supabase absents (.env.local)",
};

let admin;
const created = { users: [], assets: [], tickets: [] };

before(() => {
  if (enabled) admin = createAdminClient(cfg);
});

after(async () => {
  if (!enabled) return;
  for (const id of created.tickets) {
    await admin.from("maintenance_tickets").delete().eq("id", id);
  }
  for (const id of created.assets) {
    await admin.from("pc_assets").delete().eq("id", id);
  }
  for (const id of created.users) {
    await deleteTempUser(admin, id);
  }
});

test("anonyme : aucune lecture sur les tables protégées", skip, async () => {
  const anon = createAnonClient(cfg);
  for (const table of PROTECTED_TABLES) {
    const { data } = await anon.from(table).select("id").limit(1);
    const rows = data ?? [];
    assert.equal(
      rows.length,
      0,
      `${table} : ${rows.length} ligne(s) visible(s) sans session`,
    );
  }
});

test("anonyme : écriture refusée", skip, async () => {
  const anon = createAnonClient(cfg);
  const { error } = await anon
    .from("pc_assets")
    .insert({ asset_tag: uniqueTag("anon") });
  assert.ok(error, "un INSERT anonyme aurait dû être refusé");
});

test("VIEWER : lecture autorisée, écriture et escalade refusées", skip, async () => {
  const viewer = await createTempUser(admin, { role: "VIEWER", tag: "phase9-viewer" });
  created.users.push(viewer.id);
  const session = await createUserSession(cfg, viewer.email, viewer.password);

  const zones = await session.from("zones").select("code").limit(1);
  assert.equal(zones.error, null, zones.error?.message);
  assert.equal((zones.data ?? []).length, 1, "le VIEWER doit pouvoir lire le plan");

  const audit = await session.from("audit_log").select("id").limit(1);
  assert.equal(
    (audit.data ?? []).length,
    0,
    "le VIEWER ne doit pas lire le journal d'audit",
  );

  const own = await session
    .from("profiles")
    .select("role")
    .eq("id", viewer.id)
    .maybeSingle();
  assert.equal(own.data?.role, "VIEWER");

  const insAsset = await session
    .from("pc_assets")
    .insert({ asset_tag: uniqueTag("viewer") })
    .select();
  assert.ok(insAsset.error, "un VIEWER ne doit pas créer d'équipement");

  const insTicket = await session
    .from("maintenance_tickets")
    .insert({ title: uniqueTag("viewer") })
    .select();
  assert.ok(insTicket.error, "un VIEWER ne doit pas créer de ticket");

  const escalate = await session
    .from("profiles")
    .update({ role: "ADMIN" })
    .eq("id", viewer.id)
    .select();
  assert.ok(escalate.error, "l'auto-promotion doit être refusée par le trigger");

  const selfDisable = await session
    .from("profiles")
    .update({ is_active: false })
    .eq("id", viewer.id)
    .select();
  assert.ok(selfDisable.error, "un VIEWER ne doit pas s'auto-désactiver");
});

test("MANAGER : écriture métier autorisée, administration refusée", skip, async () => {
  const manager = await createTempUser(admin, { role: "MANAGER", tag: "phase9-manager" });
  created.users.push(manager.id);
  const session = await createUserSession(cfg, manager.email, manager.password);

  const asset = await session
    .from("pc_assets")
    .insert({ asset_tag: uniqueTag("mgr") })
    .select()
    .single();
  assert.equal(asset.error, null, asset.error?.message);
  created.assets.push(asset.data.id);

  const ticket = await session
    .from("maintenance_tickets")
    .insert({ title: uniqueTag("mgr") })
    .select()
    .single();
  assert.equal(ticket.error, null, ticket.error?.message);
  created.tickets.push(ticket.data.id);

  const audit = await session.from("audit_log").select("id").limit(1);
  assert.equal(
    (audit.data ?? []).length,
    0,
    "le MANAGER ne doit pas lire le journal d'audit",
  );

  const promote = await session
    .from("profiles")
    .update({ role: "ADMIN" })
    .eq("id", manager.id)
    .select();
  assert.ok(promote.error, "même un MANAGER ne peut pas modifier un rôle");

  const insertProfile = await session
    .from("profiles")
    .insert({ id: crypto.randomUUID(), role: "VIEWER" })
    .select();
  assert.ok(insertProfile.error, "la création de profil est réservée aux admins");
});

test("ADMIN : lecture du journal et gestion des rôles", skip, async () => {
  const adminUser = await createTempUser(admin, { role: "ADMIN", tag: "phase9-admin" });
  created.users.push(adminUser.id);
  const session = await createUserSession(cfg, adminUser.email, adminUser.password);

  const audit = await session.from("audit_log").select("id").limit(1);
  assert.equal(audit.error, null, audit.error?.message);

  const target = await createTempUser(admin, { role: "VIEWER", tag: "phase9-target" });
  created.users.push(target.id);

  const promote = await session
    .from("profiles")
    .update({ role: "MANAGER" })
    .eq("id", target.id)
    .select()
    .single();
  assert.equal(promote.error, null, promote.error?.message);
  assert.equal(promote.data.role, "MANAGER");
});

test("anti-escalade : refusée même via la clé serveur", skip, async () => {
  const victim = await createTempUser(admin, { role: "VIEWER", tag: "phase9-victim" });
  created.users.push(victim.id);

  const { error } = await admin
    .from("profiles")
    .update({ role: "ADMIN" })
    .eq("id", victim.id)
    .select();
  assert.ok(error, "le trigger doit aussi bloquer une promotion via service_role");

  const check = await admin
    .from("profiles")
    .select("role")
    .eq("id", victim.id)
    .maybeSingle();
  assert.equal(check.data?.role, "VIEWER");
});
