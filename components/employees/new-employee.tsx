"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { EmployeeForm } from "@/components/employees/employee-form";

export function NewEmployee() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="sm"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <Plus aria-hidden className="size-3.5" />
          Nouveau collaborateur
        </Button>
      </div>

      {open ? (
        <Panel>
          <PanelHeader
            title="Nouveau collaborateur"
            description="Les champs vides ne sont pas enregistrés."
          />
          <PanelBody>
            <EmployeeForm onDone={() => setOpen(false)} />
          </PanelBody>
        </Panel>
      ) : null}
    </div>
  );
}
