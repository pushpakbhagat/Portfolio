import { supabaseUrl } from "@/lib/env";

export const PUBLIC_BUCKET = "public-assets";
export const PRIVATE_BUCKET = "private-documents";

/** Public URL of a file in the public-assets bucket, or null when there is no file. */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path || !supabaseUrl) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${supabaseUrl}/storage/v1/object/public/${PUBLIC_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
