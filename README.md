# Cartographie du Cluster CNTO

Application web interne pour la cartographie physique du Cluster CNTO, la gestion des
positions de travail, des collaborateurs, du parc informatique et des opérations de
maintenance.

## Stack

| Domaine | Choix |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4 |
| Cartographie | SVG (architecture prévue : données spatiales / règles métier / rendu / interactions séparés) |
| Backend & données | **Supabase** — PostgreSQL, Supabase Auth, Row Level Security |
| Migrations | SQL versionnées dans `supabase/migrations/` (CLI Supabase) |
| Imports | `.xlsx` et `.csv`, avec aperçu, validation, détection de doublons et confirmation |
| Qualité | ESLint, `tsc --noEmit`, tests (à partir de la Phase 9) |

## Démarrage

```bash
npm install
npm run dev          # http://localhost:3000
```

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run start` | serveur de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | vérification TypeScript stricte |

## Structure

```
app/            routes et pages (App Router)
lib/spatial/    géométrie du plan — données spatiales pures, sans UI
lib/…           fonctionnalités métier, accès données, validateurs, utilitaires
types/          types TypeScript partagés (aucune dépendance d'accès aux données)
supabase/       migrations SQL + configuration (PHASE 4)
components/     composants d'interface (PHASE 2+)
docs/           audit, décisions, procédures
```

Règle d'or : **la géométrie du plan est séparée du rendu** — modifier le thème ne
doit jamais déplacer un poste.

## Sources de référence

| Fichier | Rôle |
|---|---|
| `Feuille de calcul sans titre.xlsx` | **Référence géométrique unique** de la disposition physique |
| `cartographie-cluster.html` | Prototype : source de données + inspiration UI (**pas** de référence de géométrie) |
| `CARTOGRAPHIE DES POSITIONS_CNTO_2025.zip` | Inventaires, maintenance, mapping poste ↔ service |

## Documentation

- [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) — état d'avancement, décisions, problèmes connus
- [`docs/audit-phase0.md`](./docs/audit-phase0.md) — audit des sources et de la disposition
- [`docs/supabase-setup.md`](./docs/supabase-setup.md) — création et sécurisation de la base

## Sécurité

- Les autorisations sont appliquées **en base (RLS)** et **côté serveur**, pas seulement dans l'interface.
- Aucune clé secrète côté navigateur ; `.env*` est gitignoré.
- Les opérations sensibles sont journalisées (PHASE 4+).
