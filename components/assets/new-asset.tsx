"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { AssetForm } from "@/components/assets/asset-form";

export function NewAsset({ assetTypes }: { assetTypes: string[] }) {
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
          Nouvel équipement
        </Button>
      </div>

      {open ? (
        <Panel>
          <PanelHeader
            title="Nouvel équipement"
            description="Renseignez au moins un numéro d'inventaire ou de série."
          />
          <PanelBody>
            <AssetForm assetTypes={assetTypes} onDone={() => setOpen(false)} />
          </PanelBody>
        </Panel>
      ) : null}
    </div>
  );
}
