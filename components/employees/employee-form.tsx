"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import {
  createEmployee,
  updateEmployee,
  type EmployeeInput,
} from "@/lib/actions/employees";
import type { Employee } from "@/types/employee";

type Feedback = { tone: "success" | "danger"; message: string };

const EMPTY: EmployeeInput = {
  matricule: "",
  firstName: "",
  lastName: "",
  service: "",
  jobTitle: "",
  email: "",
  phone: "",
  location: "",
};

function toInput(employee?: Employee): EmployeeInput {
  if (!employee) {
    return EMPTY;
  }
  return {
    matricule: employee.matricule ?? "",
    firstName: employee.firstName ?? "",
    lastName: employee.lastName ?? "",
    service: employee.service ?? "",
    jobTitle: employee.jobTitle ?? "",
    email: employee.email ?? "",
    phone: employee.phone ?? "",
    location: employee.location ?? "",
  };
}

export function EmployeeForm({
  employee,
  onDone,
}: {
  employee?: Employee;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<EmployeeInput>(() => toInput(employee));
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(employee);

  function set<K extends keyof EmployeeInput>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = employee
        ? await updateEmployee(employee.id, values)
        : await createEmployee(values);
      if (result.ok) {
        setFeedback({
          tone: "success",
          message: isEdit ? "Fiche mise à jour." : "Collaborateur créé.",
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
        <Field label="Matricule" htmlFor="employee-matricule" hint="Identifiant unique">
          <Input
            id="employee-matricule"
            value={values.matricule}
            onChange={(event) => set("matricule", event.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field label="Service" htmlFor="employee-service">
          <Input
            id="employee-service"
            value={values.service}
            onChange={(event) => set("service", event.target.value)}
          />
        </Field>
        <Field label="Prénom" htmlFor="employee-first">
          <Input
            id="employee-first"
            value={values.firstName}
            onChange={(event) => set("firstName", event.target.value)}
          />
        </Field>
        <Field label="Nom" htmlFor="employee-last">
          <Input
            id="employee-last"
            value={values.lastName}
            onChange={(event) => set("lastName", event.target.value)}
          />
        </Field>
        <Field label="Fonction" htmlFor="employee-job">
          <Input
            id="employee-job"
            value={values.jobTitle}
            onChange={(event) => set("jobTitle", event.target.value)}
          />
        </Field>
        <Field label="Localisation" htmlFor="employee-location">
          <Input
            id="employee-location"
            value={values.location}
            onChange={(event) => set("location", event.target.value)}
          />
        </Field>
        <Field label="E-mail" htmlFor="employee-email">
          <Input
            id="employee-email"
            type="email"
            value={values.email}
            onChange={(event) => set("email", event.target.value)}
          />
        </Field>
        <Field label="Téléphone" htmlFor="employee-phone">
          <Input
            id="employee-phone"
            value={values.phone}
            onChange={(event) => set("phone", event.target.value)}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2">
        {onDone ? (
          <Button variant="ghost" onClick={onDone} disabled={pending}>
            Fermer
          </Button>
        ) : null}
        <Button type="submit" variant="primary" disabled={pending}>
          {isEdit ? "Enregistrer" : "Créer le collaborateur"}
        </Button>
      </div>
    </form>
  );
}
