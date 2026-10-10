"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { setEmployeeActive } from "@/lib/actions/employees";

export function EmployeeStatusToggle({
  employeeId,
  isActive,
}: {
  employeeId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={isActive ? "danger" : "primary"}
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setEmployeeActive(employeeId, !isActive);
          router.refresh();
        })
      }
    >
      {isActive ? "Désactiver" : "Réactiver"}
    </Button>
  );
}
