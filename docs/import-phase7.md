# Phase 7 — Import Excel et CSV

*Module d'intégration des collaborateurs et du parc informatique depuis des
fichiers externes. Le fichier est lu **côté serveur**, l'aperçu est
**obligatoire** avant écriture, et l'import est **idempotent**.*

---

## 1. Ce qui a été produit

| Livrable | Fichier |
|---|---|
| Types du module | `lib/import/types.ts` |
| Schémas de colonnes, alias, normalisation | `lib/import/fields.ts` |
| Lecture `.xlsx` / `.csv` | `lib/import/parse.ts` |
| Mapping, validation, aperçu, charges DB | `lib/import/validate.ts` |
| Génération du modèle `.xlsx` | `lib/import/template.ts` |
| Server actions (`analyzeImport`, `commitImport`) | `lib/actions/import.ts` |
| Écran client d'import | `components/import/import-workbench.tsx` |
| Écran serveur `/import` | `app/(dashboard)/import/page.tsx` |
| Téléchargement du modèle | `app/api/import/template/route.ts` |
| Navigation (groupe « Outils ») | `lib/constants/nav.ts`, `components/layout/sidebar.tsx` |

Deux jeux de données sont pris en charge : `employees` (collaborateurs) et
`assets` (parc informatique). L'écran est accessible aux rôles `ADMIN` et
`MANAGER` uniquement.

---

## 2. Dépendances

- `xlsx@0.18.5` (26 vulnérabilités, dont 2 critiques) a été **retiré** et
  remplacé par **`exceljs@4.4.0`**, utilisé **exclusivement côté serveur**
  (parsing et génération du modèle). Le paquet n'est jamais importé dans un
  composant client.
- `next.config.ts` : `experimental.serverActions.bodySizeLimit = "10mb"` pour
  accepter les fichiers d'import (la limite par défaut est de 1 Mo).

---

## 3. Schémas de colonnes et alias

