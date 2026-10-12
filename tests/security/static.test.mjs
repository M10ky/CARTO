import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { test } from "node:test";

import {
  getConfig,
  hasCredentials,
  PROTECTED_TABLES,
  repoRoot,
} from "../helpers.mjs";

const cfg = getConfig();
const rlsMigration = readFileSync(
  resolve(repoRoot, "supabase/migrations/20261009120100_rls_policies.sql"),
  "utf8",
);

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

test("toutes les tables protégées ont RLS activée dans les migrations", () => {
  for (const table of PROTECTED_TABLES) {
    const pattern = new RegExp(
      `alter table public\\.${table}\\s+enable row level security`,
      "i",
    );
    assert.match(
      rlsMigration,
      pattern,
      `RLS non activée pour ${table} dans 20261009120100_rls_policies.sql`,
    );
  }
});

test("aucune migration ne désactive RLS", () => {
  const files = walk(resolve(repoRoot, "supabase/migrations")).filter((f) =>
    f.endsWith(".sql"),
  );
  for (const file of files) {
    assert.doesNotMatch(
      readFileSync(file, "utf8"),
      /disable\s+row\s+level\s+security/i,
      `RLS désactivée dans ${file}`,
    );
  }
});

test(
  "la clé secrète n'est présente dans aucun fichier versionné",
  { skip: !hasCredentials(cfg) ? "clé secrète absente de l'environnement" : false },
  () => {
    const secret = cfg.secretKey;
    const ignored = new Set(["node_modules", ".next", ".git", ".turbo"]);
    const offenders = [];
    const stack = [repoRoot];
    while (stack.length > 0) {
      const dir = stack.pop();
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          if (!ignored.has(entry.name)) stack.push(join(dir, entry.name));
          continue;
        }
        if (entry.name === ".env.local") continue;
        const ext = extname(entry.name).toLowerCase();
        const binary = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".xlsx", ".zip"];
        if (binary.includes(ext)) continue;
        const full = join(dir, entry.name);
        try {
          if (readFileSync(full, "utf8").includes(secret)) offenders.push(full);
        } catch {
          // fichier non lisible en texte : ignoré
        }
      }
    }
    assert.deepEqual(offenders, [], `Clé secrète trouvée dans : ${offenders.join(", ")}`);
  },
);

test(
  "la clé secrète n'apparaît pas dans le bundle client (.next/static)",
  {
    skip: existsSync(resolve(repoRoot, ".next/static"))
      ? !hasCredentials(cfg)
        ? "clé secrète absente de l'environnement"
        : false
      : "build absent (.next/static) — lancer `npm run build` d'abord",
  },
  () => {
    const secret = cfg.secretKey;
    const files = walk(resolve(repoRoot, ".next/static"));
    const offenders = files.filter((file) => readFileSync(file, "utf8").includes(secret));
    assert.deepEqual(offenders, [], `Clé secrète exposée dans : ${offenders.join(", ")}`);
    assert.ok(
      !files.some((file) => readFileSync(file, "utf8").includes("sb_secret_")),
      "Un jeton sb_secret_ est présent dans le bundle client",
    );
  },
);
