"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, ArchiveRestore, Loader2, Mail, MailOpen, Reply, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteMessage, setMessageStatus } from "@/lib/admin/actions";
import type { ContactSubmission } from "@/lib/content/types";
import { ConfirmAction } from "./ui";

export function InboxSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
        const next = new URLSearchParams(params);
        if (q) next.set("q", q);
        else next.delete("q");
        next.delete("page");
        next.delete("id");
        router.push(`/admin/messages?${next}`);
      }}
      className="relative"
    >
      <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input name="q" defaultValue={defaultValue} placeholder="Search name, email or text" className="pl-8" />
    </form>
  );
}

/** Opening an unread message marks it as read. */
export function MarkReadOnOpen({ id, unread }: { id: string; unread: boolean }) {
  const router = useRouter();
  const done = useRef(false);
  useEffect(() => {
    if (!unread || done.current) return;
    done.current = true;
    void setMessageStatus(id, "read").then((r) => r.ok && router.refresh());
  }, [id, unread, router]);
  return null;
}

export function MessageActions({ message, listHref }: { message: ContactSubmission; listHref: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function set(status: ContactSubmission["status"], done: string) {
    startTransition(async () => {
      const result = await setMessageStatus(message.id, status);
      if (!result.ok) return void toast.error(result.error);
      toast.success(done);
      if (status === "archived") router.push(listHref);
      else router.refresh();
    });
  }

  const subject = message.subject ? `Re: ${message.subject}` : "Re: your message";
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild>
        <a href={`mailto:${message.email}?subject=${encodeURIComponent(subject)}`}>
          <Reply /> Reply
        </a>
      </Button>
      {message.status === "unread" ? (
        <Button variant="outline" disabled={pending} onClick={() => set("read", "Marked as read")}>
          <MailOpen /> Mark read
        </Button>
      ) : (
        <Button variant="outline" disabled={pending} onClick={() => set("unread", "Marked as unread")}>
          <Mail /> Mark unread
        </Button>
      )}
      {message.status === "archived" ? (
        <Button variant="outline" disabled={pending} onClick={() => set("read", "Moved to inbox")}>
          <ArchiveRestore /> Unarchive
        </Button>
      ) : (
        <Button variant="outline" disabled={pending} onClick={() => set("archived", "Archived")}>
          <Archive /> Archive
        </Button>
      )}
      <ConfirmAction
        title="Delete this message?"
        description={`The message from ${message.name} will be permanently deleted.`}
        action={() => deleteMessage(message.id)}
        onDone={() => router.push(listHref)}
      >
        <Button variant="ghost" disabled={pending} className="text-muted-foreground">
          {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete
        </Button>
      </ConfirmAction>
    </div>
  );
}
