import "server-only";
import type { DocumentRow } from "@/lib/content/types";
import { createSessionClient } from "@/lib/supabase/server";

// Admin reads use the admin's session, so drafts, hidden rows and private tables are included.

type Row = Record<string, unknown> & { id: string; sort_order: number };

export async function loadRows(table: string, select = "*"): Promise<Row[]> {
  const db = await createSessionClient();
  const { data, error } = await db.from(table).select(select).order("sort_order").order("created_at");
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []) as unknown as Row[];
}

export async function loadTechnologyNames(): Promise<string[]> {
  const db = await createSessionClient();
  const { data } = await db.from("technologies").select("name").order("name");
  return (data ?? []).map((t) => t.name as string);
}

export async function loadDocuments(column: "education_id" | "experience_id" | "accomplishment_id") {
  const db = await createSessionClient();
  const { data } = await db.from("documents").select("*").not(column, "is", null).order("sort_order").order("created_at");
  const byParent: Record<string, DocumentRow[]> = {};
  for (const doc of (data ?? []) as DocumentRow[]) {
    const parent = doc[column]!;
    (byParent[parent] ??= []).push(doc);
  }
  return byParent;
}
