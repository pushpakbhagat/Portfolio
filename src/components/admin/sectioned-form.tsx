"use client";

import { useRouter } from "next/navigation";
import { FormProvider } from "react-hook-form";
import { Loader2 } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import type { FieldDef } from "@/lib/admin/entities";
import type { ActionResult } from "@/lib/admin/result";
import { FormField, UploadsContext } from "./fields";
import { useAdminForm } from "./use-admin-form";

export type FormGroup = { id?: string; title: string; description?: string; fields: FieldDef[] };

/** A long single-record form (profile, settings) split into titled groups with a sticky save bar. */
export function SectionedForm({
  groups,
  schema,
  defaultValues,
  save,
}: {
  groups: FormGroup[];
  schema: z.ZodType;
  defaultValues: Record<string, unknown>;
  save: (values: Record<string, unknown>) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const { form, submit, pending, uploads } = useAdminForm({
    schema,
    defaultValues,
    save,
    onSaved: () => router.refresh(),
    successMessage: "Saved. The site is updated.",
  });
  const dirty = form.formState.isDirty;

  return (
    <UploadsContext.Provider value={uploads}>
      <FormProvider {...form}>
        <form onSubmit={submit} noValidate className="space-y-6">
          {groups.map((group) => (
            <section key={group.title} id={group.id} className="scroll-mt-20 rounded-lg border bg-card">
              <header className="border-b px-5 py-4">
                <h2 className="font-medium">{group.title}</h2>
                {group.description && <p className="mt-0.5 text-sm text-muted-foreground">{group.description}</p>}
              </header>
              <div className="grid gap-5 p-5 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <FormField key={field.name} field={field} />
                ))}
              </div>
            </section>
          ))}

          <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-3 border-t bg-background/95 px-4 py-3 lg:-mx-8 lg:px-8">
            <p className="mr-auto text-xs text-muted-foreground">{dirty ? "You have unsaved changes." : "All changes saved."}</p>
            <Button type="button" variant="outline" disabled={!dirty || pending} onClick={() => form.reset()}>
              Discard
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </FormProvider>
    </UploadsContext.Provider>
  );
}
