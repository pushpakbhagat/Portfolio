import * as icons from "simple-icons";
import { cn } from "@/lib/utils";

type SimpleIcon = { title: string; path: string };
const registry = icons as unknown as Record<string, SimpleIcon | undefined>;

export function findBrandIcon(slug: string): SimpleIcon | undefined {
  if (!slug) return undefined;
  return registry[`si${slug.charAt(0).toUpperCase()}${slug.slice(1).toLowerCase()}`];
}

/**
 * Monochrome technology logo from simple-icons, rendered inline (no network request), coloured
 * with currentColor. Server Component only: importing the icon set on the client would be large.
 */
export function BrandIcon({ slug, src, className }: { slug: string; src?: string | null; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- small uploaded icon, any format incl. SVG
    return <img src={src} alt="" aria-hidden className={cn("size-4 object-contain", className)} />;
  }
  const icon = findBrandIcon(slug);
  if (!icon) return null;
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4 fill-current", className)}>
      <path d={icon.path} />
    </svg>
  );
}
