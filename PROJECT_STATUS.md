# PROJECT_STATUS — Application web de cartographie du Cluster CNTO

> Document de reprise de travail. À mettre à jour à la fin de chaque étape.
> En cas d'interruption : repartir de ce fichier **et** de l'état réel du dépôt
> (ne jamais supposer qu'une étape a réussi sans vérification).

---

## État global

| Étape | Statut |
|---|---|
| PHASE 0 — Audit et compréhension | **Validée** |
| PHASE 1 — Arborescence et fondations | **Validée** (voir §Commandes) |
| PHASE 2 — Système visuel | **Réalisée — en attente de validation** |
| PHASE 3 — Analyse et prototype de la cartographie | **Réalisée — en attente de validation** |
| PHASE 4 — Base de données et authentification | **Validée** |
| PHASE 5 — Cartographie interactive connectée | **Validée** |
| PHASE 6 — Collaborateurs et équipements | **Réalisée — en attente de validation** |
| PHASE 7 — Import Excel et CSV | À faire |
| PHASE 8 — Maintenance et rapports | À faire |
| PHASE 9 — Tests de bout en bout et sécurité | À faire |
| PHASE 10 — Déploiement cloud | À faire |

**Étape actuelle :** PHASE 6 réalisée — les modules Collaborateurs et Parc
informatique sont connectés à la base (`employees`, `pc_assets`, `assignments`) :
listes avec recherche/filtres, fiches détaillées, création/modification,
activation/désactivation et affectations (position ↔ collaborateur ↔ équipement).
Validation requise avant la PHASE 7.
Fiche de passation complète : `docs/PASSATION.txt`.

---

## Étapes validées

### PHASE 0 — Audit (validée)
- Fichiers réellement analysés : `Feuille de calcul sans titre.xlsx` (parsing XML),
  `CARTOGRAPHIE DES POSITIONS_CNTO_2025.zip` (18 feuilles HTML), `cartographie-cluster.html`.
- Rapport complet : `docs/audit-phase0.md`.

### PHASE 1 — Fondations (validée)
- Dépôt installable, qui compile, linte et démarre.
- Prisma retiré, Supabase retenu comme base de données.
- Palette « premium dark » posée en tokens CSS.
- 78 fichiers vides + `setup.sh` + `README.md` (erroné) supprimés.

### PHASE 2 — Système visuel (réalisée, en attente de validation)
- Coquille applicative : sidebar (navigation 7 modules, `aria-current`, tiroir
  mobile fermable via Échap / clic / navigation), header (recherche globale
  désactivée, profil « non connecté » assumé).
- Composants communs réutilisables (`Button`, `Field`/`Input`/`Textarea`/`Select`,
  `Badge`, `Panel`, `Table`, `Alert`, `EmptyState`, `Spinner`, `PageHeader`).
- Route group `app/(dashboard)/` : 7 routes (`/`, `/cluster`, `/employees`,
  `/assets`, `/maintenance`, `/reports`, `/settings`) — écrans **provisoires**
  explicitement marqués, **sans aucune donnée fictive**.
- Aucune interaction métier ni appel base de données (réservés Phase 4/5).
- `shadcn` (CLI, inutile au runtime) et `tw-animate-css` retirés du `package.json`.
- **Passation :** `docs/PASSATION.txt` rédigée.

### PHASE 3 — Analyse et prototype de la cartographie (réalisée, en attente de validation)
- Extraction **programmatique** de la géométrie depuis le XML du `.xlsx`
  (cellules, valeurs, remplissages, 65 fusions, ancrages d'images) — aucun relevé manuel.
- `lib/spatial/cluster-layout.ts` : 4 blocs, **671 positions** dessinées,
  16 espaces particuliers (Escalier, Pantry, espaces vides), 59 libellés
  (zones, rangées, ailes), volumétries déclarée/dessinée par zone.
- Prototype SVG `components/cartography/cluster-plan.tsx` : **reproduction aux
  coordonnées Excel exactes** (une cellule = une position), sans aucune donnée métier.
- Écran `/cluster` : prototype + légende + tableau « compteur Excel vs positions dessinées ».
- `AN-Z8` ajoutée à `zone-definitions.ts`.
- Rapport détaillé : `docs/cartographie-phase3.md` (méthode, volumétrie, questions ouvertes).
- **7 zones correspondent exactement** aux compteurs Excel (Z4B, Z8, Z7, Z6, Z5,
  Box 3, Box 4, Box 5) → méthode validée ; écarts expliqués/à trancher pour les autres.

### PHASE 4 — Base de données et authentification (réalisée, en attente de validation)
- Projet Supabase : `https://uzifoigvupiknwimkfce.supabase.co`.
- Dépendances ajoutées : `@supabase/supabase-js`, `@supabase/ssr`.
- **Cartographie entièrement éditable en base** (exigence utilisateur : renommer
  les zones — ex. « Zone 4 » — et déplacer les positions sur le plan) :
  - `zones` (`code`, `name`, `wing`, `kind`, `department`, `color`, `sort_order`) ;
  - `zone_rows` (rangées : `label`, `sort_order`) ;
  - `seats` (`code`, `label`, `kind`, `status`, `grid_row`, `grid_col`, `pos_x`, `pos_y`) ;
  - `plan_annotations` (libellés/indices libres : `label`, `kind`, position, spans).
- Données métier : `employees`, `pc_assets`, `assignments`, `maintenance_tickets`,
  `profiles`, `seat_statuses` (statuts configurables), `audit_log`.
- **RLS activée sur toutes les tables** : lecture `authenticated`, écriture
  `ADMIN`/`MANAGER` (helpers `is_admin()`, `can_edit()`), anti-escalade de rôle,
  journal d'audit en lecture admin seule.
- **Auth** : clients navigateur/serveur (`@supabase/ssr`), `proxy.ts` (ex-middleware)
  de rafraîchissement + protection des routes, page `/login`, action `signIn`/`signOut`,
  profil affiché dans le header (rôle : Administrateur / Gestionnaire / Consultation).
- **Amorce générée** depuis `lib/spatial/cluster-layout.ts` : 16 zones, 93 rangées,
  **671 positions**, 73 annotations (`20261009120300_seed_spatial.sql`).
- Premier utilisateur créé = `ADMIN` automatiquement (trigger `handle_new_user`).
- **Migrations appliquées** au projet via Session pooler (`db push --db-url`) et
  vérifiées : `zones` 16, `zone_rows` 93, `seats` 671, `plan_annotations` 73,
  `seat_statuses` 6 ; accès anonyme refusé (`[]`).
- Premier utilisateur créé : `miokyrakotoarivelo@gmail.com` (profil `ADMIN`).

### PHASE 5 — Cartographie interactive connectée (réalisée, en attente de validation)
- **Lecture base** : `lib/data/spatial.ts` → `getPlanLayout()` lit `zones`,
  `zone_rows`, `seats`, `plan_annotations` et `seat_statuses` via le client serveur
  Supabase (cookies/RLS), mappe snake_case → camelCase (`types/plan.ts`) et lève
  une erreur explicite en cas d'échec.
- **Édition (server actions)** : `lib/actions/plan.ts` — `renameZone`,
  `renameRow`, `updateSeat` (indice + statut), `moveSeat` (ligne/colonne cible).
  Chaque action exige le rôle `ADMIN`/`MANAGER` via `getCurrentUser()`, valide
  les entrées et `revalidatePath("/cluster")`.
- **Plan présentationnel DB-driven** : `components/cartography/cluster-plan.tsx`
  réécrit — bornes calculées dynamiquement depuis `grid_row`/`grid_col`
  (+ spans d'annotations), couleurs de statut issues de `seat_statuses`, overlay
  de cases cliquables en mode déplacement.
- **Vue interactive** : `components/cartography/cluster-viewer.tsx` — sélection
  d'une position, panneau de détail, édition du libellé/statut, mode
  « Déplacer » (clic sur une case cible), éditeur de renommage des zones et des
  rangées ; retours d'état + `router.refresh()`.
- **Écran** `/cluster` : composant serveur qui charge le layout en base, calcule
  la volumétrie réelle (`declaredPositions` vs positions en base) et
  n'autorise l'édition qu'aux rôles habilités (sinon consultation seule).

### PHASE 6 — Collaborateurs et équipements (réalisée, en attente de validation)
- **Types métier** : `types/employee.ts`, `types/asset.ts`, `types/assignment.ts`
  (camelCase, découplés de Supabase).
- **Couche données** : `lib/data/employees.ts` (`listEmployees`, `getEmployeeDetail`,
  `listServices`, `listEmployeeOptions`, `listSeatOptions`),
  `lib/data/assets.ts` (`listPcAssets`, `getPcAssetDetail`, `listAssetTypes`),
  `lib/data/assignments.ts` (`hydrateAssignments` — jointures seat/zone/employé/PC).
- **Actions serveur** : `lib/actions/employees.ts` (`createEmployee`,
  `updateEmployee`, `setEmployeeActive`, `assignSeat`, `endAssignment`),
  `lib/actions/assets.ts` (`createPcAsset`, `updatePcAsset`, `setPcAssetActive`,
  `assignAsset`, `releaseAsset`) + garde de rôle partagée `lib/actions/common.ts`.
- **Écrans** :
  - `/employees` : recherche (nom/matricule/e-mail/service), filtres service et
    statut, liste paginée par base, création.
  - `/employees/[id]` : fiche, édition, activation/désactivation, affectation à
    une position, historique des affectations.
  - `/assets` : recherche (inventaire/série/modèle/système), filtres statut/type/
    activation, liste, création.
  - `/assets/[id]` : fiche, édition, activation/désactivation, affectation à un
    collaborateur, remise en stock, historique.
- **Règle d'affectation** : une position active à la fois par collaborateur, un
  équipement affecté à un seul collaborateur à la fois ; l'affectation met le PC
  « En service », la remise en stock le repasse « En stock ».
- **Migration** `20261009120400_pc_assets_status_check.sql` : contrainte de
  domaine sur `pc_assets.status` (`UNKNOWN`, `IN_USE`, `IN_STOCK`, `MAINTENANCE`,
  `RETIRED`), appliquée via Session pooler.

---

## Fichiers créés ou modifiés (PHASE 1)

**Créés**
- `PROJECT_STATUS.md` — ce fichier.
- `docs/audit-phase0.md` — rapport d'audit Phase 0.
- `docs/supabase-setup.md` — procédure de création/config de la base Supabase.
- `app/layout.tsx` — racine applicative, polices `Inter` + `JetBrains Mono`, metadata FR.
- `app/globals.css` — Tailwind v4 + tokens de la palette (surfaces, texte, états de poste).
- `app/page.tsx` — page d'accueil minimale (provisoire, identifiée comme telle).
- `lib/spatial/zone-definitions.ts` — inventaire des zones, porté depuis `prisma/seed/seed.ts`.
- `types/seat.ts` — `SeatDTO` + `SeatStatus`, découplés de toute librairie d'accès aux données.

**Modifiés**
- `package.json` — Prisma retiré (`prisma`, `@prisma/client`), script `typecheck` ajouté.
- `next.config.ts` — `turbopack.root` posé (warning dû à un `package.json` orphelin dans `~/`).

**Supprimés** (fichiers 0 octet, décision explicite « tout supprimer, recréer à la demande »)
- `setup.sh`, `README.md` (décrivait une livraison Prisma inexistante),
  `prisma/**`, `lib/db/prisma.ts`, `public/templates/modele_import_pc.xlsx` (0 octet),
  `app/(dashboard)/**`, `app/api/**`, `components/**`, `lib/{db,excel,validators,utils,constants}/**`,
  `types/{api,employee,import,pcAsset}.ts`, `app/{layout,page,globals.css}` (vides, réécrits).

---

## Commandes exécutées et résultats (PHASE 1)

| Commande | Résultat |
|---|---|
| `npm install` | ✅ 250 packages — *26 vulnerabilities (4 moderate, 20 high, 2 critical) — à traiter (voir Problèmes connus)* |
| `npm remove prisma @prisma/client` | ✅ plus aucune référence Prisma dans `package.json` |
| `npm run lint` | ✅ exit 0, aucune erreur |
| `npm run typecheck` (=`tsc --noEmit`) | ✅ exit 0, aucune erreur |
| `npm run build` | ✅ Next.js 16.3.1 (Turbopack) — routes `/` et `/_not-found` pré-rendues |
| `npm run dev` + `curl localhost:3000` | ✅ HTTP 200, titre « Cartographie Cluster CNTO » rendu |

---

## Fichiers créés ou modifiés (PHASE 2)

**Créés**
- `docs/PASSATION.txt` — fiche de passation complète du projet.
- `lib/utils/cn.ts` — fusion de classes (`clsx` + `tailwind-merge`).
- `lib/constants/nav.ts` — `NAV_ITEMS` (7 modules) + `findNavItem`.
- `components/ui/button.tsx` — `Button` + `buttonVariants` (cva).
- `components/ui/field.tsx` — `Field`, `Input`, `Textarea`, `Select`.
- `components/ui/badge.tsx` — `Badge` (tons + pastille + icône).
- `components/ui/panel.tsx` — `Panel`, `PanelHeader`, `PanelBody`.
- `components/ui/table.tsx` — primitives de tableau.
- `components/ui/alert.tsx` — `Alert` (info/success/warning/danger).
- `components/ui/empty-state.tsx` — `EmptyState`, `Spinner`.
- `components/layout/page-header.tsx` — en-tête de page.
- `components/layout/module-placeholder.tsx` — écran provisoire réutilisable.
- `components/layout/sidebar.tsx` — navigation latérale.
- `components/layout/header.tsx` — barre supérieure.
- `components/layout/app-shell.tsx` — coquille (sidebar + header + contenu).
- `app/(dashboard)/layout.tsx` — enveloppe `AppShell`.
- `app/(dashboard)/page.tsx` — Tableau de bord (provisoire, Module A).
- `app/(dashboard)/{cluster,employees,assets,maintenance,reports,settings}/page.tsx` — modules B à G (provisoires).

**Modifiés**
- `package.json` — `shadcn` et `tw-animate-css` retirés.

**Supprimés**
- `app/page.tsx` (contenu déplacé vers `app/(dashboard)/page.tsx`).

---

## Commandes exécutées et résultats (PHASE 2)

| Commande | Résultat |
|---|---|
| `npm remove shadcn tw-animate-css` | ✅ dépendances retirées, plus aucune référence |
| `npm run lint` | ✅ exit 0 |
| `npm run typecheck` (=`tsc --noEmit`) | ✅ exit 0 |
| `npm run build` | ✅ Next.js 16.3.1 (Turbopack) — 8 routes pré-rendues (`/`, `/_not-found`, `/assets`, `/cluster`, `/employees`, `/maintenance`, `/reports`, `/settings`) |
| `npm run dev` + `curl` sur les 7 routes | ✅ HTTP 200 partout |

> Remarque : après suppression de `app/page.tsx`, un `.next/` obsolète faisait
> échouer `typecheck` (types de routes générés). Résolu par `rm -rf .next`.

---

## Fichiers créés ou modifiés (PHASE 3)

**Créés**
- `lib/spatial/cluster-layout.ts` — géométrie extraite de l'Excel : `SEAT_ROWS`
  (671 positions), `SPECIAL_AREAS` (escalier, pantry, espaces vides),
  `PLAN_LABELS`, `PLAN_BOUNDS`, `DECLARED_POSITIONS`, `ZONE_LABELS`,
  `drawnSeatsByZone()`, `countSeats()`.
- `components/cartography/cluster-plan.tsx` — prototype de rendu SVG aux
  coordonnées Excel exactes (aucune donnée métier).
- `docs/cartographie-phase3.md` — rapport d'analyse (méthode, volumétrie,
  espaces vides, questions ouvertes).
- `docs/PASSATION.txt` — fiche de passation au format texte (remplace
  `docs/PASSATION.md`).

**Modifiés**
- `app/(dashboard)/cluster/page.tsx` — écran `/cluster` remplacé par le
  prototype + légende + tableau de volumétrie.
- `lib/spatial/zone-definitions.ts` — ajout de la zone `AN-Z8`.

**Supprimés**
- `docs/PASSATION.md` (converti en `docs/PASSATION.txt`).

---

## Commandes exécutées et résultats (PHASE 3)

| Commande | Résultat |
|---|---|
| Extraction `.xlsx` (script temporaire non versionné) | ✅ 671 positions, 65 fusions, 59 libellés, 16 espaces particuliers |
| `npm run lint` | ✅ exit 0 |
| `npm run typecheck` (=`tsc --noEmit`) | ✅ exit 0 |
| `npm run build` | ✅ Next.js 16.3.1 (Turbopack) — 8 routes pré-rendues |
| `npm run dev` + `curl /cluster` | ✅ HTTP 200, plan SVG (710 `rect`) + tableau de volumétrie rendus |

---

## Fichiers créés ou modifiés (PHASE 4)

**Créés**
- `.env.local` (gitignoré) — URL + clé publishable (`NEXT_PUBLIC_*`) + clé secrète serveur.
- `.env.example` — modèle sans secret.
- `supabase/config.toml` — config CLI locale (`supabase init`).
- `supabase/migrations/20261009120000_init_schema.sql` — tables, helpers, triggers, audit.
- `supabase/migrations/20261009120100_rls_policies.sql` — RLS + privilèges.
- `supabase/migrations/20261009120200_seed_statuses.sql` — 6 statuts de poste.
- `supabase/migrations/20261009120300_seed_spatial.sql` — amorce cartographie générée.
- `lib/supabase/env.ts` — lecture/validation des variables d'environnement.
- `lib/supabase/client.ts` — client navigateur.
- `lib/supabase/server.ts` — client serveur (cookies).
- `lib/supabase/admin.ts` — client serveur `SUPABASE_SECRET_KEY` (jamais côté client).
- `lib/supabase/middleware.ts` — rafraîchissement de session + protection.
- `proxy.ts` — convention Next 16 (ex-middleware).
- `lib/auth/session.ts` — `getCurrentUser()` + type `AppUser`.
- `lib/auth/actions.ts` — actions serveur `signIn` / `signOut`.
- `components/auth/login-form.tsx`, `components/auth/sign-out-button.tsx`.
- `app/(auth)/login/page.tsx` — écran de connexion.

**Modifiés**
- `package.json` — ajout `@supabase/supabase-js`, `@supabase/ssr`.
- `.gitignore` — exception `!.env.example`.
- `app/(dashboard)/layout.tsx` — session obligatoire (redirige vers `/login`).
- `components/layout/app-shell.tsx`, `components/layout/header.tsx` — utilisateur + rôle + déconnexion.

---

## Commandes exécutées et résultats (PHASE 4)

| Commande | Résultat |
|---|---|
| `npm install @supabase/supabase-js @supabase/ssr` | ✅ installés |
| `supabase init` | ✅ `supabase/config.toml` créé |
| `supabase link --project-ref uzifoigvupiknwimkfce` | ❌ droits insuffisants pour le compte CLI courant (voir Problèmes #12) |
| Clés testées (`/rest/v1/nonexistent`) | ✅ publishable + secret reconnues (404 PGRST205) |
| `npm run lint` | ✅ exit 0 |
| `npm run typecheck` | ✅ exit 0 |
| `npm run build` | ✅ 11 routes — `/login` + 7 modules dynamiques (`ƒ`) |
| `supabase db push` (Session pooler, IPv4) | ✅ 4 migrations appliquées — `zones` 16, `zone_rows` 93, `seats` 671, `plan_annotations` 73, `seat_statuses` 6 |
| Requêtes REST (clé secrète / publishable) | ✅ données lisibles côté service ; `[]` (refus RLS) côté anonyme |
| Auth : création 1er utilisateur + connexion | ✅ `miokyrakotoarivelo@gmail.com` créé, profil `ADMIN` automatique, token obtenu, 671 positions visibles connecté |
| `npm run dev` + `curl` | ✅ `/login` → 200 (formulaire), `/` (anonyme) → 307 vers `/login` |

---

## Fichiers créés ou modifiés (PHASE 5)

**Créés**
- `types/plan.ts` — `PlanLayout`, `PlanZone`, `PlanRow`, `PlanSeat`,
  `PlanAnnotation`, `PlanStatus`, `WingType` (camelCase, découplés de Supabase).
- `lib/data/spatial.ts` — `getPlanLayout()` (lecture base + mapping).
- `lib/actions/plan.ts` — server actions d'édition (`renameZone`, `renameRow`,
  `updateSeat`, `moveSeat`) + garde de rôle.
- `components/cartography/cluster-viewer.tsx` — vue interactive (sélection,
  édition, déplacement, éditeurs de zone/rangée).

**Modifiés**
- `components/cartography/cluster-plan.tsx` — réécrit en composant
  présentationnel `"use client"` piloté par `layout` (plus d'import statique de
  `cluster-layout`).
- `app/(dashboard)/cluster/page.tsx` — chargement en base + volumétrie réelle +
  passage du rôle (édition/consultation).

---

## Commandes exécutées et résultats (PHASE 5)

| Commande | Résultat |
|---|---|
| `npm run lint` | ✅ exit 0 |
| `npm run typecheck` (`tsc --noEmit`) | ✅ exit 0 |
| `npm run build` | ✅ 11 routes — `/cluster` dynamique (`ƒ`) |
| `curl /cluster` (anonyme) | ✅ 307 vers `/login?redirectTo=%2Fcluster` |
| Test E2E session admin (`/tmp/opencode/e2e-cluster.mjs`, non versionné) | ✅ `/cluster` → 200, plan SVG + volumétrie + indices de positions rendus sur **données réelles** Supabase |
| Secrets absents du bundle | ✅ clé secrète jamais importée côté client |

---

## Fichiers créés ou modifiés (PHASE 6)

**Créés**
- `types/employee.ts`, `types/asset.ts`, `types/assignment.ts`.
- `lib/constants/inventory.ts` — statuts PC + types d'équipement.
- `lib/data/employees.ts`, `lib/data/assets.ts`, `lib/data/assignments.ts`.
- `lib/actions/common.ts` — `ActionResult` + `ensureEditor()`.
- `lib/actions/employees.ts`, `lib/actions/assets.ts`.
- `components/inventory/filter-bar.tsx` — barre de filtres (formulaire GET).
- `components/employees/{employee-form,employee-table,new-employee,seat-assignments,employee-status-toggle}.tsx`.
- `components/assets/{asset-form,asset-table,new-asset,asset-assignments,asset-status-toggle}.tsx`.
- `app/(dashboard)/employees/[id]/page.tsx`.
- `app/(dashboard)/assets/[id]/page.tsx`.
- `supabase/migrations/20261009120400_pc_assets_status_check.sql`.

**Modifiés**
- `app/(dashboard)/employees/page.tsx`, `app/(dashboard)/assets/page.tsx` —
  remplacés (placeholder → écrans connectés).

---

## Commandes exécutées et résultats (PHASE 6)

| Commande | Résultat |
|---|---|
| `npm run lint` | ✅ exit 0 |
| `npm run typecheck` (`tsc --noEmit`) | ✅ exit 0 |
| `npm run build` | ✅ 13 routes — `/employees/[id]`, `/assets/[id]` ajoutées |
| `supabase db push` (Session pooler) | ✅ migration `pc_assets_status_check` appliquée |
| `curl /employees`, `/assets` (anonyme) | ✅ 307 vers `/login?redirectTo=…` |
| Test E2E admin (`/tmp/opencode/e2e-phase6.mjs`, non versionné) | ✅ `/employees` et `/assets` → 200 (formulaires de création + états vides) |
| RPC `is_admin` / `can_edit` (token admin) | ✅ `true` / `true` — écriture autorisée par RLS |

> Les flux d'écriture (création, affectation) sont vérifiés par les types et par
> la RLS (`can_edit()` = `true`) ; ils n'ont pas encore été exercés sur des
> données réelles faute de données métier dans la base (import prévu en Phase 7).

---

## Décisions d'architecture déjà prises

1. **Base de données : Supabase** (Postgres + Supabase Auth + RLS). Prisma abandonné —
   aucun schéma n'avait été écrit, coût de bascule nul.
2. **Accès données** : `@supabase/supabase-js` + `@supabase/ssr` (session en cookies App Router) —
   installés en **PHASE 4**. Deux clés : publishable côté navigateur, secrète côté serveur uniquement.
3. **Migrations** : SQL versionnées dans `supabase/migrations/`, appliquées via la **CLI Supabase
   liée au projet cloud** (`supabase init` → `link` → `migration new` → `db push`),
   SQL Editor en solution de repli. Pas de Docker requis.
4. **Référence géométrique unique** : `Feuille de calcul sans titre.xlsx`.
   `cartographie-cluster.html` ne sert que de **source de données** (noms de zones, codes,
   totaux) et d'**inspiration UI**. Sa génération `Math.ceil(total / rows)` (grille générique,
   noms fictifs, tags `RAJOUT` artificiels) **ne sera pas reprise**.
5. **Identifiants spatiaux** : codes stables `{AILE}-Z{n}` repris de `Mapping.html`
   (`AN_Z1`, `AS-ZOP`, `C-BOX3`…), complétés en Phase 3 par `{code}-R{rangée}-{index}`.
6. **Thème** : sombre premium par défaut, tokens en variables CSS
   (`app/globals.css`) — un thème clair pourra être ajouté sans toucher à la géométrie du plan.
7. **Couleurs d'état** : 6 états (`OCCUPIED`, `FREE`, `UNAVAILABLE`, `DAMAGED`,
   `MOVE_PLANNED`, `TO_VERIFY`) — jamais l'information seule par la couleur
   (toujours icône + libellé + motif). Valeurs à rendre configurables en base.
