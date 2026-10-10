# Audit Phase 0 — Compréhension des sources

*Date de rédaction : 09/10/2026 · Méthode : parsing XML du `.xlsx` (cellules, fusions,
largeurs, remplissages, images), lecture des exports HTML du zip, analyse du prototype HTML.
Lecture **non** effectuée dans un tableur : une comparaison visuelle reste obligatoire en Phase 3.*

---

## 1. Sources réellement consultées

| Fichier | Statut | Détail |
|---|---|---|
| `Feuille de calcul sans titre.xlsx` | ✅ analysé | 1 feuille `Cartographie`, 91 lignes × 45 colonnes (A→AS), 65 fusions, 23 images PNG, 1 mise en forme conditionnelle |
| `CARTOGRAPHIE DES POSITIONS_CNTO_2025.zip` | ✅ ouvert | 18 feuilles HTML (export Google Sheets) : `Cartographie`, `Inventaire`, `Maintenance PC`, `Mapping`, `Recapitulatif`, `Récap IT`, `BDD`, `Feuille 29`, `Travaux`, `Planning`, `Step 1-5`, `Comete (Step3)`, `Facturation`, `Propositions B4B`, `MTN` + `resources/` |
| `cartographie-cluster.html` | ✅ analysé | prototype autonome (HTML + CSS + JS inline), 38 Ko |
| `public/templates/modele_import_pc.xlsx` | ⚠️ 0 octet | squelette, supprimé en Phase 1 (regénéré en Phase 7) |

---

## 2. Disposition physique de la référence Excel

### 2.1 En-tête et métadonnées
- `A1` = `Nb3046` · `I2:L3` fusionné = **« Cartographie des positions »**
- `C5` = **« Date de dernière mise à jour : 06/11/2025 »**
- Légende (lignes 4-6) : `Sans PC`, `Endommagé / Non exploité`, `Déplacements prévus ou actés récemment`.
  ⚠️ **Les pastilles de couleur sont introuvables** : les cellules de légende n'ont aucun
  remplissage ni image. La correspondance statut ↔ couleur n'est donc pas déterminable
  à partir du fichier seul.
- **Mise en forme conditionnelle** : toute cellule contenant `VIDE` → jaune `FFF2CC`.
- Ligne 7-8 (compteurs libres par type) : `VIDE (CC) = 1`, `VIDE (Manager) = 0`,
  `VIDE (Support) = 3`, `Total = 4`.

### 2.2 Structure : 2 ailes, 4 blocs de colonnes

