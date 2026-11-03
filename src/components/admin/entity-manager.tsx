"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider } from "react-hook-form";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Inbox, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { deleteEntity, reorderEntity, saveEntity, setVisibility } from "@/lib/admin/actions";
import { getEntity, type EntityKey, type Option } from "@/lib/admin/entities";
import type { DocumentRow } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { DocumentsPanel } from "./documents-panel";
import { FormField, UploadsContext } from "./fields";
import { ConfirmAction, EmptyState } from "./ui";
import { toFormValues, useAdminForm } from "./use-admin-form";

type Row = Record<string, unknown> & { id: string; sort_order: number; is_visible?: boolean };

type Props = {
  entity: EntityKey;
  rows: Row[];
  categories?: Option[];
  technologies?: string[];
  /** Extra label per row id, e.g. a skill's category. */
  tags?: Record<string, string>;
  /** Supporting documents per row id (education, experience, certifications). */
  documents?: Record<string, DocumentRow[]>;
  documentsKind?: "education" | "experience" | "accomplishment";
};

export function EntityManager({ entity, rows: initialRows, categories, technologies, tags, documents, documentsKind }: Props) {
  const config = getEntity(entity)!;
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [syncedFrom, setSyncedFrom] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [, startTransition] = useTransition();

  // Pick up fresh server data after router.refresh() (adjusting state during render, not in an effect).
  if (initialRows !== syncedFrom) {
    setSyncedFrom(initialRows);
    setRows(initialRows);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${config.title(r)} ${config.subtitle?.(r) ?? ""} ${tags?.[r.id] ?? ""}`.toLowerCase().includes(q));
  }, [rows, query, config, tags]);

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const before = rows;
    const next = arrayMove(rows, rows.findIndex((r) => r.id === active.id), rows.findIndex((r) => r.id === over.id));
    setRows(next);
    startTransition(async () => {
      const result = await reorderEntity(entity, next.map((r) => r.id));
      if (!result.ok) {
        setRows(before);
        toast.error(result.error);
      } else toast.success("Order saved");
    });
  }

  function toggleVisible(row: Row, visible: boolean) {
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, is_visible: visible } : r)));
    startTransition(async () => {
      const result = await setVisibility(entity, row.id, visible);
      if (!result.ok) {
        setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, is_visible: !visible } : r)));
        toast.error(result.error);
      }
    });
  }

  const showSearch = rows.length > 6 || config.searchable;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {showSearch && (
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${config.label.toLowerCase()}`} className="pl-8" />
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? config.singular : config.label.toLowerCase()}
          {rows.length > 1 && !query && " · drag to reorder"}
        </p>
        <Button className="ml-auto" onClick={() => setEditing("new")}>
          <Plus /> Add {config.singular}
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-5" />}
          title={`No ${config.label.toLowerCase()} yet`}
          description={config.description}
          action={
            <Button onClick={() => setEditing("new")}>
              <Plus /> Add your first {config.singular}
            </Button>
          }
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={visibleRows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y overflow-hidden rounded-lg border bg-card">
              {visibleRows.map((row) => (
                <SortableRow
                  key={row.id}
                  row={row}
                  title={config.title(row) || "Untitled"}
                  subtitle={[tags?.[row.id], config.subtitle?.(row)].filter(Boolean).join(" · ")}
                  draggable={!query && rows.length > 1}
                  onEdit={() => setEditing(row)}
                  onToggle={(v) => toggleVisible(row, v)}
                  onDelete={() => deleteEntity(entity, row.id)}
                  onDeleted={() => {
                    setRows((rs) => rs.filter((r) => r.id !== row.id));
                    router.refresh();
                  }}
                  singular={config.singular}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="w-full gap-0 p-0 sm:max-w-xl">
          {editing !== null && (
            <EntityForm
              key={editing === "new" ? "new" : editing.id}
              entity={entity}
              row={editing === "new" ? null : editing}
              categories={categories}
              technologies={technologies}
              documents={editing !== "new" && documentsKind ? (documents?.[editing.id] ?? []) : undefined}
              documentsKind={documentsKind}
              onClose={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                router.refresh();
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SortableRow({
  row,
  title,
  subtitle,
  draggable,
  onEdit,
  onToggle,
  onDelete,
  onDeleted,
  singular,
}: {
  row: Row;
  title: string;
  subtitle: string;
  draggable: boolean;
  onEdit: () => void;
  onToggle: (visible: boolean) => void;
  onDelete: () => ReturnType<typeof deleteEntity>;
  onDeleted: () => void;
  singular: string;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: row.id, disabled: !draggable });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-3 bg-card px-3 py-3", isDragging && "relative z-10 shadow-lg")}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className={cn("touch-none text-muted-foreground", draggable ? "cursor-grab active:cursor-grabbing" : "invisible")}
        aria-label={`Reorder ${title}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className={cn("truncate text-sm font-medium", row.is_visible === false && "text-muted-foreground")}>{title}</p>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </button>
      {typeof row.is_visible === "boolean" && (
        <Switch checked={row.is_visible} onCheckedChange={onToggle} aria-label={row.is_visible ? `Hide ${title}` : `Show ${title}`} />
      )}
      <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit ${title}`}>
        <Pencil />
      </Button>
      <ConfirmAction title={`Delete this ${singular}?`} description={`“${title}” will be removed from your portfolio. This can't be undone.`} action={onDelete} onDone={onDeleted}>
        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${title}`}>
          <Trash2 />
        </Button>
      </ConfirmAction>
    </li>
  );
}

function EntityForm({
  entity,
  row,
  categories,
  technologies,
  documents,
  documentsKind,
  onClose,
  onSaved,
}: {
  entity: EntityKey;
  row: Row | null;
  categories?: Option[];
  technologies?: string[];
  documents?: DocumentRow[];
  documentsKind?: "education" | "experience" | "accomplishment";
  onClose: () => void;
  onSaved: () => void;
}) {
  const config = getEntity(entity)!;
  const { form, submit, pending, uploads, discard } = useAdminForm({
    schema: config.schema,
    defaultValues: toFormValues(config.defaults, row),
    save: (values) => saveEntity(entity, row?.id ?? null, values),
    onSaved,
    successMessage: row ? "Changes saved" : `${config.singular[0].toUpperCase()}${config.singular.slice(1)} added`,
  });

  return (
    <UploadsContext.Provider value={uploads}>
      <FormProvider {...form}>
        <form onSubmit={submit} className="flex h-full flex-col" noValidate>
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>{row ? `Edit ${config.singular}` : `Add ${config.singular}`}</SheetTitle>
            <SheetDescription>{config.description}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6" data-lenis-prevent>
            <div className="grid gap-5 sm:grid-cols-2">
              {config.fields.map((field) => (
                <FormField key={field.name} field={field} categories={categories} technologies={technologies} />
              ))}
            </div>
            {documentsKind && row && <DocumentsPanel kind={documentsKind} parentId={row.id} documents={documents ?? []} />}
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                discard();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {row ? "Save changes" : `Add ${config.singular}`}
            </Button>
          </SheetFooter>
        </form>
      </FormProvider>
    </UploadsContext.Provider>
  );
}
