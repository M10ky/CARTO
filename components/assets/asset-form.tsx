"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PC_ASSET_TYPES, PC_STATUSES } from "@/lib/constants/inventory";
import {
  createPcAsset,
  updatePcAsset,
  type AssetInput,
} from "@/lib/actions/assets";
import type { PcAsset } from "@/types/asset";

type Feedback = { tone: "success" | "danger"; message: string };

const EMPTY: AssetInput = {
  assetTag: "",
  serialNumber: "",
  manufacturer: "",
  model: "",
  assetType: "",
  os: "",
  status: "UNKNOWN",
  notes: "",
};

function toInput(asset?: PcAsset): AssetInput {
  if (!asset) {
    return EMPTY;
  }
  return {
    assetTag: asset.assetTag ?? "",
    serialNumber: asset.serialNumber ?? "",
    manufacturer: asset.manufacturer ?? "",
    model: asset.model ?? "",
    assetType: asset.assetType ?? "",
    os: asset.os ?? "",
    status: asset.status,
    notes: asset.notes ?? "",
  };
}

export function AssetForm({
  asset,
  assetTypes,
  onDone,
}: {
  asset?: PcAsset;
  assetTypes: string[];
  onDone?: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<AssetInput>(() => toInput(asset));
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(asset);

  const typeOptions = [...new Set([...assetTypes, ...PC_ASSET_TYPES])];

  function set<K extends keyof AssetInput>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = asset
        ? await updatePcAsset(asset.id, values)
        : await createPcAsset(values);
      if (result.ok) {
        setFeedback({
          tone: "success",
          message: isEdit ? "Équipement mis à jour." : "Équipement créé.",
        });
        if (!isEdit) {
          setValues(EMPTY);
        }
        router.refresh();
        onDone?.();
      } else {
        setFeedback({ tone: "danger", message: result.error });
      }
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {feedback ? <Alert tone={feedback.tone}>{feedback.message}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Numéro d'inventaire"
          htmlFor="asset-tag"
          hint="Identifiant unique (ex. PC-0001)"
        >
          <Input
            id="asset-tag"
            value={values.assetTag}
            onChange={(event) => set("assetTag", event.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field label="Numéro de série" htmlFor="asset-serial">
          <Input
            id="asset-serial"
            value={values.serialNumber}
            onChange={(event) => set("serialNumber", event.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field label="Fabricant" htmlFor="asset-manufacturer">
          <Input
            id="asset-manufacturer"
            value={values.manufacturer}
            onChange={(event) => set("manufacturer", event.target.value)}
          />
        </Field>
        <Field label="Modèle" htmlFor="asset-model">
          <Input
            id="asset-model"
            value={values.model}
            onChange={(event) => set("model", event.target.value)}
          />
        </Field>
        <Field label="Type" htmlFor="asset-type" hint="ex. DESKTOP, LAPTOP…">
          <Input
            id="asset-type"
            list="asset-type-options"
            value={values.assetType}
            onChange={(event) => set("assetType", event.target.value)}
          />
          <datalist id="asset-type-options">
            {typeOptions.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>
        </Field>
        <Field label="Système d'exploitation" htmlFor="asset-os">
          <Input
            id="asset-os"
            value={values.os}
            onChange={(event) => set("os", event.target.value)}
          />
        </Field>
        <Field label="Statut" htmlFor="asset-status">
          <Select
            id="asset-status"
            value={values.status}
            onChange={(event) => set("status", event.target.value)}
          >
            {PC_STATUSES.map((status) => (
              <option key={status.code} value={status.code}>
                {status.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Notes" htmlFor="asset-notes">
        <Textarea
          id="asset-notes"
          value={values.notes}
          onChange={(event) => set("notes", event.target.value)}
        />
      </Field>

      <div className="flex justify-end gap-2">
        {onDone ? (
          <Button variant="ghost" onClick={onDone} disabled={pending}>
            Fermer
          </Button>
        ) : null}
        <Button type="submit" variant="primary" disabled={pending}>
          {isEdit ? "Enregistrer" : "Créer l'équipement"}
        </Button>
      </div>
    </form>
  );
}
