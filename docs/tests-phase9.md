# PHASE 9 — Tests de bout en bout et sécurité

Automatisation des vérifications de sécurité et des parcours HTTP, sans nouvelle
dépendance (runner natif `node --test`). Deux suites :

| Suite | Fichiers | Dépend d'un serveur Next |
|---|---|---|
| Sécurité | `tests/security/*.test.mjs` | non (Supabase en direct + analyse statique) |
| Bout en bout | `tests/e2e/*.test.mjs` | oui (serveur de production lancé automatiquement) |

## 1. Prérequis

- `.env.local` renseigné (`NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`). Sans lui, les
  tests dépendant de la base sont **ignorés** (skip), pas échoués.
- Node.js 20+ (runner `node --test`).
- Un `npm run build` récent pour l'assertion sur le bundle client : `test:e2e`
  le relance lui-même.

## 2. Commandes

```bash
npm test            # sécurité puis bout en bout (test:e2e rebuild)
npm run test:security
npm run test:e2e    # lance `npm run build` au préalable
```

Variables utiles :

- `BASE_URL=http://localhost:3000` : teste un serveur **déjà lancé** au lieu
  d'en démarrer un (utile en développement).
- `E2E_PORT=3210` : port du serveur de production lancé par la suite E2E.

## 3. Aides partagées (`tests/helpers.mjs`)

- chargement de `.env.local` (sans dépendance externe) ;
- clients Supabase : anonyme (clé publishable), `service_role` (clé secrète) et
  session utilisateur (`signInWithPassword`) ;
- capture des **cookies** de session pour les requêtes HTTP ;
- création d'utilisateurs **temporaires** avec rôle, puis suppression ;
- `waitForServer()` pour attendre la disponibilité du serveur.

### Création d'un rôle privilégié temporaire

Le trigger d'inscription crée toujours un profil `VIEWER`, et le trigger
anti-escalade interdit toute promotion. Les tests forcent donc un rôle avec la
clé `service_role` (`delete` + `insert` du profil, sans RLS ni trigger
d'UPDATE), puis se connectent normalement. Les utilisateurs sont **toujours**
supprimés en fin de suite (`after`).

## 4. Couverture sécurité (`tests/security/`)

`rls.test.mjs` :

| Cas | Attendu |
|---|---|
| Anonyme, `SELECT` sur les 11 tables protégées | 0 ligne visible |
| Anonyme, `INSERT` | refusé |
| `VIEWER` : lecture du plan | autorisée |
| `VIEWER` : lecture `audit_log` | 0 ligne |
| `VIEWER` : `INSERT` collaborateur / ticket | refusé |
| `VIEWER` : auto-promotion de rôle / auto-désactivation | refusé (trigger) |
| `MANAGER` : `INSERT` collaborateur + ticket | autorisé |
| `MANAGER` : lecture `audit_log`, `INSERT` profil, changement de rôle | refusé |
| `ADMIN` : lecture `audit_log` + promotion d'un rôle | autorisé |
| Promotion de rôle via la clé serveur | refusé (trigger) |

`static.test.mjs` :

- RLS déclarée sur chaque table dans `20261009120100_rls_policies.sql` ;
- aucune migration ne contient `disable row level security` ;
- la clé secrète n'apparaît dans **aucun fichier versionné** (dépôt parcouru
  hors `node_modules`, `.next`, `.git`, `.turbo`, `.env.local`) ;
- la clé secrète n'apparaît pas dans le bundle client `.next/static`.

## 5. Couverture bout en bout (`tests/e2e/`)

`routes.test.mjs` : démarre `next start` sur `E2E_PORT` (ou réutilise
`BASE_URL`), puis :

| Cas | Attendu |
|---|---|
| Anonyme sur `/`, `/cluster`, `/employees`, `/assets`, `/maintenance`, `/reports`, `/settings`, `/import` | `307` → `/login?redirectTo=…` |
| Anonyme sur `/login` | `200` |
| `VIEWER` sur `/` et `/maintenance` | `200`, en lecture, sans « Nouvelle intervention » |
| `VIEWER` sur `/import` | `200`, message « Accès restreint » |
| `MANAGER` sur `/maintenance` | « Nouvelle intervention » présente |
| `MANAGER` sur `/import` | workbench (« Fichier source ») présent |

## 6. Nettoyage et non-régression

- Aucune donnée de démonstration n'est insérée : les écritures de test sont
  limitées à des enregistrements temporaires (collaborateurs, tickets) supprimés
  ensuite ; les utilisateurs temporaires sont supprimés (cascade sur `profiles`).
- Aucune écriture sur la **géométrie de référence** (`zones`, `zone_rows`,
  `seats`, `plan_annotations`) n'est effectuée par les tests.
- Les tests dépendant de la base sont **ignorés** (skip) si les identifiants sont
  absents, afin que `npm test` reste utilisable hors ligne.

## 7. Limites connues

- Pas d'automatisation navigateur (pas de Playwright) : les parcours sont
  vérifiés au niveau HTTP/rendu, pas au niveau des interactions DOM
  (ouverture de panneaux, soumission de formulaires). Les server actions sont
  couvertes par les tests de sécurité au niveau base.
- Le test « bundle client » ne s'exécute que si `.next/static` existe (après un
  `npm run build`).
