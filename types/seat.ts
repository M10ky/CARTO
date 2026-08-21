import type { Seat, Row, Zone, Wing, SeatAssignment, Employee, PcAsset } from "@prisma/client";

/**
 * Représentation "aplatie" d'un poste telle qu'utilisée par le front
 * (cartographie), reconstituée à partir des relations Prisma.
 * Évite de faire transiter les objets Prisma bruts (imbriqués) jusqu'aux
 * composants clients.
 */
export type SeatWithContext = Seat & {
  row: Row & {
    zone: Zone & {
      wing: Wing;
    };
  };
  assignments: (SeatAssignment & {
    employee: Employee | null;
    pcAsset: PcAsset | null;
  })[];
};

export type SeatDTO = {
  id: string;
  code: string;
  kind: Seat["kind"];
  status: Seat["status"];
  wingName: string;
  zoneName: string;
  zoneId: string;
  rowLabel: string;
  department: string | null;
  employeeName: string | null;
  employeeRole: string | null;
  pcHostname: string | null;
};

export function toSeatDTO(seat: SeatWithContext): SeatDTO {
  const activeAssignment = seat.assignments.find((a) => a.active);
  return {
    id: seat.id,
    code: seat.code,
    kind: seat.kind,
    status: seat.status,
    wingName: seat.row.zone.wing.name,
    zoneName: seat.row.zone.name,
    zoneId: seat.row.zone.id,
    rowLabel: seat.row.label,
    department: seat.row.zone.department,
    employeeName: activeAssignment?.employee
      ? [activeAssignment.employee.firstName, activeAssignment.employee.lastName]
          .filter(Boolean)
          .join(" ")
      : null,
    employeeRole: activeAssignment?.employee?.role ?? null,
    pcHostname: activeAssignment?.pcAsset?.hostname ?? null,
  };
}