8. **Arborescence** : pas de fichiers vides prématurés — chaque fichier est créé
   au moment où son étape le nécessite.
9. **Composants d'interface (Phase 2)** : composants maison pilotés par variantes
   (`cva`) pour les primitives simples ; `@base-ui/react` (déjà installé) réservé
   aux primitives complexes nécessitant accessibilité et gestion du focus
   (dialogue, menu, sélecteur) en Phases 4+.
10. **Géométrie (Phase 3)** : la disposition **dessinée** dans l'Excel fait foi
   pour le plan ; les compteurs d'en-tête sont conservés séparément comme
   métadonnée (`DECLARED_POSITIONS`). Le plan est stocké en coordonnées Excel
   (`lib/spatial/cluster-layout.ts`) et rendu tel quel (une cellule = une
   position). Les données métier resteront totalement séparées de cette géométrie.
11. **Cartographie éditable (Phase 4)** : les zones, rangées, positions et
   annotations sont des **données en base** (pas de constantes figées) afin de
   pouvoir renommer une zone (« Zone 4 »…) et déplacer une position sur le plan
   sans changer le code. `lib/spatial/cluster-layout.ts` ne sert plus qu'à
   l'amorçage initial. Le rendu lit la base à partir de la Phase 5.
12. **Source de vérité** : le dépôt Git contient les **migrations** ; le projet
    Supabase n'est qu'une copie appliquée (`supabase db push`).
