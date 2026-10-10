# Phase 3 — Analyse et prototype de la cartographie

*Référence géométrique unique : `Feuille de calcul sans titre.xlsx`, feuille `Cartographie`.*
*Méthode : extraction programmatique (parsing du XML OOXML du `.xlsx` —
cellules, valeurs, remplissages, fusions, ancrages d'images) ; aucun
relevé manuel. Les scripts d'extraction sont temporaires et ne sont pas
versionnés dans le dépôt.*

---

## 1. Ce qui a été produit

| Livrable | Fichier |
|---|---|
| Spécification de géométrie (données du plan) | `lib/spatial/cluster-layout.ts` |
| Prototype de rendu (SVG, fidèle aux coordonnées Excel) | `components/cartography/cluster-plan.tsx` |
| Écran `/cluster` (prototype + volumétrie) | `app/(dashboard)/cluster/page.tsx` |
| Zone 8 ajoutée au référentiel | `lib/spatial/zone-definitions.ts` |

Le prototype est **uniquement géométrique** : aucune donnée métier (occupant,
service, état) n'y figure, conformément à la règle « aucune donnée fictive ».
Toutes les positions sont dans l'état « à renseigner ».

---

## 2. Structure réellement observée dans l'Excel

- Feuille : `A1:BE91`. Zone de plan utile : **lignes 10 à 85**, colonnes
  **C à AS** (43 colonnes).
- **4 blocs de colonnes** :

| Bloc | Colonne étiquette | Colonnes positions |
|---|---|---|
| L — Aile Nord | `C` | `D→M` |
| M1 — Aile Nord | `P` | `Q→W` (le bloc central utilise aussi `P`) |
| M2 — Aile Nord | `Z` | `AA→AG` (le bloc central utilise `AA→AE`) |
| R — Aile Sud | `AI` | `AJ→AS` |

- **Une « Rangée N » = une étiquette fusionnée sur 2 lignes** → 2 lignes de
  postes face à face. Les lignes d'allée (17, 20, 24, 30, 33, 36, 43, 46, 56,
  59, 62, 63, 66, 69, 72, 75, 78, 80, 81, 82…) restent vides.
- Coloration de l'Excel (non reprise telle quelle) : `EA9999` (rouge clair,
  positions « PRODIGY / Tersea / YAS… »), `D9FBFA` (standard), `E06666`
  (managers/direction), `00AFAA` (managers de cellule `MC …`), `666666`
  (Pantry, `(COO)`, `Create/Agilite/Voahangy`, `Malik (CEO)`), `F3F3F3` (en-têtes
  de zone + compteurs).
- Éléments particuliers détectés : `ESCALIER EST` (`X10:X20`), `Pantry`
  (`P39:AF41`), `(COO)` (`D44:K45`), `Malik (CEO)` (`AJ83:AO84`), salle
  `Formation` (`C25:G26` + `J25:J26`), blocs « espaces vides » (voir §5).

---

## 3. Volumétrie : compteur Excel vs positions dessinées

Compteur = valeur annoncée dans l'en-tête de zone du `.xlsx`.
Dessiné = nombre de cellules de position effectivement présentes.

| Zone | Compteur Excel | Dessinées | Écart |
|---|---:|---:|---:|
| AN-Z4A (Zone 4 — YAS AS / Télésales) | 60 | 66 | +6 |
| AN-FORMATION (Formation) | — | 11 | — |
| AN-Z3 (Zone 3 — MVOLA AE) | 48 | 54 | +6 |
| C-BOX3 (Box 3) | 1 | 1 | 0 |
| AN-Z2 (Zone 2 — GC / PMI-PME) | 64 | 72 | +8 |
| AN-Z1 (Zone 1 — B4B) | 77 | 88 | +11 |
| AN-Z4B (Zone 4 — Certifications) | 18 | 18 | 0 |
| AN-Z9 (Zone 9 — Réclamations MVOLA) | 90 | 41 | −49 |
| AN-Z8 (Zone 8 — Opérateurs) | 30 | 30 | 0 |
| AN-CENTRAL (bloc central) | — | 36 | — |
| AS-Z4 (Zone 4 — Comores / Telco OIF) | 46 | 58 | +12 |
| AS-Z7 (Zone 7 — YAS AE / Digital) | 72 | 72 | 0 |
| AS-Z6 (Zone 6 — Activation / Facturation) | 72 | 72 | 0 |
| C-BOX4 (Box 4) | 3 | 3 | 0 |
| AS-Z5 (Zone 5 — Support / IT / Consulting / Finances) | 48 | 48 | 0 |
| C-BOX5 (Box 5) | 1 | 1 | 0 |
| **Total dessiné** | | **671** | |

