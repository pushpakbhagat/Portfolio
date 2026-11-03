"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

/**
 * Tilts its content toward the pointer in 3D with a soft glare where the light would catch.
 * Mouse only, motion allowed; on touch it is a plain wrapper.
 */
export function Tilt({ children, max = 7, className }: { children: ReactNode; max?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current!;
      const card = el.firstElementChild as HTMLElement;
      const glare = el.querySelector<HTMLElement>("[data-glare]")!;
      const mm = gsap.matchMedia();
      mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const rx = gsap.quickTo(card, "rotationX", { duration: 0.7, ease: "power3.out" });
        const ry = gsap.quickTo(card, "rotationY", { duration: 0.7, ease: "power3.out" });
        gsap.set(card, { transformPerspective: 1100, transformOrigin: "center" });

        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          ry((px - 0.5) * 2 * max);
          rx((0.5 - py) * 2 * max);
          glare.style.setProperty("--gx", `${px * 100}%`);
          glare.style.setProperty("--gy", `${py * 100}%`);
        };
        const enter = () => gsap.to(glare, { opacity: 1, duration: 0.4 });
        const leave = () => {
          rx(0);
          ry(0);
          gsap.to(glare, { opacity: 0, duration: 0.6 });
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerenter", enter);
        el.addEventListener("pointerleave", leave);
        return () => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerenter", enter);
          el.removeEventListener("pointerleave", leave);
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      {children}
      <div
        data-glare
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-soft-light"
        style={{ background: "radial-gradient(30rem circle at var(--gx, 50%) var(--gy, 50%), rgb(255 255 255 / 0.55), transparent 60%)" }}
      />
    </div>
  );
}
