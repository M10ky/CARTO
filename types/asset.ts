import type { AssignmentLink } from "@/types/assignment";

export type PcAsset = {
  id: string;
  assetTag: string | null;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  assetType: string | null;
  os: string | null;
  status: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  assignedSeat: {
    id: string;
    code: string;
    zoneName: string | null;
  } | null;
};

export type PcAssetDetail = PcAsset & {
  assignments: AssignmentLink[];
};

export type PcAssetFilters = {
  search?: string;
  status?: string;
  assetType?: string;
  active?: "active" | "inactive" | "all";
};
