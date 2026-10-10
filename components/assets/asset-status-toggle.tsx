"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { setPcAssetActive } from "@/lib/actions/assets";

export function AssetStatusToggle({
  assetId,
  isActive,
}: {
  assetId: string;
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
          await setPcAssetActive(assetId, !isActive);
          router.refresh();
        })
      }
    >
      {isActive ? "Désactiver" : "Réactiver"}
    </Button>
  );
}