13. **Édition de la cartographie (Phase 5)** : toute modification passe par des
    **server actions** (`lib/actions/plan.ts`) autorisées uniquement aux rôles
    `ADMIN`/`MANAGER` (défense côté code **et** RLS côté base), puis
    `revalidatePath("/cluster")`. Le rendu est un composant **présentationnel**
    piloté par les données ; la géométrie vient de `grid_row`/`grid_col`
    (coordonnées Excel) — déplacer une position = mettre à jour ses coordonnées.
    Les colonnes `pos_x`/`pos_y` restent réservées à un placement libre ultérieur.
14. **Affectations (Phase 6)** : la table `assignments` sert de jonction entre une
    position, un collaborateur et un équipement. Règles appliquées : une position
    active à la fois par collaborateur, un équipement affecté à un seul
    collaborateur à la fois (les affectations précédentes sont clôturées via
    `is_active = false` + `ended_at`). Aucune donnée métier de démonstration
    n'est insérée ; les listes vides sont assumées.

---

## Problèmes connus

| # | Problème | Impact | Prévu à |
|---|---|---|---|
| 1 | `npm install` remonte **26 vulnérabilities (2 critiques)**, très probablement liées à `xlsx@0.18.5` (ancienne version npm, package déprécié côté SheetJS) | sécurité import | Phase 7 — remplacer par `xlsx` (SheetJS CDN/EE) ou `exceljs` / `read-excel-file` |
| 2 | Dossier `~/package.json` + `~/package-lock.json` **orphelins hors dépôt** | warnings Turbopack | atténué via `turbopack.root` ; à supprimer côté utilisateur si acceptable |
| 3 | `skills/`, `.claude/skills/`, `.windsurf/skills/` contiennent la **documentation Prisma** alors que Prisma est retiré | bruit, incohérence | à supprimer après accord |
| 4 | ~~`shadcn` figurait dans `dependencies`~~ **Résolu Phase 2** : `shadcn` et `tw-animate-css` retirés | — | résolu |
| 5 | Volumétrie : compteurs Excel **630** vs positions **dessinées 671** (Phase 3) vs prototype 631 vs `Récap IT` 627 DESKTOP | modèle de données | **Phase 3** : extraction faite, écarts par zone documentés (`docs/cartographie-phase3.md`) — arbitrage utilisateur requis |
| 6 | La **légende colorée du .xlsx est illisible** (pastilles sans remplissage dans le fichier) | correspondance statut ↔ couleur | arbitré : palette maison premium (décision 7) |
| 7 | **3 zones portent le nom `ZONE 4`** dans l'Excel (`C11`, `P11`, `AI11`) | unicité des noms | codes stables `AN-Z4A` / `AN-Z4B` / `AS-Z4` déjà posés |
| 8 | Orientation des rangées du **bloc central (lignes 25-34, libellés fusionnés à la ligne 34)** | géométrie | **Phase 3** : isolé en `AN-Z9` / `AN-CENTRAL` — validation visuelle utilisateur requise |
| 9 | **Grandes fusions vides** (`P45:U56`, `W45:Z56`, `AB45:AE56`, `Z61:AE71`, `AB73:AE82`, `R80:V81`, `X80:Z81`…) : salle / mobilier / espace vide ? | géométrie | **Phase 3** : traitées comme espaces vides (`SPECIAL_AREAS` kind `OPEN`) — à confirmer |
| 10 | **23 ancrages d'images** pour seulement **6 PNG** réutilisés (`image1`…`image6`) | restitution visuelle | **Phase 3** : identifiés ; nature (portes, escaliers, mobilier ?) **à identifier** |
| 11 | **Zone 9** : compteur **90** vs **41** positions dessinées (écart −49) | modèle de données | **Phase 3** : écart le plus important — arbitrage utilisateur requis |
| 12 | ~~`supabase link` échoue (compte CLI sans droits)~~ **Contourné Phase 4** : `supabase db push --db-url` via **Session pooler** `aws-0-eu-west-1.pooler.supabase.com` (direct `db.*` = IPv6 injoignable) | — | résolu |
| 13 | Clé **publishable** renvoie `401` sur la racine `/rest/v1/` mais fonctionne sur une table (`PGRST205`) et sur `/auth/v1/health` | aucune (faux positif) | — |

---

## Prochaines actions

1. **Valider la PHASE 6** (collaborateurs + parc informatique : listes,
   recherche/filtres, fiches, création/modification, affectations).
2. **PHASE 7 — Import Excel et CSV** : import des collaborateurs et du parc
   depuis les fichiers de référence, aperçu, rapport d'erreurs ; remplacer
   `xlsx@0.18.5` (voir Problème #1).
3. **PHASE 8 — Maintenance et rapports** : tickets (`maintenance_tickets`) et
   statistiques.
4. Arbitrages restants : questions géométriques Phase 3 (`docs/cartographie-phase3.md` §6) ;
   suppression des dossiers `skills/` Prisma.
