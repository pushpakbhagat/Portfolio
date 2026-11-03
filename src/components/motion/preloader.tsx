"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { INTRO_DONE } from "./motion-provider";

/**
 * About one second of intro on the first page of a visit: initials, a 0 → 100 counter and a rule
 * filling up, then the overlay wipes away and the hero entrance starts. Shown only when the
 * inline script in the root layout set `html.preload` (motion allowed, not seen this session),
 * and hidden by CSS after 3.4s even if this script never runs.
 */
export function Preloader({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  useGSAP(
    () => {
      const root = document.documentElement;
      if (!root.classList.contains("preload")) return;
      const el = ref.current!;
      const count = el.querySelector<HTMLElement>("[data-count-up]")!;
      const counter = { value: 0 };

      const finish = () => {
        root.classList.remove("preload");
        try {
          sessionStorage.setItem("intro-seen", "1");
        } catch {}
        window.dispatchEvent(new Event(INTRO_DONE));
      };

      gsap
        .timeline()
        .from("[data-initials] span", { yPercent: 110, duration: 0.9, ease: "expo.out", stagger: 0.08 })
        .to(counter, {
          value: 100,
          duration: 1.1,
          ease: "power2.inOut",
          onUpdate: () => {
            count.textContent = String(Math.round(counter.value)).padStart(3, "0");
          },
        }, 0.1)
        .fromTo("[data-bar]", { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power2.inOut" }, 0.1)
        .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.9, ease: "expo.inOut" }, "+=0.15")
        .add(finish, "-=0.45");
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className="preloader fixed inset-0 z-[80] flex-col justify-between bg-background p-[var(--gutter)] [clip-path:inset(0_0_0_0)]"
    >
      <p className="eyebrow">{name}</p>
      <div className="flex items-end justify-between gap-6">
        <p data-initials className="serif-accent overflow-hidden text-[clamp(5rem,22vw,16rem)] leading-[0.9]">
          {Array.from(initials).map((c, i) => (
            <span key={i} className="inline-block">
              {c}
            </span>
          ))}
        </p>
        <p className="font-mono text-[clamp(2.5rem,8vw,6rem)] leading-none tabular-nums">
          <span data-count-up>000</span>
        </p>
      </div>
      <div className="h-px w-full bg-border">
        <div data-bar className="h-full origin-left bg-signal" />
      </div>
    </div>
  );
}
