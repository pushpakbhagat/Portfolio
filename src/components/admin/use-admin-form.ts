"use client";

import { useCallback, useMemo, useRef, useTransition, type BaseSyntheticEvent } from "react";
import { useForm, type DefaultValues, type FieldValues, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { discardUpload } from "@/lib/admin/actions";
import type { ActionResult } from "@/lib/admin/result";

/**
 * react-hook-form + Zod for admin forms: instant client validation, server field errors mapped
 * back onto the inputs, success / error toasts, and cleanup of files uploaded but never saved.
 */
export function useAdminForm<T extends FieldValues, R>({
  schema,
  defaultValues,
  save,
  onSaved,
  successMessage = "Saved",
}: {
  schema: z.ZodType;
  defaultValues: T;
  save: (values: T) => Promise<ActionResult<R>>;
  onSaved?: (result: R | undefined) => void;
  successMessage?: string;
}) {
  const form = useForm<T>({
    // raw: submit the values as typed; the Server Action runs the schema (and its transforms) itself.
    resolver: zodResolver(schema as never, undefined, { raw: true }) as never,
    defaultValues: defaultValues as DefaultValues<T>,
  });
  const [pending, startTransition] = useTransition();
  const uploaded = useRef<string[]>([]);

  const uploads = useMemo(() => ({ track: (path: string) => uploaded.current.push(path) }), []);

  /** Deletes uploads that didn't end up in the saved values (replaced, removed or cancelled). */
  const cleanUploads = useCallback((kept: unknown) => {
    const json = JSON.stringify(kept ?? null);
    for (const path of uploaded.current) if (!json.includes(path)) void discardUpload(path);
    uploaded.current = [];
  }, []);

  // Built per event (not during render) because the handlers read the uploads ref.
  const submit = (event?: BaseSyntheticEvent) => form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await save(values);
      if (!result.ok) {
        for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(name as Path<T>, { message });
        }
        toast.error(result.error);
        return;
      }
      cleanUploads(values);
      form.reset(values);
      toast.success(successMessage);
      onSaved?.(result.data as R | undefined);
    });
  }, () => toast.error("Please fix the highlighted fields."))(event);

  return { form, submit, pending, uploads, discard: () => cleanUploads(null) };
}


export { toFormValues } from "@/lib/admin/form-values";
