"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

/**
 * Endless horizontal strip. Scrolling the page speeds it up and leans it slightly in the scroll
 * direction, then it eases back. With reduced motion it is a still row (scrollable on touch).
 */
export function Marquee({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const track = ref.current!.querySelector<HTMLElement>("[data-track]")!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Two identical halves: moving by -50% and repeating is seamless.
        const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
        const skew = gsap.quickTo(track, "skewX", { duration: 0.6, ease: "power3.out" });
        let settle: gsap.core.Tween | null = null;
        const st = ScrollTrigger.create({
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate(self) {
            const velocity = self.getVelocity();
            const direction = velocity < 0 ? -1 : 1;
            loop.timeScale(direction * gsap.utils.clamp(1, 6, 1 + Math.abs(velocity) / 400));
            skew(gsap.utils.clamp(-8, 8, velocity / -300));
            // Once scrolling stops, ease back to cruising speed and stand upright.
            settle?.kill();
            settle = gsap.to(loop, {
              timeScale: direction,
              duration: 1.2,
              delay: 0.12,
              ease: "power2.out",
              onStart: () => skew(0),
            });
          },
        });
        return () => {
          settle?.kill();
          st.kill();
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="overflow-hidden motion-reduce:overflow-x-auto" role="region" aria-label={label}>
      <div data-track className="flex w-max will-change-transform">
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
