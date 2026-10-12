# Phase 8 — Maintenance et rapports

*Suivi des interventions sur le parc (table `maintenance_tickets`) et
statistiques agrégées calculées à partir des données réelles de la base.
Aucune donnée fictive : les écrans assument leurs états vides.*

---

## 1. Ce qui a été produit

| Livrable | Fichier |
|---|---|
| Type de ticket / filtres | `types/maintenance.ts` |
| Statuts et priorités (libellés, tons, règles) | `lib/constants/maintenance.ts` |
| Couche données des tickets | `lib/data/maintenance.ts` |
| Couche données des statistiques | `lib/data/reports.ts` |
| Options d'équipement (formulaire) | `lib/data/assets.ts` (`listAssetOptions`) |
| Server actions | `lib/actions/maintenance.ts` |
| Formulaire de ticket | `components/maintenance/ticket-form.tsx` |
| Bouton + panneau de création | `components/maintenance/new-ticket.tsx` |
| Liste des tickets | `components/maintenance/ticket-table.tsx` |
| Contrôles rapides de statut | `components/maintenance/ticket-status-controls.tsx` |
| Écran liste `/maintenance` (Module E) | `app/(dashboard)/maintenance/page.tsx` |
| Écran fiche `/maintenance/[id]` | `app/(dashboard)/maintenance/[id]/page.tsx` |
| Écran `/reports` (Module F) | `app/(dashboard)/reports/page.tsx` |
| Écran Tableau de bord (Module A) | `app/(dashboard)/page.tsx` |
| Composants de statistiques partagés | `components/overview/stat-card.tsx`, `components/overview/breakdown-list.tsx` |

---

## 2. Modèle de données

La table `maintenance_tickets` existait déjà (créée en Phase 4, RLS active,
lecture `authenticated`, écriture `ADMIN`/`MANAGER` via `can_edit()`). **Aucune
migration supplémentaire n'a été nécessaire.**

| Colonne | Rôle |
|---|---|
| `reference` | Référence lisible, unique (générée `TCK-AAAAMMJJ-XXXX`) |
| `title` | Intitulé (obligatoire) |
| `description` | Description du problème |
| `priority` | `LOW`, `NORMAL`, `HIGH`, `URGENT` (contrainte de domaine) |
| `status` | `OPEN`, `IN_PROGRESS`, `WAITING`, `RESOLVED`, `CLOSED` |
| `technician` | Technicien en charge |
| `resolution` | Compte rendu de résolution |
| `pc_asset_id`, `employee_id`, `seat_id` | Rattaché à un équipement, un collaborateur, une position (facultatifs) |
| `opened_at` | Date d'ouverture (défaut `now()`) |
| `closed_at` | Date de clôture (renseignée automatiquement) |

Les jointures (tag équipement, nom du collaborateur, code de position) sont
**hydratées côté serveur** (`hydrateTickets`) et non exposées aux tables
référencées directement dans le rendu.

---

## 3. Règles métier

- **Statuts considérés comme clos** : `RESOLVED` et `CLOSED`.
- `closed_at` :
  - `null` à la création si le statut est ouvert ;
  - positionné à `now()` lors du premier passage à un statut clos ;
  - conservé si le ticket reste clos lors d'une modification ;
  - remis à `null` en cas de réouverture (retour à un statut ouvert).
- **Validation serveur** : intitulé obligatoire ; statut et priorité doivent
  appartenir aux codes autorisés (jamais confiance au client).
- Aucun effet de bord sur le statut de l'équipement : un ticket peut porter un
  équipement, sans modifier automatiquement `pc_assets.status` (pour ne pas
  entrer en conflit avec les affectations de la Phase 6).

---

## 4. Écrans

### `/maintenance` (Module E)

- Liste paginée par base (1 000 max), triée par date d'ouverture décroissante.
- Recherche (référence, intitulé, description, technicien) + filtres statut /
  priorité (formulaire GET).
- Création depuis un panneau dépliable (ADMIN/MANAGER) avec sélection
  facultative d'équipement, de collaborateur et de position.

### `/maintenance/[id]`

- **Éditeur** (ADMIN/MANAGER) : bandeau « Cycle de vie » (changement de statut
  en un clic) + formulaire complet.
- **Consultation** : fiche en lecture seule + mention explicite du rôle.

### `/reports` (Module F)

Statistiques calculées côté serveur (`getReportsOverview`) :

- cartes : zones (+ rangées), positions, collaborateurs (actifs), équipements
  (actifs), tickets (ouverts) ;
- répartitions : positions par état (libellés issus de `seat_statuses`),
  équipements par statut et par type, tickets par statut et par priorité
  (barres proportionnelles + pourcentages).

### `/` — Tableau de bord (Module A)

Connecté aux données réelles et réutilise `getReportsOverview()` ainsi que
`listRecentMaintenanceTickets(5)` :

- cartes : zones (+ rangées), positions occupées (avec taux d'occupation),
  positions libres (+ indisponibles), collaborateurs (actifs), équipements
  (actifs), équipements en maintenance, interventions en cours ;
- répartitions : positions par état, équipements par statut ;
- panneau « Dernières interventions » (5 tickets les plus récents) ou état vide.

Les composants `StatCard` et `BreakdownList` sont partagés entre le tableau de
bord et `/reports` (`components/overview/`).

---

## 5. Sécurité

- Lecture des tickets et des statistiques : tout utilisateur `authenticated`
  (RLS `maintenance_tickets_select` et politiques de lecture).
- Écriture (`createMaintenanceTicket`, `updateMaintenanceTicket`,
  `setMaintenanceStatus`) : réservée `ADMIN`/`MANAGER` via `ensureEditor()` côté
  code **et** RLS `can_edit()` côté base.
- `/reports` est accessible à tous les rôles authentifiés (statistiques
  globales, aucune donnée nominative nouvelle).

---

## 6. Vérifications effectuées

| Contrôle | Résultat |
|---|---|
| `npm run lint` | exit 0 |
| `npm run typecheck` (`tsc --noEmit`) | exit 0 |
| `npm run build` | 15 routes — `/maintenance/[id]` ajoutée |
| Routes anonymes (`/maintenance`, `/maintenance/[id]`, `/reports`) | 307 vers `/login?redirectTo=…` |
| Test base (script temporaire, supprimé) | 13/13 — colonnes des requêtes, création/maj/suppression de ticket, logique `closed_at`, aucune donnée laissée |
| Test authentifié (utilisateur temporaire, supprimé) | `/maintenance` 200 (mode consultation), `/reports` 200 (statistiques), `/maintenance/[id]` 200 (référence rendue) ; promotion de rôle refusée par le trigger anti-escalade (comportement attendu) |
| Test Tableau de bord (utilisateur temporaire, supprimé) | 10/10 — `/` 200, cartes et blocs rendus sur données réelles, `/reports` 200 avec composants partagés |

---

## 7. Reste à faire (hors périmètre Phase 8)

- Export CSV des statistiques (mentionné dans le cahier des charges) : non
  implémenté à ce stade.
- Historique des imports : non journalisé (l'import Phase 7 ne conserve pas de
  trace persistante des lots).