| Bloc | Colonne étiquette | Colonnes postes | Contenu (ligne d'en-tête = `Positions / Occupées / Vides`) |
|---|---|---|---|
| **L** | `C` | `D→M` (10) | `AILE NORD` (`C8`) — ZONE 4 r11 **60** · ZONE 3 r29 **48** · BOX 3 r42 **1** · ZONE 2 r49 **64** · ZONE 1 r65 **77** |
| **M1** | `P` | `Q→W` (7) | ZONE 4 r11 **18** · ZONE 9 r23 **90** · **Pantry** (fusion `P39:AF41`, déborde sur M2) |
| **M2** | `Z` | `AA→AG` (7) | ZONE 8 r11 **30** |
| **R** | `AI` | `AJ→AS` (10) | `AILE SUD` (`AK8`) — ZONE 4 r11 **46** · ZONE 7 r26 **72** · ZONE 6 r42 **72** · BOX 4 r58 **3** · ZONE 5 r65 **48** · BOX 5 r81 **1** |

- **`ESCALIER EST`** en `X10`, entre M1 et M2.
- **Total déclaré par les compteurs : 630 positions.**
- **`ZONE 4` existe 3 fois** (`C11`, `P11`, `AI11`) → noms non uniques, d'où les codes stables.

### 2.3 Géométrie verticale
- Hauteurs : lignes 1-9 = 21 pt ; **lignes 10-91 = 31,5 pt** (aucune hiérarchie par la hauteur :
  la distinction passe par **fusion + remplissage + bordures**).
- **Une « Rangée N » = une étiquette fusionnée sur 2 lignes**
  (`C15:C16`, `C18:C19`, `C21:C22`, `C31:C32`, `C51:C52`, `C67:C68`…)
  → **2 lignes de postes face à face**, séparées des rangées voisines par des
  **lignes d'allée vides** (17, 20, 24, 30, 36, 43, 46, 56, 63, 66, 69, 72, 75, 78…).
- Largeurs : postes 12,63 ; étiquettes `C`/`P`/`AI` = 13,63 ; colonnes d'écart
  `A`, `B`, `N`, `O`, `AG`, `AT` = 3,38-4,25. Une colonne `AV` de **largeur 119**
  existe hors de la zone cartographique (colonne de notes ?).

### 2.4 Codes de couleur présents dans le plan

| Couleur | Usage observé |
|---|---|
| `D9FBFA` cyan très clair | cellules standard majoritaires |
| `EA9999` rouge clair | ~240 cellules (PRODIGY, Tersea, MAN, Activation/Retention YAS…) |
| `E06666` rouge | ~30 cellules isolées, souvent nominatives |
| `00AFAA` turquoise | ~40 cellules (souvent nom de personne isolé, `AILE NORD/SUD`, `(COO)`, `Malik (CEO)`) |
| `D1FFEB` vert | zone **Formation** (`C25:G26`) |
| `666666` gris foncé | `Pantry`, `(COO)`, `Malik (CEO)`, `Create` / `Agilite` / `Voahangy` |
| `F3F3F3` gris clair | en-têtes `ZONE x` + compteurs |
| `FFF2CC` jaune (conditionnel) | cellules `VIDE …` = position libre |

⚠️ **Aucun de ces remplissages n'est explicitement mappé à la légende.** Décision :
palette maison premium, voir `app/globals.css` et `PROJECT_STATUS.md` (décision 7).

### 2.5 Anomalies relevées
1. Compteurs incohérents : `Occupées = Positions` et `Vides = 0` presque partout ;
   seul ZONE 5 déclare `48 / 45 / 3`.
2. Données sales : `K61` = `Testeur (Comete)Testeur (Comete)   Testeur (Comete)`,
   `L33` = `,`, `Z22` = `Non équipées` + `9.0` (flottant), `L65` = `9.0`,
   `Vide`/`VIDE` hétérogènes, doublons de noms (`Sylvio` ×2, `Ando` ×4, `Testeur` ×3…).
3. Grandes **fusions vides** sans texte : `P45:U56`, `W45:Z56`, `AB45:AE56`,
   `Z61:AE71`, `AB73:AE82`, `R80:V81`, `X80:Z81` → salle / mobilier / espace vide ?
   **Ne pas les traiter comme des postes.**
4. **Bloc central (lignes 25-38)** : les libellés `Rangée 1…6` sont fusionnés
   **horizontalement** à la ligne 34 (`R34:S34`, `U34:V34`, `X34:Y34`, `AA34:AB34`,
   `AD34:AE34`) — orientation **différente** du reste (étiquettes verticales sur 2 lignes).
   Géométrie à confirmer, non déductible sans validation visuelle.
5. Volumétrie divergente : **630** (compteurs Excel) / **631** (prototype, Zone 1 = 78) /
   **627** (`Récap IT.html`, `DESKTOP`).

---

## 3. Sources secondaires dans le zip (utiles aux phases suivantes)

- **`Inventaire.html`** (73 lignes) : `Entite, Pôle, Type, Fabricant, Modele,
  Numero_de_serie, Statut, Login, Utilisateur, Tana-shore Andranome,
  Systeme exploitation, Systeme Version, RAM (Mo), CPU, HDD taille total (Mo),
  HDD Taille Libre C: (Mo), HDD Taille Libre D: (Mo), Nom HDD C: …`
- **`Maintenance PC.html`** (163 lignes) : `Date, Nom PC, Nom utilisateur, Service,
  Équipement, Marque/Modèle, Numéro de série, Intervention effectuée, Technicien,
  Statut, Date de clôture, Observation`
- **`Mapping.html`** (286 lignes) : `Fonction, Niveau, Prestation, Commande,
  Rattachement, Service, Equipe carto` + **codes de poste `AN_Z1_R1`**
  → table de correspondance **poste ↔ service/équipe**, source des identifiants stables.
- **`BDD.html`** : `Nom de plage, Adresse, Aile, Zone, Rangée, Positions, Occupées,
  Vides CC/Manager/Support` (partiellement en `#NOM?`).
- **`Feuille 29.html`** : agrégats `Zone 1 → 86 CC / 5 MC`.

---

## 4. Prototype `cartographie-cluster.html`

### Ce qu'il apporte (à réutiliser)
- Noms et codes de zones : `AN-Z1…Z9`, `AS-Z4…Z7`, `AS-ZOP`, `C-BOX3/4/5`
  (**cohérents avec l'Excel**, seul écart : Zone 1 = 78 vs 77).
- Vocabulaire d'UI : KPI, recherche + résultats, filtres, navigation de zones par aile,
  drawer de fiche, mode édition persistant, statuts `occ` / `vac`, légende.
- Squelette de thème (navy + cyan + JetBrains Mono) repris et premium-isés en Phase 1.

### Limite fondamentale — ne pas copier
Le prototype **ne reproduit pas la disposition Excel**. Son `buildSeats()` génère une
grille générique :

```js
const perRow = Math.ceil(zone.total / zone.rows);        // grille uniforme
nm = pick(FIRST_NAMES, idx + zone.id.length * 7);        // noms fictifs
tag = (idx % 17 === 3) ? "RAJOUT" : null;                // tags artificiels
```

Ni les 4 blocs de colonnes, ni les rangées sur 2 lignes, ni les allées, ni les fusions
`Pantry` / `COO`, ni `ESCALIER EST`. **Il ne servira que de source de données et
d'inspiration UI — jamais de référence géométrique.** La géométrie viendra
exclusivement du `.xlsx`.

---

## 5. Questions restantes (à trancher en Phase 3)

1. Orientation exacte des rangées du bloc central (lignes 25-38).
2. Nature des grandes fusions vides (`P45:U56`…).
3. Nature des 23 images ancrées sur des cellules (portes, escaliers, équipements ?).
4. Volumétrie faisant foi : 630 (Excel) — arbitrage en faveur de l'Excel, mais l'écart
   des 78ᵉ poste de la Zone 1 doit être confirmé visuellement.
5. Clé d'unicité de l'inventaire : `Numero_de_serie` ou la 1ʳᵉ colonne (`7233`) ?
