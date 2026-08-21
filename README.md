# Phase 1 — Base de données & Prisma

## Fichiers livrés
- `prisma/schema.prisma` — modèle de données complet (Wing, Zone, Row, Seat, Employee, PcAsset, SeatAssignment, MaintenanceLog, ImportSession, StagingPcRow)
- `prisma/seed/seed.ts` — reconstruit la structure spatiale réelle du cluster (ailes/zones/rangées/postes), tous les postes en `VACANT`
- `lib/db/prisma.ts` — client Prisma singleton (sûr en dev avec le hot-reload de Next.js)
- `types/seat.ts` — DTO `SeatDTO` + fonction `toSeatDTO()` pour aplatir les relations Prisma côté front
- `.env.example` — modèle de variable `DATABASE_URL`

## Mise en place

1. Copier ces fichiers dans l'arborescence générée par `setup_project.sh` (ils remplacent les fichiers vides correspondants).
2. `cp .env.example .env` puis renseigner ta vraie `DATABASE_URL`.
3. Ajouter dans `package.json` :
   ```json
   "prisma": {
     "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed/seed.ts"
   }
   ```
   (installer `ts-node` en dev : `npm install -D ts-node`)
4. Lancer :
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   npx prisma studio   # pour vérifier visuellement les données
   ```

## Vérifications attendues
- La migration crée bien les 10 tables (`wings`, `zones`, `rows`, `seats`, `employees`, `pc_assets`, `seat_assignments`, `maintenance_logs`, `import_sessions`, `staging_pc_rows`).
- Le seed crée 3 ailes, 14 zones, et un total de **~633 postes** répartis (correspond au volumétrie du prototype HTML).
- `prisma studio` permet de parcourir `Seat` → `Row` → `Zone` → `Wing` sans erreur de relation.

---
Une fois validé, dis-moi **"Prêt pour la Phase 2"** pour le pipeline d'import Excel.