# Configuration de la base Supabase

*Décision d'architecture : **Supabase** (Postgres + Supabase Auth + Row Level Security).
Prisma a été retiré du projet. **PHASE 4 : schéma, RLS et Auth implémentés ;
migrations à appliquer.***

---

## 1. Projet retenu

- Nom : *Connecteo* — projet `uzifoigvupiknwimkfce`.
- URL : `https://uzifoigvupiknwimkfce.supabase.co`
- Région : West EU (Ireland).

## 2. Récupérer les identifiants

| Élément | Où | Usage |
|---|---|---|
| `Project URL` | Settings → API | point d'entrée de l'API |
| clé **publishable** `sb_publishable_…` | Settings → API Keys | **côté navigateur**, protégée par les politiques RLS |
| clé **secrète** `sb_secret_…` | Settings → API Keys | **côté serveur uniquement** — jamais exposée au client, jamais commitée |
| Connection string (Session pooler) | Settings → Database | migrations SQL si la machine n'a pas d'IPv6 |

> L'application parle à Postgres via **PostgREST** (`supabase-js`) : aucune connexion
> TCP directe n'est nécessaire pour faire tourner Next.js. Le pooler ne sert qu'aux
> migrations.

## 3. Authentification

- **Authentication → Providers → Email** : activer.
- **Authentication → URL Configuration** :
  - `Site URL` = `http://localhost:3000`
  - *Redirect URLs* : `http://localhost:3000/**`
  - l'URL de production sera ajoutée en **PHASE 10**.
- **Premier utilisateur** : créer un compte (Authentication → Users → Add user) ;
  le trigger `handle_new_user` lui attribue le rôle `ADMIN`. Les suivants sont `VIEWER`.

## 4. Créer le schéma (migrations versionnées)

Méthode retenue : **CLI Supabase liée au projet cloud** (pas de Docker requis).

```bash
supabase init                                  # crée supabase/config.toml
supabase link --project-ref uzifoigvupiknwimkfce
supabase db push                               # applique supabase/migrations/*.sql
```

Si `link` échoue (compte sans droits) ou sans IPv6, pousser via la chaîne de
connexion (mot de passe DB requis). L'hôte direct `db.<ref>.supabase.co` n'étant
qu'IPv6, utiliser le **Session pooler** `aws-0-eu-west-1.pooler.supabase.com` :

```bash
supabase db push --db-url "postgresql://postgres.uzifoigvupiknwimkfce:<MDP>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

> **Déjà appliqué** : les 4 migrations de `supabase/migrations/` sont en place sur
> le projet (`zones` 16, `zone_rows` 93, `seats` 671, `plan_annotations` 73,
> `seat_statuses` 6). Le mot de passe DB n'est conservé dans aucun fichier.

**Repli sans CLI** : coller les fichiers dans **SQL Editor → Run**, dans l'ordre
des timestamps, tout en gardant `supabase/migrations/` comme source de vérité.

## 5. Règles de sécurité écrites dans les migrations

- `ENABLE ROW LEVEL SECURITY` sur **chaque** table (`20261009120100_rls_policies.sql`).
  **Pas de policy = refus par défaut**, jamais de `DISABLE`.
- Lecture : policy `SELECT` pour `authenticated`.
- Écriture : `INSERT`/`UPDATE`/`DELETE` réservées à `ADMIN`/`MANAGER` via les
  helpers `public.is_admin()` et `public.can_edit()`.
- Anti-escalade de rôle : trigger `prevent_profile_privilege_change` sur `profiles`.
- Journal `audit_log` alimenté par trigger `SECURITY DEFINER`, lisible par les admins.
- La clé secrète ne transite jamais côté navigateur.

## 6. Variables d'environnement

Fichier `.env.local` (**gitignoré** via le motif `.env*`, `.env.example` versionné) :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://uzifoigvupiknwimkfce.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
SUPABASE_SECRET_KEY=sb_secret_…            # SEULEMENT côté serveur
```

## 7. Dépendances installées en PHASE 4

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- `@supabase/supabase-js` : client de données (PostgREST).
- `@supabase/ssr` : session Supabase **en cookies** dans Next.js App Router
  (clients serveur + navigateur, rafraîchissement via `proxy.ts`).

## 8. Vérifications de sécurité à passer (PHASE 4 et PHASE 9)

1. Depuis un navigateur connecté avec un compte `VIEWER` : tentative d'`UPDATE` → **refus**.
2. Sans session : accès `/` → redirection vers `/login`.
3. La clé secrète n'apparaît dans aucun bundle client (`grep` sur `.next/static`).
4. Chaque table a bien `rowsecurity = true` dans `pg_tables`.

## 9. Schéma des tables

- Cartographie éditable : `zones`, `zone_rows`, `seats`, `plan_annotations`.
- Référentiels : `seat_statuses`, `profiles`.
- Métier : `employees`, `pc_assets`, `assignments`, `maintenance_tickets`.
- Traçabilité : `audit_log`.
- Amorçage : `20261009120300_seed_spatial.sql` (16 zones, 93 rangées, 671 positions).
