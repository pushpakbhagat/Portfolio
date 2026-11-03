"use client";

import { createContext, useContext, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Controller, get, useFieldArray, useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp, FileText, ImagePlus, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Prose } from "@/components/site/prose";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadFile } from "@/lib/admin/actions";
import type { FieldDef, Option } from "@/lib/admin/entities";
import { assetUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

// Uploads made while a form is open, so the form can delete the ones that never get saved.
export const UploadsContext = createContext<{ track: (path: string) => void } | null>(null);

export function FieldShell({
  label,
  htmlFor,
  description,
  error,
  wide,
  children,
}: {
  label: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", wide && "sm:col-span-2")}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function useFieldError(name: string): string | undefined {
  const {
    formState: { errors },
  } = useFormContext();
  return (get(errors, name) as { message?: string } | undefined)?.message;
}

export function FormField({ field, categories = [], technologies = [] }: { field: FieldDef; categories?: Option[]; technologies?: string[] }) {
  const id = useId();
  const { register, control } = useFormContext();
  const error = useFieldError(field.name);
  const shell = { label: field.label, htmlFor: id, description: field.description, error, wide: field.wide };

  switch (field.type) {
    case "text":
    case "url":
    case "email":
    case "date":
    case "number":
      return (
        <FieldShell {...shell}>
          <Input
            id={id}
            type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "text" ? "text" : field.type}
            step={field.type === "number" ? "0.5" : undefined}
            placeholder={field.placeholder}
            aria-invalid={Boolean(error)}
            {...register(field.name)}
          />
        </FieldShell>
      );
    case "textarea":
      return (
        <FieldShell {...shell}>
          <Textarea id={id} rows={4} placeholder={field.placeholder} aria-invalid={Boolean(error)} {...register(field.name)} />
        </FieldShell>
      );
    case "markdown":
      return <MarkdownField id={id} name={field.name} shell={shell} placeholder={field.placeholder} />;
    case "select": {
      const opts = field.options === "skill_categories" ? categories : field.options;
      return (
        <FieldShell {...shell}>
          <Controller
            control={control}
            name={field.name}
            render={({ field: f }) => (
              <Select value={(f.value as string) || "__none"} onValueChange={(v) => f.onChange(v === "__none" ? null : v)}>
                <SelectTrigger id={id} className="w-full" aria-invalid={Boolean(error)}>
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  {field.allowEmpty && <SelectItem value="__none">— None —</SelectItem>}
                  {opts.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldShell>
      );
    }
    case "switch":
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: f }) => (
            <label htmlFor={id} className={cn("flex items-center justify-between gap-4 rounded-md border px-3 py-2.5", field.wide && "sm:col-span-2")}>
              <span className="text-sm">
                {field.label}
                {field.description && <span className="block text-xs text-muted-foreground">{field.description}</span>}
              </span>
              <Switch id={id} checked={Boolean(f.value)} onCheckedChange={f.onChange} />
            </label>
          )}
        />
      );
    case "list":
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: f }) => (
            <FieldShell {...shell}>
              <ListInput value={(f.value as string[]) ?? []} onChange={f.onChange} itemLabel={field.itemLabel} />
            </FieldShell>
          )}
        />
      );
    case "tags":
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: f }) => (
            <FieldShell {...shell} description={field.description ?? "Press Enter or comma to add."}>
              <TagsInput id={id} value={(f.value as string[]) ?? []} onChange={f.onChange} suggestions={technologies} />
            </FieldShell>
          )}
        />
      );
    case "links":
      return (
        <FieldShell {...shell}>
          <LinksInput name={field.name} />
        </FieldShell>
      );
    case "image":
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: f }) => (
            <FieldShell {...shell}>
              <FileInput value={(f.value as string | null) ?? null} onChange={f.onChange} folder={field.folder} accept={field.accept ?? "image"} />
            </FieldShell>
          )}
        />
      );
  }
}

type ShellProps = Omit<Parameters<typeof FieldShell>[0], "children">;

function MarkdownField({ id, name, shell, placeholder }: { id: string; name: string; shell: ShellProps; placeholder?: string }) {
  const { register, watch } = useFormContext();
  const [preview, setPreview] = useState(false);
  const value = (watch(name) as string) ?? "";
  return (
    <FieldShell {...shell} description={shell.description ?? "Markdown: **bold**, *italic*, - lists, [links](https://…). Blank line = new paragraph."}>
      <div className="overflow-hidden rounded-md border">
        <div className="flex border-b bg-muted/40 text-xs">
          {["Write", "Preview"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setPreview(tab === "Preview")}
              className={cn("px-3 py-1.5", (tab === "Preview") === preview ? "bg-background font-medium" : "text-muted-foreground")}
            >
              {tab}
            </button>
          ))}
        </div>
        {preview ? (
          <div className="min-h-32 p-3">{value.trim() ? <Prose className="text-sm">{value}</Prose> : <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>}</div>
        ) : (
          <Textarea id={id} rows={7} placeholder={placeholder} className="rounded-none border-0 shadow-none focus-visible:ring-0" {...register(name)} />
        )}
      </div>
    </FieldShell>
  );
}

