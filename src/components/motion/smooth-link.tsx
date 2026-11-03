"use client";

import type { ComponentProps, MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "./motion-provider";

/**
 * Link to a section ("/#work"). On the home page it glides there with Lenis (offset for the fixed
 * nav) instead of jumping; from other pages it navigates normally.
 */
export function SmoothLink({ href, onClick, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const pathname = usePathname();
  const lenis = useLenis();

  function handle(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    const hash = href.startsWith("/#") ? href.slice(1) : href.startsWith("#") ? href : null;
    if (event.defaultPrevented || !hash || pathname !== "/") return;
    const target = document.querySelector<HTMLElement>(hash);
    if (!target) return;
    event.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -72 });
    else target.scrollIntoView({ behavior: "smooth" });
    history.replaceState(null, "", hash);
  }

  return <Link href={href.startsWith("#") ? `/${href}` : href} onClick={handle} {...props} />;
}
