"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, Loader2, Lock, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { addDocument, deleteDocument, discardUpload, getDocumentLink } from "@/lib/admin/actions";
import type { DocumentRow } from "@/lib/content/types";
import { PRIVATE_BUCKET } from "@/lib/storage";
import { uploadToStorage } from "./fields";
import { ConfirmAction } from "./ui";

/**
 * Certificates, transcripts, offer letters… attached to an entry. Public files are linked from
 * the site; private ones go to a private bucket and only open through short-lived signed links.
 */
export function DocumentsPanel({
  kind,
  parentId,
  documents,
}: {
  kind: "education" | "experience" | "accomplishment";
  parentId: string;
  documents: DocumentRow[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [busy, startTransition] = useTransition();

  function upload(file: File | undefined) {
    if (!file) return;
    if (!title.trim()) {
      toast.error("Give the document a title first.");
      return;
    }
    startTransition(async () => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Files must be 10 MB or smaller.");
        return;
      }
      const uploaded = await uploadToStorage(file, "documents", "image+pdf", isPrivate);
      if (input.current) input.current.value = "";
      if (!uploaded.ok) {
        toast.error(uploaded.error);
        return;
      }
      const saved = await addDocument(kind, parentId, { title, path: uploaded.data.path, isPrivate, mimeType: file.type, size: file.size });
      if (!saved.ok) {
        await discardUpload(uploaded.data.path, isPrivate);
        toast.error(saved.error);
        return;
      }
      setTitle("");
      toast.success("Document added");
      router.refresh();
    });
  }

  async function open(id: string) {
    const result = await getDocumentLink(id);
    if (result.ok) window.open(result.data.url, "_blank", "noopener");
    else toast.error(result.error);
  }

  return (
    <section className="mt-8 border-t pt-6">
      <h3 className="text-sm font-medium">Supporting documents</h3>
      <p className="mt-1 mb-4 text-xs text-muted-foreground">Certificates, transcripts or letters. Private files are never shown on the site.</p>

      {documents.length > 0 && (
        <ul className="mb-4 divide-y rounded-md border">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{doc.title}</span>
              {doc.bucket === PRIVATE_BUCKET ? (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="size-3" /> Private
                </Badge>
              ) : (
                <Badge variant="outline">Public</Badge>
              )}
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => void open(doc.id)} aria-label={`Open ${doc.title}`}>
                <ExternalLink />
              </Button>
              <ConfirmAction title="Delete this document?" description={`“${doc.title}” and its file will be deleted.`} action={() => deleteDocument(doc.id)} onDone={() => router.refresh()}>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Delete ${doc.title}`}>
                  <Trash2 />
                </Button>
              </ConfirmAction>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 rounded-md border border-dashed p-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor={`doc-title-${parentId}`}>Title</Label>
          <Input id={`doc-title-${parentId}`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Degree certificate" />
        </div>
        <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? <Loader2 className="animate-spin" /> : <Upload />} Upload file
        </Button>
        <label className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2">
          <Switch checked={isPrivate} onCheckedChange={setIsPrivate} /> Keep private (only visible to you in the admin)
        </label>
        <input ref={input} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      </div>
    </section>
  );
}
