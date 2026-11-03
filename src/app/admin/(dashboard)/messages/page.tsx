import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import { InboxSearch, MarkReadOnOpen, MessageActions } from "@/components/admin/message-actions";
import { EmptyState, PageHeader, StatusDot } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import type { ContactSubmission } from "@/lib/content/types";
import { formatDateTime, timeAgo } from "@/lib/format";
import { createSessionClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

const PAGE_SIZE = 20;
const FILTERS = [
  { key: "inbox", label: "Inbox" },
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
  { key: "archived", label: "Archived" },
] as const;

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const filter = FILTERS.some((f) => f.key === one(sp.status)) ? one(sp.status) : "inbox";
  const q = one(sp.q).slice(0, 100);
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const selectedId = /^[0-9a-f-]{36}$/.test(one(sp.id)) ? one(sp.id) : "";

  const db = await createSessionClient();
  let query = db
    .from("contact_submissions")
    .select("id, name, email, subject, message, status, read_at, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  query = filter === "inbox" ? query.neq("status", "archived") : query.eq("status", filter);
  // PostgREST filter syntax uses , ( ) and * as delimiters, so strip them from the search term.
  const term = q.replace(/[,()*%\\]/g, " ").trim();
  if (term) query = query.or(["name", "email", "subject", "message"].map((c) => `${c}.ilike.*${term}*`).join(","));

  const [{ data, count }, selected] = await Promise.all([
    query.returns<ContactSubmission[]>(),
    selectedId
      ? db.from("contact_submissions").select("*").eq("id", selectedId).maybeSingle<ContactSubmission>()
      : Promise.resolve({ data: null }),
  ]);
  const messages = data ?? [];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const message = selected.data;

  const href = (changes: Record<string, string | number | null>) => {
    const next = new URLSearchParams();
    const merged = { status: filter === "inbox" ? null : filter, q: q || null, page: page > 1 ? page : null, id: selectedId || null, ...changes };
    for (const [k, v] of Object.entries(merged)) if (v !== null && v !== "") next.set(k, String(v));
    const s = next.toString();
    return `/admin/messages${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Messages" description="Everything sent through your contact form." />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className={cn("lg:col-span-5", message && "hidden lg:block")}>
          <div className="mb-3 space-y-3">
            <InboxSearch defaultValue={q} />
            <nav className="flex gap-1" aria-label="Filter messages">
              {FILTERS.map((f) => (
                <Link
                  key={f.key}
                  href={href({ status: f.key === "inbox" ? null : f.key, page: null, id: null })}
                  className={cn("rounded-md px-2.5 py-1 text-xs", filter === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}
                >
                  {f.label}
                </Link>
              ))}
            </nav>
          </div>

          {messages.length === 0 ? (
            <EmptyState
              icon={<Inbox className="size-5" />}
              title={q ? "No matches" : "Nothing here"}
              description={q ? `No messages match “${q}”.` : "Messages sent from your contact form will appear here."}
            />
          ) : (
            <ul className="divide-y overflow-hidden rounded-lg border bg-card">
              {messages.map((m) => (
                <li key={m.id}>
                  <Link
                    href={href({ id: m.id })}
                    className={cn("block px-4 py-3 transition-colors hover:bg-muted/60", m.id === selectedId && "bg-muted")}
                  >
                    <p className="flex items-center gap-2 text-sm">
                      {m.status === "unread" && <StatusDot tone="signal" />}
                      <span className={cn("truncate", m.status === "unread" ? "font-semibold" : "font-medium")}>{m.name}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{timeAgo(m.created_at)}</span>
                    </p>
                    <p className="truncate text-sm">{m.subject || "(no subject)"}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.message}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {pages > 1 && (
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Page {page} of {pages} · {total} messages
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild disabled={page <= 1}>
                  <Link href={href({ page: page - 1, id: null })} aria-disabled={page <= 1} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
                    Previous
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={href({ page: page + 1, id: null })} aria-disabled={page >= pages} className={page >= pages ? "pointer-events-none opacity-50" : ""}>
                    Next
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className={cn("lg:col-span-7", !message && "hidden lg:block")}>
          {message ? (
            <article className="rounded-lg border bg-card">
              <MarkReadOnOpen id={message.id} unread={message.status === "unread"} />
              <header className="space-y-4 border-b p-5">
                <Link href={href({ id: null })} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground lg:hidden">
                  <ArrowLeft className="size-3" /> All messages
                </Link>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{message.subject || "(no subject)"}</h2>
                  <p className="mt-1 text-sm">
                    {message.name} ·{" "}
                    <a href={`mailto:${message.email}`} className="text-muted-foreground underline-offset-4 hover:underline">
                      {message.email}
                    </a>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(message.created_at)}</p>
                </div>
                <MessageActions message={message} listHref={href({ id: null })} />
              </header>
              <div className="p-5 text-[15px] leading-relaxed whitespace-pre-wrap">{message.message}</div>
            </article>
          ) : (
            <div className="grid h-full min-h-64 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Select a message to read it.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
