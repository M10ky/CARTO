import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import type { Employee } from "@/types/employee";

export function EmployeeTable({ employees }: { employees: Employee[] }) {
  if (employees.length === 0) {
    return (
      <EmptyState
        title="Aucun collaborateur"
        description="Aucun résultat ne correspond aux critères de recherche."
      />
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Collaborateur</TableHeaderCell>
          <TableHeaderCell className="hidden sm:table-cell">Matricule</TableHeaderCell>
          <TableHeaderCell className="hidden md:table-cell">Service</TableHeaderCell>
          <TableHeaderCell className="hidden lg:table-cell">Fonction</TableHeaderCell>
          <TableHeaderCell className="hidden lg:table-cell">E-mail</TableHeaderCell>
          <TableHeaderCell>Statut</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell>
              <Link
                href={`/employees/${employee.id}`}
                className="font-medium text-text hover:text-accent"
              >
                {employee.fullName || "—"}
              </Link>
            </TableCell>
            <TableCell className="hidden font-mono text-xs sm:table-cell">
              {employee.matricule ?? "—"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {employee.service ?? "—"}
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              {employee.jobTitle ?? "—"}
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              {employee.email ?? "—"}
            </TableCell>
            <TableCell>
              <Badge tone={employee.isActive ? "success" : "neutral"} dot>
                {employee.isActive ? "Actif" : "Inactif"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
