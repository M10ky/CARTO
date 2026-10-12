"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { TicketForm } from "@/components/maintenance/ticket-form";
import type { AssetOption } from "@/lib/data/assets";
import type { EmployeeOption, SeatOption } from "@/lib/data/employees";

export function NewTicket({
  assets,
  employees,
  seats,
}: {
  assets: AssetOption[];
  employees: EmployeeOption[];
  seats: SeatOption[];
}) {
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
          Nouvelle intervention
        </Button>
      </div>

      {open ? (
        <Panel>
          <PanelHeader
            title="Nouvelle intervention"
            description="L'intitulé est obligatoire ; les autres champs peuvent être complétés plus tard."
          />
          <PanelBody>
            <TicketForm
              assets={assets}
              employees={employees}
              seats={seats}
              onDone={() => setOpen(false)}
            />
          </PanelBody>
        </Panel>
      ) : null}
    </div>
  );
}