Le mapping se fait par **alias d'en-têtes normalisés**, jamais par position
fixe. La normalisation (`normalizeKey`) retire les accents (NFD), met en
minuscules et supprime toute ponctuation/espace, ce qui rend la
correspondance tolérante (« N° d'inventaire » → `numerodinventaire`).

### Collaborateurs (`employees`)

| Champ | Libellé | Exemples d'alias |
|---|---|---|
| `matricule` | Matricule | matricule, id, identifiant, code employé |
| `firstName` | Prénom | prénom, firstname, givenname |
| `lastName` | Nom | nom, lastname, surname |
| `service` | Service | service, département, direction, pôle |
| `jobTitle` | Fonction | fonction, poste, métier, intitulé |
| `email` | E-mail | email, mail, courriel |
| `phone` | Téléphone | téléphone, tel, mobile |
| `location` | Localisation | localisation, site, bureau, aile, zone |

### Parc informatique (`assets`)

| Champ | Libellé | Exemples d'alias |
|---|---|---|
| `assetTag` | N° d'inventaire | inventaire, assettag, étiquette, tag |
| `serialNumber` | N° de série | numéro de série, serial, sn |
| `manufacturer` | Fabricant | fabricant, marque, constructeur |
| `model` | Modèle | modèle, model, référence |
| `assetType` | Type | type, catégorie, matériel |
| `os` | Système d'exploitation | OS, système, operating system |
| `status` | Statut | statut, état, situation |
| `notes` | Notes | notes, observation, commentaire, utilisateur |

### Normalisations de valeurs

- **Statut parc** → `IN_USE`, `IN_STOCK`, `MAINTENANCE`, `RETIRED`, `UNKNOWN`
  (alias français : « en service », « en stock », « panne », « réformé »…).
  Valeur vide → `UNKNOWN`.
- **Type d'équipement** → `DESKTOP`, `LAPTOP`, `MONITOR`, `PRINTER`, sinon
  `OTHER`.

---

## 4. Flux de traitement

```
Fichier (.xlsx/.xlsm/.csv/.txt)
        │
        ▼  analyzeImport(kind, FormData)   [serveur, rôle ADMIN/MANAGER]
   parseSpreadsheet  ── ExcelJS (1re feuille) ou parseur CSV dédié
        │                 (séparateur ; , tab |, guillemets, BOM)
        ▼
   buildPreview(kind, sheet)
        │  mapColumns : alias normalisés
        │  validation ligne par ligne
        │  détection des doublons intra-fichier
        ▼
   Aperçu : { prêtes, doublons, erreurs } + mapping + 100 premières lignes
        │
        ▼  commitImport(kind, rows)         [serveur, rôle ADMIN/MANAGER]
   revalidation serveur ── dédup ── partition création / mise à jour
        │
        ▼
   insert par lots (300) avec repli ligne à ligne
   update partiel (champs fournis uniquement)
        │
        ▼
   Rapport : { créés, mis à jour, ignorés, détail des erreurs }
```

### Validation

- **Collaborateurs** : au moins un nom **ou** un prénom ; e-mail valide le cas
  échéant (non obligatoire).
- **Parc** : au moins un numéro d'inventaire **ou** un numéro de série.

### Clés métier (idempotence)

- Collaborateurs : `matricule` (insensible à la casse).
- Parc : `asset_tag` (insensible à la casse).

Une ligne dont la clé existe déjà en base est **mise à jour** ; sinon elle est
**créée**. Les lignes sans clé exploitable sont toujours créées. Une ligne en
erreur ou en doublon intra-fichier est **ignorée** et listée dans le rapport.

### Mises à jour partielles

`toEmployeePatch` / `toAssetPatch` ne transmettent que les champs réellement
renseignés : une colonne absente du fichier **n'écrase pas** la valeur en base.

---

## 5. Sécurité

- Les server actions (`analyzeImport`, `commitImport`) et la route
  `GET /api/import/template` exigent un utilisateur `ADMIN` ou `MANAGER`
  (`ensureEditor()` / `getCurrentUser()`). La RLS Supabase reste la seconde
  barrière côté base.
- Le client ne fait **jamais** confiance : toute écriture réapplique la
  validation et la déduplication côté serveur, même après un aperçu validé.
- Aucune donnée fictive n'est insérée. Les routes temporaires de test utilisées
  pendant la phase ont été supprimées du dépôt.

---

## 6. Limites connues / points à trancher

1. Seule la **première feuille** d'un classeur Excel est lue.
2. La ligne d'en-tête est la **première ligne non vide** (pas de détection de
   ligne d'en-tête au-delà).
3. L'import ne gère pas encore les **affectations** (position ↔ collaborateur ↔
   équipement) : il crée/alimente les référentiels collaborateurs et parc. Les
   affectations restent saisies depuis `/employees` et `/assets`.
4. Les colonnes non reconnues sont ignorées (signalées comme « non reconnue »
   dans l'aperçu).
5. `notes` du parc accepte des alias « utilisateur/login/affectation » : la
   valeur est stockée brute dans `notes`, sans création d'affectation.
6. Volume : insertion par lots de 300 avec repli ligne à ligne ; au-delà de
   10 Mo, le body de la server action est refusé.

---

## 7. Vérifications effectuées

| Contrôle | Résultat |
|---|---|
| `npm run lint` | exit 0 |
| `npm run typecheck` (`tsc --noEmit`) | exit 0 |
| `npm run build` | 13 routes — `/import` et `/api/import/template` présentes |
| Routes anonymes (`/import`, `/api/import/template`) | redirigées vers `/login` |
| Parsing / mapping (tests temporaires, supprimés) | 15/15 — CSV `;` + accents, alias, normalisation statut/type, doublons, aller-retour `.xlsx` |
| Écriture en base (tests temporaires, supprimés) | 10/10 — insert/update collaborateurs + parc, patch partiel, nettoyage vérifié |
