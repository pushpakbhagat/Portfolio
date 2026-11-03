"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, FolderKanban, GripVertical, MoreHorizontal, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteProject, reorderEntity, setProjectFeatured, setProjectPublished } from "@/lib/admin/actions";
import { timeAgo } from "@/lib/format";
import { assetUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { ConfirmAction, EmptyState } from "./ui";

export type ProjectRowData = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  thumbnail_path: string | null;
  is_featured: boolean;
  publish_status: "draft" | "published";
  updated_at: string;
  sort_order: number;
};

export function ProjectsTable({ projects: initial }: { projects: ProjectRowData[] }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initial);
  const [synced, setSynced] = useState(initial);
  const [, startTransition] = useTransition();
  if (initial !== synced) {
    setSynced(initial);
    setProjects(initial);
  }
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const patch = (id: string, change: Partial<ProjectRowData>) => setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...change } : p)));

  function run(action: () => Promise<{ ok: boolean; error?: string }>, undo: () => void, success: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        undo();
        toast.error(result.error ?? "Something went wrong.");
      } else {
        toast.success(success);
        router.refresh();
      }
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const before = projects;
    const next = arrayMove(projects, projects.findIndex((p) => p.id === active.id), projects.findIndex((p) => p.id === over.id));
    setProjects(next);
    run(() => reorderEntity("projects", next.map((p) => p.id)), () => setProjects(before), "Order saved");
  }

  if (!projects.length) {
    return (
      <EmptyState
        icon={<FolderKanban className="size-5" />}
        title="No projects yet"
        description="Add your first project. It stays a draft until you publish it."
        action={
          <Button asChild>
            <Link href="/admin/projects/new">
              <Plus /> New project
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <ul className="divide-y overflow-hidden rounded-lg border bg-card">
          {projects.map((p) => (
            <Row
              key={p.id}
              project={p}
              onFeature={() => {
                patch(p.id, { is_featured: !p.is_featured });
                run(() => setProjectFeatured(p.id, !p.is_featured), () => patch(p.id, { is_featured: p.is_featured }), p.is_featured ? "Removed from featured" : "Marked as featured");
              }}
              onPublish={() => {
                const publish = p.publish_status !== "published";
                patch(p.id, { publish_status: publish ? "published" : "draft" });
                run(() => setProjectPublished(p.id, publish), () => patch(p.id, { publish_status: p.publish_status }), publish ? "Published" : "Moved to drafts");
              }}
              onDeleted={() => {
                setProjects((ps) => ps.filter((x) => x.id !== p.id));
                router.refresh();
              }}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function Row({ project: p, onFeature, onPublish, onDeleted }: { project: ProjectRowData; onFeature: () => void; onPublish: () => void; onDeleted: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });
  const thumb = assetUrl(p.thumbnail_path);
  const published = p.publish_status === "published";

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("flex items-center gap-3 bg-card px-3 py-3", isDragging && "relative z-10 shadow-lg")}>
      <button ref={setActivatorNodeRef} type="button" className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing" aria-label={`Reorder ${p.title}`} {...attributes} {...listeners}>
        <GripVertical className="size-4" />
      </button>
      <div className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-sm border bg-muted">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
          <img src={thumb} alt="" className="size-full object-cover" />
        ) : (
          <span className="serif-accent text-lg text-muted-foreground">{p.title.slice(0, 1)}</span>
        )}
      </div>
      <Link href={`/admin/projects/${p.id}`} className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-medium">
          {p.title}
          {p.is_featured && <Star className="size-3.5 fill-signal text-signal" aria-label="Featured" />}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          /projects/{p.slug} · edited {timeAgo(p.updated_at)}
        </p>
      </Link>
      <Badge variant={published ? "default" : "secondary"} className="hidden sm:inline-flex">
        {published ? "Published" : "Draft"}
      </Badge>
      <Button variant="ghost" size="icon-sm" asChild aria-label={`Edit ${p.title}`}>
        <Link href={`/admin/projects/${p.id}`}>
          <Pencil />
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${p.title}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onPublish}>{published ? "Unpublish (move to drafts)" : "Publish"}</DropdownMenuItem>
          <DropdownMenuItem onSelect={onFeature}>
            <Star /> {p.is_featured ? "Remove from featured" : "Mark as featured"}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/admin/projects/${p.id}/preview`} target="_blank">
              <Eye /> Preview
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <ConfirmAction title="Delete this project?" description={`“${p.title}”, its screenshots and its case study will be deleted. This can't be undone.`} action={() => deleteProject(p.id)} onDone={onDeleted}>
            <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </ConfirmAction>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
