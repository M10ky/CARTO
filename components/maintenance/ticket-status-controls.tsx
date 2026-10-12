"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MAINTENANCE_STATUSES } from "@/lib/constants/maintenance";
import { setMaintenanceStatus } from "@/lib/actions/maintenance";

export function TicketStatusControls({
  ticketId,
  status,
}: {
  ticketId: string;
  status: string;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    if (next === status) {
      return;
    }
    startTransition(async () => {
      const result = await setMaintenanceStatus(ticketId, next);
      if (result.ok) {
        setFeedback(null);
        router.refresh();
      } else {
        setFeedback(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {MAINTENANCE_STATUSES.map((option) => (
          <Button
            key={option.code}
            variant={option.code === status ? "primary" : "secondary"}
            size="sm"
            disabled={pending || option.code === status}
            onClick={() => change(option.code)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      {feedback ? <Alert tone="danger">{feedback}</Alert> : null}
    </div>
  );
}
