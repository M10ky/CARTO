export type AssignmentLink = {
  id: string;
  seatId: string | null;
  seatCode: string | null;
  seatLabel: string | null;
  zoneName: string | null;
  pcAssetId: string | null;
  pcAssetTag: string | null;
  employeeId: string | null;
  employeeName: string | null;
  startedAt: string;
  endedAt: string | null;
  isActive: boolean;
  notes: string | null;
};
