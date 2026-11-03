import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import type { ActivityEntry } from "@/lib/content/types";
import { formatDateTime } from "@/lib/format";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Activity" };

const PAGE_SIZE = 50;
const ACTION = { create: "Added", update: "Updated", delete: "Deleted" };

export default async function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  const { page: raw } = await searchParams;
  const page = Math.max(1, Number(Array.isArray(raw) ? raw[0] : raw) || 1);
  const db = await createSessionClient();
  const { data, count } = await db
    .from("activity_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    .returns<ActivityEntry[]>();
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Activity" description="Every change to your portfolio content, recorded by the database." />
      {!data?.length ? (
        <EmptyState icon={<History className="size-5" />} title="No activity yet" description="Changes you make in the admin will be listed here." />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Item</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{formatDateTime(a.created_at)}</td>
                  <td className="px-4 py-2">{ACTION[a.action]}</td>
                  <td className="px-4 py-2 text-muted-foreground">{a.entity.replace(/_/g, " ")}</td>
                  <td className="max-w-md truncate px-4 py-2">{a.summary || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="mt-4 flex justify-end gap-2">
          {page > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/activity?page=${page - 1}`}>Newer</Link>
            </Button>
          )}
          {page < pages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/activity?page=${page + 1}`}>Older</Link>
            </Button>
          )}
        </div>
      )}
    </>
  );
}
