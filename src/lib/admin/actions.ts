"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { assertAdmin, NotAuthorizedError } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { PRIVATE_BUCKET, PUBLIC_BUCKET, assetUrl } from "@/lib/storage";
import { getEntity } from "./entities";
import { fieldErrorsOf, type ActionResult } from "./result";
import { profileSchema, projectImageSchema, projectSchema, settingsSchema } from "./schemas";

// Every action: (1) checks the caller is an admin, (2) validates input with the same schema the
// form used, (3) writes with the admin's own session so Row Level Security checks again, and
// (4) rebuilds the public pages so changes appear immediately.

type Db = SupabaseClient;

class UserError extends Error {}

async function run<T>(fn: (db: Db) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    await assertAdmin();
    return await fn(await createSessionClient());
  } catch (error) {
    if (error instanceof NotAuthorizedError || error instanceof UserError) return { ok: false, error: error.message };
    console.error("[admin action]", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

function check(error: PostgrestError | null) {
  if (!error) return;
  if (error.code === "23505") throw new UserError("That already exists. Names and slugs must be unique.");
  if (error.code === "23514") throw new UserError("Some values are not allowed. Please check the form.");
  if (error.code === "42501") throw new UserError("You don't have permission to do that.");
  throw new Error(`${error.code}: ${error.message}`);
}

function refreshSite() {
  revalidatePath("/", "layout");
}

async function removeFiles(db: Db, paths: (string | null | undefined)[]) {
  const list = paths.filter((p): p is string => Boolean(p) && !/^https?:\/\//.test(p!));
  if (!list.length) return;
  const { error } = await db.storage.from(PUBLIC_BUCKET).remove(list);
  if (error) console.warn("[admin] could not delete files:", error.message);
}

async function nextSortOrder(db: Db, table: string, filter?: [string, string]) {
  let query = db.from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
  if (filter) query = query.eq(filter[0], filter[1]);
  const { data } = await query;
  return ((data?.[0]?.sort_order as number | undefined) ?? 0) + 1;
}

// List modules ------------------------------------------------------------------------------------

export async function saveEntity(key: string, id: string | null, values: unknown): Promise<ActionResult<{ id: string }>> {
  return run<{ id: string }>(async (db) => {
    const config = getEntity(key);
    if (!config) throw new UserError("Unknown content type.");
    const parsed = config.schema.safeParse(values);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };

    const { technologies, ...row } = parsed.data as Record<string, unknown> & { technologies?: string[] };
    const fileFields = config.fileFields ?? [];
    let savedId = id;

    if (id) {
      const { data: before } = await db.from(config.table).select(fileFields.join(",") || "id").eq("id", id).maybeSingle();
      const { error } = await db.from(config.table).update(row).eq("id", id);
      check(error);
      const old = (before ?? {}) as unknown as Record<string, string | null>;
      await removeFiles(db, fileFields.filter((f) => old[f] && old[f] !== row[f]).map((f) => old[f]));
    } else {
      const sort_order = await nextSortOrder(db, config.table);
      const { data, error } = await db.from(config.table).insert({ ...row, sort_order }).select("id").single();
      check(error);
      savedId = data!.id as string;
    }

    if (config.tagsKind && technologies) {
      const { error } = await db.rpc("set_technologies", { owner_kind: config.tagsKind, owner_id: savedId, names: technologies });
      check(error);
    }
    refreshSite();
    return { ok: true, data: { id: savedId! } };
  });
}

export async function deleteEntity(key: string, id: string): Promise<ActionResult> {
  return run(async (db) => {
    const config = getEntity(key);
    if (!config) throw new UserError("Unknown content type.");
    const fileFields = config.fileFields ?? [];
    const { data: before } = await db.from(config.table).select(fileFields.join(",") || "id").eq("id", id).maybeSingle();
    const { error } = await db.from(config.table).delete().eq("id", id);
    check(error);
    const old = (before ?? {}) as unknown as Record<string, string | null>;
    await removeFiles(db, fileFields.map((f) => old[f]));
    refreshSite();
    return { ok: true };
  });
}

export async function reorderEntity(key: string, ids: string[]): Promise<ActionResult> {
  return run(async (db) => {
    const table = key === "projects" || key === "project_images" ? key : getEntity(key)?.table;
    if (!table) throw new UserError("Unknown content type.");
    const { error } = await db.rpc("reorder", { table_name: table, ids });
    check(error);
    refreshSite();
    return { ok: true };
  });
}

export async function setVisibility(key: string, id: string, visible: boolean): Promise<ActionResult> {
  return run(async (db) => {
    const config = getEntity(key);
    if (!config) throw new UserError("Unknown content type.");
    const { error } = await db.from(config.table).update({ is_visible: visible }).eq("id", id);
    check(error);
    refreshSite();
    return { ok: true };
  });
}

// Profile and settings ----------------------------------------------------------------------------

export async function saveProfile(values: unknown): Promise<ActionResult> {
  return run(async (db) => {
    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
    const { data: before } = await db.from("profile").select("photo_path, resume_path").eq("id", 1).maybeSingle();
    const { error } = await db.from("profile").upsert({ id: 1, ...parsed.data });
    check(error);
    await removeFiles(db, [
      before?.photo_path !== parsed.data.photo_path ? before?.photo_path : null,
      before?.resume_path !== parsed.data.resume_path ? before?.resume_path : null,
    ]);
    refreshSite();
    return { ok: true };
  });
}

export async function saveSettings(values: unknown): Promise<ActionResult> {
  return run(async (db) => {
    const parsed = settingsSchema.safeParse(values);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
    const { notification_email, ...settings } = parsed.data;
    const { data: before } = await db.from("site_settings").select("og_image_path, logo_path, favicon_path").eq("id", 1).maybeSingle();
    const [a, b] = await Promise.all([
      db.from("site_settings").upsert({ id: 1, ...settings }),
      db.from("admin_settings").upsert({ id: 1, notification_email }),
    ]);
    check(a.error);
    check(b.error);
    const old = (before ?? {}) as Record<string, string | null>;
    await removeFiles(
      db,
      (["og_image_path", "logo_path", "favicon_path"] as const).filter((f) => old[f] !== settings[f]).map((f) => old[f]),
    );
    refreshSite();
    return { ok: true };
  });
}

// Projects ----------------------------------------------------------------------------------------

export async function saveProject(id: string | null, values: unknown): Promise<ActionResult<{ id: string }>> {
  return run<{ id: string }>(async (db) => {
    const parsed = projectSchema.safeParse(values);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
    const { technologies, ...row } = parsed.data;
    let savedId = id;

    if (id) {
      const { data: before } = await db.from("projects").select("thumbnail_path").eq("id", id).maybeSingle();
      const { error } = await db.from("projects").update(row).eq("id", id);
      check(error);
      if (before?.thumbnail_path && before.thumbnail_path !== row.thumbnail_path) await removeFiles(db, [before.thumbnail_path]);
    } else {
      const sort_order = await nextSortOrder(db, "projects");
      const { data, error } = await db
        .from("projects")
        .insert({ ...row, sort_order, publish_status: "draft" })
        .select("id")
        .single();
      check(error);
      savedId = data!.id;
    }

    const { error } = await db.rpc("set_technologies", { owner_kind: "project", owner_id: savedId, names: technologies });
    check(error);
    refreshSite();
    return { ok: true, data: { id: savedId! } };
  });
}

export async function setProjectPublished(id: string, published: boolean): Promise<ActionResult> {
  return run(async (db) => {
    const { data: project } = await db.from("projects").select("published_at").eq("id", id).maybeSingle();
    const { error } = await db
      .from("projects")
      .update({
        publish_status: published ? "published" : "draft",
        published_at: published ? (project?.published_at ?? new Date().toISOString()) : project?.published_at,
      })
      .eq("id", id);
    check(error);
    refreshSite();
    return { ok: true };
  });
}

export async function setProjectFeatured(id: string, featured: boolean): Promise<ActionResult> {
  return run(async (db) => {
    const { error } = await db.from("projects").update({ is_featured: featured }).eq("id", id);
    check(error);
    refreshSite();
    return { ok: true };
  });
}

export async function deleteProject(id: string): Promise<ActionResult> {
  return run(async (db) => {
    const [{ data: project }, { data: images }] = await Promise.all([
      db.from("projects").select("thumbnail_path").eq("id", id).maybeSingle(),
      db.from("project_images").select("path").eq("project_id", id),
    ]);
    const { error } = await db.from("projects").delete().eq("id", id);
    check(error);
    await removeFiles(db, [project?.thumbnail_path, ...(images ?? []).map((i) => i.path)]);
    refreshSite();
    return { ok: true };
  });
}

export async function addProjectImage(
  projectId: string,
  image: { path: string; width?: number; height?: number },
): Promise<ActionResult<{ id: string }>> {
  return run<{ id: string }>(async (db) => {
    const sort_order = await nextSortOrder(db, "project_images", ["project_id", projectId]);
    const dims = (n?: number) => (n && Number.isInteger(n) && n > 0 && n < 20000 ? n : null);
    const { data, error } = await db
      .from("project_images")
      .insert({ project_id: projectId, path: image.path, width: dims(image.width), height: dims(image.height), sort_order })
      .select("id")
      .single();
    check(error);
    refreshSite();
    return { ok: true, data: { id: data!.id } };
  });
}

export async function updateProjectImage(id: string, values: unknown): Promise<ActionResult> {
  return run(async (db) => {
    const parsed = projectImageSchema.safeParse(values);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
    const { error } = await db.from("project_images").update(parsed.data).eq("id", id);
    check(error);
    refreshSite();
    return { ok: true };
  });
}

export async function deleteProjectImage(id: string): Promise<ActionResult> {
  return run(async (db) => {
    const { data: image } = await db.from("project_images").select("path").eq("id", id).maybeSingle();
    const { error } = await db.from("project_images").delete().eq("id", id);
    check(error);
    await removeFiles(db, [image?.path]);
    refreshSite();
    return { ok: true };
  });
}

// Uploads -----------------------------------------------------------------------------------------

const MAX_BYTES = 10 * 1024 * 1024;
const TYPES: Record<string, { ext: string; magic?: number[][] }> = {
  "image/png": { ext: "png", magic: [[0x89, 0x50, 0x4e, 0x47]] },
  "image/jpeg": { ext: "jpg", magic: [[0xff, 0xd8, 0xff]] },
  "image/webp": { ext: "webp", magic: [[0x52, 0x49, 0x46, 0x46]] },
  "image/gif": { ext: "gif", magic: [[0x47, 0x49, 0x46, 0x38]] },
  "image/avif": { ext: "avif" },
  "image/svg+xml": { ext: "svg" },
  "image/x-icon": { ext: "ico", magic: [[0x00, 0x00, 0x01, 0x00]] },
  "image/vnd.microsoft.icon": { ext: "ico", magic: [[0x00, 0x00, 0x01, 0x00]] },
  "application/pdf": { ext: "pdf", magic: [[0x25, 0x50, 0x44, 0x46]] },
};
const FOLDERS = new Set(["profile", "resume", "projects", "screenshots", "logos", "icons", "certificates", "documents", "site"]);

const EXTENSIONS = Object.fromEntries(Object.entries(TYPES).map(([mime, t]) => [t.ext, mime]));
const UPLOAD_PATH = /^[a-z]+\/[0-9a-f-]{36}\.[a-z]+$/;

/**
 * Upload step 1 of 2. Checks the file's declared type, size and destination, then returns a
 * one-time signed URL so the browser can send the bytes straight to Storage. Files never pass
 * through this server, so hosting request-size limits (Netlify: about 6 MB) don't apply. The file
 * gets a random name: nothing about the original file name reaches the URL.
 */
export async function createUpload(input: {
  folder: string;
  type: string;
  size: number;
  accept?: "image" | "image+pdf";
  isPrivate?: boolean;
}): Promise<ActionResult<{ bucket: string; path: string; token: string }>> {
  return run<{ bucket: string; path: string; token: string }>(async (db) => {
    const { folder, size } = input;
    const allowPdf = input.accept === "image+pdf" || folder === "resume" || folder === "documents";
    if (!FOLDERS.has(folder)) throw new UserError("Unknown upload location.");
    if (!Number.isFinite(size) || size <= 0) throw new UserError("Choose a file to upload.");
    if (size > MAX_BYTES) throw new UserError("Files must be 10 MB or smaller.");
    const type = TYPES[input.type];
    if (!type || (input.type === "application/pdf" && !allowPdf) || (folder === "resume" && input.type !== "application/pdf")) {
      throw new UserError(folder === "resume" ? "Upload your resume as a PDF." : "Use a PNG, JPG, WebP, AVIF, GIF, SVG or PDF file.");
    }

    const bucket = input.isPrivate ? PRIVATE_BUCKET : PUBLIC_BUCKET;
    const path = `${folder}/${randomUUID()}.${type.ext}`;
    const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) throw new UserError(`Upload failed: ${error?.message ?? "no upload link"}`);
    return { ok: true, data: { bucket, path, token: data.token } };
  });
}

/**
 * Upload step 2 of 2. Reads back what was stored and checks the bytes really are the declared
 * type (and that SVGs carry no scripts); anything that fails is deleted. While the file is being
 * written, the bucket itself also enforces the 10 MB limit and the allowed content types.
 */
export async function finishUpload(input: { bucket: string; path: string }): Promise<ActionResult<{ path: string; url: string | null }>> {
  return run<{ path: string; url: string | null }>(async (db) => {
    const { bucket, path } = input;
    if (bucket !== PUBLIC_BUCKET && bucket !== PRIVATE_BUCKET) throw new UserError("Unknown bucket.");
    if (!UPLOAD_PATH.test(path)) throw new UserError("Invalid path.");
    const mime = EXTENSIONS[path.split(".").pop()!];
    const type = mime ? TYPES[mime] : undefined;

    const { data: blob, error } = await db.storage.from(bucket).download(path);
    if (error || !blob) throw new UserError("The upload didn't arrive. Please try again.");
    const bytes = new Uint8Array(await blob.arrayBuffer());

    let problem = "";
    if (!type || bytes.length === 0 || bytes.length > MAX_BYTES) {
      problem = "The file is empty, too large or of an unknown type.";
    } else if (type.magic && !type.magic.some((sig) => sig.every((b, i) => bytes[i] === b))) {
      problem = "The file's contents don't match its type.";
    } else if (mime === "image/svg+xml") {
      const svg = new TextDecoder().decode(bytes);
      if (!/<svg[\s>]/i.test(svg) || /<script|javascript:|\son\w+\s*=|<foreignObject/i.test(svg)) {
        problem = "This SVG contains scripts or is not a valid SVG.";
      }
    }
    if (problem) {
      await db.storage.from(bucket).remove([path]);
      throw new UserError(problem);
    }
    return { ok: true, data: { path, url: bucket === PUBLIC_BUCKET ? assetUrl(path) : null } };
  });
}

/** Removes an uploaded file that was never saved into a record (e.g. the form was cancelled). */
export async function discardUpload(path: string, isPrivate = false): Promise<ActionResult> {
  return run(async (db) => {
    if (!UPLOAD_PATH.test(path)) throw new UserError("Invalid path.");
    if (isPrivate) await db.storage.from(PRIVATE_BUCKET).remove([path]);
    else await removeFiles(db, [path]);
    return { ok: true };
  });
}

// Supporting documents ----------------------------------------------------------------------------

const DOC_PARENTS = { education: "education_id", experience: "experience_id", accomplishment: "accomplishment_id" } as const;

export async function addDocument(
  kind: keyof typeof DOC_PARENTS,
  parentId: string,
  doc: { title: string; path: string; isPrivate: boolean; mimeType: string; size: number },
): Promise<ActionResult> {
  return run(async (db) => {
    const column = DOC_PARENTS[kind];
    if (!column) throw new UserError("Unknown document parent.");
    const title = doc.title.trim().slice(0, 160);
    if (!title) throw new UserError("Give the document a title.");
    if (!/^documents\/[0-9a-f-]{36}\.[a-z]+$/.test(doc.path)) throw new UserError("Invalid file.");
    const { error } = await db.from("documents").insert({
      title,
      path: doc.path,
      bucket: doc.isPrivate ? PRIVATE_BUCKET : PUBLIC_BUCKET,
      mime_type: doc.mimeType.slice(0, 100),
      size_bytes: Math.max(0, Math.round(doc.size)),
      [column]: parentId,
    });
    check(error);
    refreshSite();
    return { ok: true };
  });
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  return run(async (db) => {
    const { data: doc } = await db.from("documents").select("path, bucket").eq("id", id).maybeSingle();
    const { error } = await db.from("documents").delete().eq("id", id);
    check(error);
    if (doc) await db.storage.from(doc.bucket).remove([doc.path]);
    refreshSite();
    return { ok: true };
  });
}

/** Link to open a document: the public URL, or a 5-minute signed URL for private files. */
export async function getDocumentLink(id: string): Promise<ActionResult<{ url: string }>> {
  return run(async (db) => {
    const { data: doc } = await db.from("documents").select("path, bucket").eq("id", id).maybeSingle();
    if (!doc) throw new UserError("Document not found.");
    if (doc.bucket === PUBLIC_BUCKET) return { ok: true, data: { url: assetUrl(doc.path)! } };
    const { data, error } = await db.storage.from(PRIVATE_BUCKET).createSignedUrl(doc.path, 300);
    if (error || !data) throw new UserError("Could not create a link for this file.");
    return { ok: true, data: { url: data.signedUrl } };
  });
}

// Messages ----------------------------------------------------------------------------------------

export async function setMessageStatus(id: string, status: "unread" | "read" | "archived"): Promise<ActionResult> {
  return run(async (db) => {
    if (!["unread", "read", "archived"].includes(status)) throw new UserError("Unknown status.");
    const { error } = await db
      .from("contact_submissions")
      .update({ status, read_at: status === "unread" ? null : new Date().toISOString() })
      .eq("id", id);
    check(error);
    revalidatePath("/admin", "layout");
    return { ok: true };
  });
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  return run(async (db) => {
    const { error } = await db.from("contact_submissions").delete().eq("id", id);
    check(error);
    revalidatePath("/admin", "layout");
    return { ok: true };
  });
}
