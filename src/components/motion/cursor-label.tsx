"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * A small label that follows the pointer over elements with `data-cursor="View"` (project
 * covers, for example). The native cursor stays: this only adds context, it never replaces it.
 */
export function CursorLabel() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const x = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
      const y = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });
      const text = el.querySelector("span")!;
      let active: Element | null = null;

      const move = (e: PointerEvent) => {
        x(e.clientX);
        y(e.clientY);
        const target = (e.target as Element | null)?.closest("[data-cursor]") ?? null;
        if (target === active) return;
        active = target;
        if (target) text.textContent = target.getAttribute("data-cursor");
        gsap.to(el, { scale: target ? 1 : 0, autoAlpha: target ? 1 : 0, duration: 0.35, ease: "expo.out" });
      };
      window.addEventListener("pointermove", move, { passive: true });
      return () => window.removeEventListener("pointermove", move);
    });
    return () => mm.revert();
  });

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[60] invisible -mt-9 -ml-9 grid size-18 scale-0 place-items-center rounded-full bg-signal text-signal-foreground"
    >
      <span className="eyebrow !text-signal-foreground !tracking-[0.1em]" />
    </div>
  );
}