**Sept zones correspondent exactement au compteur** (Z4B, Z8, Z7, Z6, Z5,
Box 3, Box 4, Box 5) : cela valide la méthode d'extraction.

Pistes d'explication des écarts (à confirmer par l'utilisateur) :

- `AN-Z4A` : les 6 positions de la « Rangée 4 » (ligne 13) sont probablement
  des positions ajoutées, hors compteur. 66 − 6 = 60.
- `AS-Z4` : la « Rangée 4 (Nouvelles positions) » (lignes 21-22, 12 positions)
  n'est vraisemblablement pas comptée. 58 − 12 = 46.
- `AN-Z9` : écart négatif important (−49). Soit le compteur agrège une surface
  plus grande que les cellules dessinées, soit une partie de la zone n'est pas
  représentée dans la feuille. **À trancher.**
- `AN-Z1`, `AN-Z2`, `AN-Z3` : quelques positions supplémentaires (lignes de
  « nouvelles positions » / cellules génériques répétées) non comptées.

> Décision provisoire : **la disposition dessinée fait foi pour le plan**, et les
> compteurs sont conservés comme métadonnée séparée. L'écart doit être arbitré
> avec l'utilisateur avant la Phase 4 (modèle de données).

---

## 4. Traitement du bloc central (lignes 25-34)

Le bloc central (colonnes `P→AE`) porte des libellés `Rangée 1…6` fusionnés
**horizontalement en ligne 34** — orientation différente du reste de la feuille
(étiquettes verticales sur 2 lignes). Il a été isolé sous les codes
géométriques `AN-Z9` (partie M1) et `AN-CENTRAL` (partie M2), sans être fusionné
avec les zones voisines. **Cette zone reste à valider visuellement.**

---

## 5. Espaces vides et images

- Grandes fusions vides sans texte, traitées comme **espaces vides** (jamais
  comme positions) : `P45:U56`, `W45:Z56`, `AB45:AE56`, `Z61:AE71`,
  `Q64:W65`, `Q71:S72`, `U71:W72`, `Q74:S75`, `U74:W75`, `AB73:AE82`,
  `R80:V81`, `X80:Z81`.
- **23 ancrages d'images** (`oneCellAnchor`) pour seulement **6 fichiers PNG**
  réutilisés (`image1.png` … `image6.png`). Nature non déterminée (portes,
  escaliers, mobilier, logos ?) → **à identifier avec l'utilisateur**.

---

## 6. Questions ouvertes (validation utilisateur requise)

1. **Compteurs vs plan** : quelle valeur fait autorité pour la volumétrie
   officielle de chaque zone ? (Les positions dessinées diffèrent des compteurs.)
2. **Bloc central** : la reconstitution `AN-Z9` / `AN-CENTRAL` est-elle correcte ?
3. **Espaces vides** : confirmer qu'il ne s'agit pas de positions.
4. **AN-Z9** : où sont les positions manquantes (compteur 90 / dessiné 41) ?
5. **Images** : que représentent les 6 PNG ancrés (23 ancrages) ?
6. **Zone 8** : ajoutée au référentiel sous `AN-Z8` (absente du prototype) —
   confirmer le libellé.

---

## 7. Prochaine étape

Après validation de la géométrie :
- **Phase 4 — Base de données et authentification** : schéma Supabase
  (`zones`, `rows`, `seats`), RLS, Auth, rôles. Le schéma `seats` reprendra les
  identifiants `{zone}-R{rangée}-{colonne}` dérivés de ce plan.
- **Phase 5 — Cartographie interactive** : zoom/déplacement, sélection,
  recherche et filtres, branchement des états et occupants sur le prototype.
