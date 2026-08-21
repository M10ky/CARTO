import { PrismaClient, WingType, ZoneKind, SeatKind, SeatStatus } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Définition des ailes et zones, reprise du prototype HTML
 * (cartographie-cluster.html) pour repartir d'une base spatiale
 * cohérente avec le site réel.
 *
 * NB : ce seed ne crée QUE la structure spatiale (wings/zones/rows/seats),
 * tous les postes sont initialisés VACANT. Les employés et PC réels
 * seront rattachés via le pipeline d'import (Phase 2) ou l'édition
 * manuelle (Phase 4).
 */

type ZoneSeed = {
  wing: WingType;
  wingOrder: number;
  name: string;
  code: string;
  kind: ZoneKind;
  department?: string;
  rows: number;   // nombre de rangées
  total: number;  // nombre total de postes dans la zone
};

const ZONES: ZoneSeed[] = [
  // ---- Central (boxes de direction) ----
  { wing: "CENTRAL", wingOrder: 0, name: "Box 5 — Direction", code: "C-BOX5", kind: "BOX", department: "Direction", rows: 1, total: 1 },
  { wing: "CENTRAL", wingOrder: 0, name: "Box 4 — Direction", code: "C-BOX4", kind: "BOX", department: "Direction", rows: 1, total: 3 },
  { wing: "CENTRAL", wingOrder: 0, name: "Box 3 — Direction", code: "C-BOX3", kind: "BOX", department: "Direction", rows: 1, total: 1 },

  // ---- Aile Nord ----
  { wing: "AILE_NORD", wingOrder: 1, name: "Zone 1 — B4B", code: "AN-Z1", kind: "OPEN_SPACE", department: "B4B", rows: 5, total: 78 },
  { wing: "AILE_NORD", wingOrder: 1, name: "Zone 2 — Grands Comptes / PMI-PME", code: "AN-Z2", kind: "OPEN_SPACE", department: "Commercial", rows: 4, total: 64 },
  { wing: "AILE_NORD", wingOrder: 1, name: "Zone 3 — MVOLA AE", code: "AN-Z3", kind: "OPEN_SPACE", department: "Mvola", rows: 3, total: 48 },
  { wing: "AILE_NORD", wingOrder: 1, name: "Zone 4 — YAS AS / Télésales", code: "AN-Z4A", kind: "OPEN_SPACE", department: "Yas", rows: 4, total: 60 },
  { wing: "AILE_NORD", wingOrder: 1, name: "Zone 4 — Certifications", code: "AN-Z4B", kind: "OPEN_SPACE", department: "Certification", rows: 2, total: 18 },
  { wing: "AILE_NORD", wingOrder: 1, name: "Zone 9 — Réclamations / Accueil MVOLA", code: "AN-Z9", kind: "OPEN_SPACE", department: "Mvola", rows: 5, total: 90 },

  // ---- Aile Sud ----
  { wing: "AILE_SUD", wingOrder: 2, name: "Zone 5 — Support / IT / Consulting / Finances", code: "AS-Z5", kind: "OPEN_SPACE", department: "Support", rows: 4, total: 48 },
  { wing: "AILE_SUD", wingOrder: 2, name: "Zone 6 — Activation / Facturation YAS / Tersea", code: "AS-Z6", kind: "OPEN_SPACE", department: "Yas", rows: 4, total: 72 },
  { wing: "AILE_SUD", wingOrder: 2, name: "Zone 7 — YAS AE / Digital", code: "AS-Z7", kind: "OPEN_SPACE", department: "Yas", rows: 4, total: 72 },
  { wing: "AILE_SUD", wingOrder: 2, name: "Zone — Opérateurs (Free / Incom / Stellarix / Prodigy)", code: "AS-ZOP", kind: "OPEN_SPACE", department: "Opérateurs", rows: 3, total: 30 },
  { wing: "AILE_SUD", wingOrder: 2, name: "Zone 4 — Comores / Telco OIF / VFM", code: "AS-Z4", kind: "OPEN_SPACE", department: "Opérateurs", rows: 4, total: 46 },
];

async function main() {
  console.log("🌱 Démarrage du seed...");

  // 1. Création des 3 ailes
  const wingRecords = new Map<WingType, { id: string }>();
  const wingDefs: { type: WingType; name: string; order: number }[] = [
    { type: "CENTRAL", name: "Central", order: 0 },
    { type: "AILE_NORD", name: "Aile Nord", order: 1 },
    { type: "AILE_SUD", name: "Aile Sud", order: 2 },
  ];

  for (const w of wingDefs) {
    const wing = await prisma.wing.create({
      data: { name: w.name, type: w.type, order: w.order },
    });
    wingRecords.set(w.type, wing);
    console.log(`  ✓ Aile créée : ${w.name}`);
  }

  // 2. Création des zones, rangées et postes
  let zoneOrder = 0;
  for (const z of ZONES) {
    const wing = wingRecords.get(z.wing)!;
    const zone = await prisma.zone.create({
      data: {
        wingId: wing.id,
        name: z.name,
        code: z.code,
        kind: z.kind,
        department: z.department,
        order: zoneOrder++,
      },
    });

    if (z.kind === "BOX") {
      // Une seule "rangée" virtuelle pour les box de direction
      const row = await prisma.row.create({
        data: { zoneId: zone.id, label: "—", index: 0 },
      });
      for (let i = 0; i < z.total; i++) {
        await prisma.seat.create({
          data: {
            rowId: row.id,
            code: `${z.code}-${String(i + 1).padStart(2, "0")}`,
            kind: "PERSON" as SeatKind,
            status: "VACANT" as SeatStatus,
          },
        });
      }
    } else {
      const perRow = Math.ceil(z.total / z.rows);
      let remaining = z.total;
      for (let r = 0; r < z.rows; r++) {
        const countThisRow = Math.min(perRow, remaining);
        remaining -= countThisRow;
        const row = await prisma.row.create({
          data: { zoneId: zone.id, label: `Rangée ${r + 1}`, index: r },
        });
        for (let c = 0; c < countThisRow; c++) {
          await prisma.seat.create({
            data: {
              rowId: row.id,
              code: `${z.code}-R${r + 1}-${String(c + 1).padStart(3, "0")}`,
              kind: "PERSON" as SeatKind,
              status: "VACANT" as SeatStatus,
            },
          });
        }
      }
    }
    console.log(`  ✓ Zone créée : ${z.name} (${z.total} postes)`);
  }

  const totalSeats = await prisma.seat.count();
  console.log(`\n✅ Seed terminé — ${totalSeats} postes créés au total.`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur pendant le seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });