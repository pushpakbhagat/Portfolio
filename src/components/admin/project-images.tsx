"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addProjectImage, deleteProjectImage, discardUpload, reorderEntity, updateProjectImage } from "@/lib/admin/actions";
import { assetUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { uploadToStorage } from "./fields";
import { ConfirmAction } from "./ui";

export type AdminImage = { id: string; path: string; alt: string; caption: string; sort_order: number };

function dimensions(file: File): Promise<{ width: number; height: number } | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => resolve(undefined);
    img.src = url;
  });
}

/** Screenshot gallery for a project. Changes save immediately (separate from the main form). */
export function ProjectImages({ projectId, images: initial }: { projectId: string; images: AdminImage[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initial);
  const [synced, setSynced] = useState(initial);
  const [uploading, setUploading] = useState(0);
  const [, startTransition] = useTransition();
  if (initial !== synced) {
    setSynced(initial);
    setImages(initial);
  }
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  async function addFiles(files: FileList | null) {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploading(list.length);
    for (const file of list) {
      const [uploaded, dims] = await Promise.all([uploadToStorage(file, "screenshots"), dimensions(file)]);
      if (!uploaded.ok) {
        toast.error(`${file.name}: ${uploaded.error}`);
      } else {
        const saved = await addProjectImage(projectId, { path: uploaded.data.path, ...dims });
        if (!saved.ok) {
          await discardUpload(uploaded.data.path);
          toast.error(saved.error);
        }
      }
      setUploading((n) => n - 1);
    }
    if (input.current) input.current.value = "";
    toast.success(list.length === 1 ? "Screenshot added" : "Screenshots added");
    router.refresh();
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const before = images;
    const next = arrayMove(images, images.findIndex((i) => i.id === active.id), images.findIndex((i) => i.id === over.id));
    setImages(next);
    startTransition(async () => {
      const result = await reorderEntity("project_images", next.map((i) => i.id));
      if (!result.ok) {
        setImages(before);
        toast.error(result.error);
      }
    });
  }

  return (
    <section className="rounded-lg border bg-card">
      <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
        <div>
          <h2 className="font-medium">Screenshots</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Shown in the case study. The first one is shown largest. Drag to reorder; edits save on their own.</p>
        </div>
        <Button type="button" variant="outline" disabled={uploading > 0} onClick={() => input.current?.click()}>
          {uploading > 0 ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          {uploading > 0 ? `Uploading ${uploading}…` : "Add images"}
        </Button>
        <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void addFiles(e.target.files)} />
      </header>
      <div
        className="p-5"
        onDragOver={(e) => e.dataTransfer.types.includes("Files") && e.preventDefault()}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          void addFiles(e.dataTransfer.files);
        }}
      >
        {images.length === 0 ? (
          <p className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">No screenshots yet. Drop images here or use “Add images”.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((image, i) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    first={i === 0}
                    onDeleted={() => {
                      setImages((list) => list.filter((x) => x.id !== image.id));
                      router.refresh();
                    }}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </section>
  );
}

function ImageCard({ image, first, onDeleted }: { image: AdminImage; first: boolean; onDeleted: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });
  const [alt, setAlt] = useState(image.alt);
  const [caption, setCaption] = useState(image.caption);

  async function save(field: "alt" | "caption", value: string) {
    if (value === image[field]) return;
    const result = await updateProjectImage(image.id, { alt, caption, [field]: value });
    if (result.ok) toast.success("Saved");
    else toast.error(result.error);
  }

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("overflow-hidden rounded-md border bg-background", isDragging && "relative z-10 shadow-lg")}>
      <div className="relative aspect-[16/10] bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
        <img src={assetUrl(image.path) ?? ""} alt={alt} className="size-full object-cover" />
        {first && <span className="absolute top-2 left-2 rounded-sm bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">Lead image</span>}
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="absolute top-2 right-2 grid size-7 cursor-grab touch-none place-items-center rounded-sm bg-background/90 active:cursor-grabbing"
          aria-label="Reorder screenshot"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </div>
      <div className="space-y-2 p-3">
        <Input value={alt} onChange={(e) => setAlt(e.target.value)} onBlur={(e) => void save("alt", e.target.value)} placeholder="Alt text (describe the image)" />
        <Input value={caption} onChange={(e) => setCaption(e.target.value)} onBlur={(e) => void save("caption", e.target.value)} placeholder="Caption (optional)" />
        <ConfirmAction title="Delete this screenshot?" description="The image file will be deleted too." action={() => deleteProjectImage(image.id)} onDone={onDeleted}>
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
            <Trash2 /> Delete
          </Button>
        </ConfirmAction>
      </div>
    </li>
  );
}