/** Ordered list of short strings (features, responsibilities, coursework). */
export function ListInput({ value, onChange, itemLabel }: { value: string[]; onChange: (v: string[]) => void; itemLabel: string }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const update = (i: number, v: string) => onChange(value.map((x, j) => (j === i ? v : x)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  const add = (at = value.length) => {
    onChange([...value.slice(0, at), "", ...value.slice(at)]);
    requestAnimationFrame(() => refs.current[at]?.focus());
  };

  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="w-6 shrink-0 text-right font-mono text-xs text-muted-foreground">{i + 1}</span>
          <Input
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={item}
            onChange={(e) => update(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(i + 1);
              }
            }}
            onPaste={(e) => {
              const lines = e.clipboardData.getData("text").split(/\r?\n/).map((l) => l.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean);
              if (lines.length > 1) {
                // A pasted multi-line list becomes one item per line.
                e.preventDefault();
                onChange([...value.slice(0, i), ...(item ? [item] : []), ...lines, ...value.slice(i + 1)]);
              }
            }}
            placeholder={`Add a ${itemLabel}`}
          />
          <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
            <ArrowUp />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
            <ArrowDown />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove ${itemLabel}`}>
            <X />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => add()}>
        <Plus /> Add {itemLabel}
      </Button>
      {value.length === 0 && <p className="text-xs text-muted-foreground">Tip: paste a list with one item per line.</p>}
    </div>
  );
}

/** Label + href pairs (site navigation). */
function LinksInput({ name }: { name: string }) {
  const { control, register } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const errors = useFormContext().formState.errors;
  return (
    <div className="space-y-2">
      {fields.map((f, i) => {
        const err = get(errors, `${name}.${i}`) as { label?: { message?: string }; href?: { message?: string } } | undefined;
        return (
          <div key={f.id} className="space-y-1">
            <div className="flex items-center gap-1">
              <Input placeholder="Label" className="w-36" {...register(`${name}.${i}.label`)} aria-invalid={Boolean(err?.label)} />
              <Input placeholder="#about or /projects/…" {...register(`${name}.${i}.href`)} aria-invalid={Boolean(err?.href)} />
              <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">
                <ArrowUp />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} aria-label="Move down">
                <ArrowDown />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(i)} aria-label="Remove link">
                <X />
              </Button>
            </div>
            {(err?.label || err?.href) && <p className="text-xs text-destructive">{err.label?.message ?? err.href?.message}</p>}
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ label: "", href: "#" })} disabled={fields.length >= 8}>
        <Plus /> Add link
      </Button>
    </div>
  );
}

export function TagsInput({
  id,
  value,
  onChange,
  suggestions = [],
}: {
  id?: string;
  value: string[];
  onChange: (v: string[]) => void;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");
  const listId = useId();
  const add = (raw: string) => {
    const names = raw.split(",").map((t) => t.trim()).filter(Boolean);
    const next = [...value];
    for (const n of names) if (!next.some((v) => v.toLowerCase() === n.toLowerCase())) next.push(n);
    onChange(next);
    setDraft("");
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (draft.trim()) add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring/40">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-0.5 text-xs">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`} className="text-muted-foreground hover:text-foreground">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        list={listId}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && add(draft)}
        placeholder={value.length ? "" : "React, Node.js, PostgreSQL…"}
        className="min-w-24 flex-1 bg-transparent text-sm outline-none"
      />
      <datalist id={listId}>
        {suggestions.filter((s) => !value.includes(s)).map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}

export async function uploadToStorage(file: File, folder: string, accept: "image" | "image+pdf" = "image") {
  const form = new FormData();
  form.set("file", file);
  form.set("folder", folder);
  form.set("accept", accept);
  return uploadFile(form);
}

/** Upload with preview. Value is the storage path; the file is validated again on the server. */
export function FileInput({
  value,
  onChange,
  folder,
  accept,
}: {
  value: string | null;
  onChange: (path: string | null) => void;
  folder: string;
  accept: "image" | "image+pdf";
}) {
  const uploads = useContext(UploadsContext);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const url = assetUrl(value);
  const isPdf = value?.endsWith(".pdf");
  const mime = folder === "resume" ? "application/pdf" : accept === "image+pdf" ? "image/*,application/pdf" : "image/*";

  async function pick(file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Files must be 10 MB or smaller.");
      return;
    }
    setBusy(true);
    const result = await uploadToStorage(file, folder, accept);
    setBusy(false);
    if (input.current) input.current.value = "";
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    uploads?.track(result.data.path);
    onChange(result.data.path);
  }

  return (
    <div
      className="flex items-center gap-4 rounded-md border border-dashed p-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void pick(e.dataTransfer.files[0]);
      }}
    >
      <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-sm bg-muted">
        {busy ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : url && !isPdf ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview of any uploaded format, incl. SVG
          <img src={url} alt="" className="size-full object-cover" />
        ) : url ? (
          <FileText className="size-6 text-muted-foreground" />
        ) : (
          <ImagePlus className="size-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
            <Upload /> {value ? "Replace" : "Upload"}
          </Button>
          {value && (
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => onChange(null)}>
              <Trash2 /> Remove
            </Button>
          )}
          {url && (
            <a href={url} target="_blank" rel="noreferrer" className="self-center text-xs text-muted-foreground underline-offset-4 hover:underline">
              Open
            </a>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {folder === "resume" ? "PDF" : accept === "image+pdf" ? "Image or PDF" : "PNG, JPG, WebP, AVIF, GIF or SVG"}, up to 10 MB. Drop a file here.
        </p>
      </div>
      <input ref={input} type="file" accept={mime} className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
    </div>
  );
}
