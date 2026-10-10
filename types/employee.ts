import type { AssignmentLink } from "@/types/assignment";

export type Employee = {
  id: string;
  matricule: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  service: string | null;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  isActive: boolean;
  createdAt: string;
};

export type EmployeeDetail = Employee & {
  assignments: AssignmentLink[];
};

export type EmployeeFilters = {
  search?: string;
  service?: string;
  status?: "active" | "inactive" | "all";
};
