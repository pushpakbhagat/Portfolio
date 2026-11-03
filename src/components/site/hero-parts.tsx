"use client";

import { useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { INTRO_DONE } from "@/components/motion/motion-provider";

/** Soft light that follows the pointer across the hero (fine pointers, motion allowed). */
export function HeroLight() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const el = ref.current!;
    const mm = gsap.matchMedia();
    mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const section = el.parentElement!;
      const x = gsap.quickTo(el, "--x", { duration: 1.2, ease: "power3.out" });
      const y = gsap.quickTo(el, "--y", { duration: 1.2, ease: "power3.out" });
      const move = (e: PointerEvent) => {
        const r = section.getBoundingClientRect();
        x(((e.clientX - r.left) / r.width) * 100);
        y(((e.clientY - r.top) / r.height) * 100);
      };
      section.addEventListener("pointermove", move);
      return () => section.removeEventListener("pointermove", move);
    });
    return () => mm.revert();
  });

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 [--x:70] [--y:30]"
      style={{
        background:
          "radial-gradient(38rem circle at calc(var(--x) * 1%) calc(var(--y) * 1%), color-mix(in oklch, var(--signal) 13%, transparent), transparent 70%)",
      }}
    />
  );
}

const GLYPHS = "!<>-_\/[]{}—=+*^?#01ABCDEFX";

/**
 * Titles resolve out of random characters, terminal style, and cycle every few seconds. The first
 * title scrambles in when the hero appears. With reduced motion the first title is simply shown.
 */
export function ScrambleTitle({ titles }: { titles: string[] }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !titles.length) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let frame = 0;
        const scrambleTo = (text: string) => {
          cancelAnimationFrame(frame);
          const from = el.textContent ?? "";
          const length = Math.max(from.length, text.length);
          // Each character settles at its own moment, roughly left to right.
          const queue = Array.from({ length }, (_, i) => ({
            to: text[i] ?? "",
            start: Math.floor(Math.random() * 12),
            end: 14 + Math.floor((i / length) * 22 + Math.random() * 10),
          }));
          let tick = 0;
          const step = () => {
            let done = 0;
            el.textContent = queue
              .map((c, i) => {
                if (tick >= c.end) {
                  done++;
                  return c.to;
                }
                if (tick >= c.start && c.to !== " ") return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
                return c.to === " " ? " " : (from[i] ?? "");
              })
              .join("");
            tick++;
            if (done < queue.length) frame = requestAnimationFrame(step);
          };
          step();
        };

        let index = 0;
        const timers: number[] = [];
        // Start once the hero entrance is under way (after the intro overlay on a first visit).
        const begin = () => {
          scrambleTo(titles[0]);
          if (titles.length > 1) {
            timers.push(
              window.setInterval(() => {
                index = (index + 1) % titles.length;
                scrambleTo(titles[index]);
              }, 3600),
            );
          }
        };
        const preloading = document.documentElement.classList.contains("preload");
        const onIntro = () => timers.push(window.setTimeout(begin, 500));
        if (preloading) window.addEventListener(INTRO_DONE, onIntro, { once: true });
        else timers.push(window.setTimeout(begin, 700));

        return () => {
          cancelAnimationFrame(frame);
          timers.forEach((t) => (window.clearTimeout(t), window.clearInterval(t)));
          window.removeEventListener(INTRO_DONE, onIntro);
          el.textContent = titles[0];
        };
      });
      return () => mm.revert();
    },
    { dependencies: [titles.join("|")] },
  );

  if (!titles.length) return null;
  return (
    <span aria-label={titles.join(", ")} className="inline-block">
      <span ref={ref} aria-hidden className="whitespace-nowrap">
        {titles[0]}
      </span>
    </span>
  );
}

const subscribeMinute = (onChange: () => void) => {
  const id = window.setInterval(onChange, 15_000);
  return () => window.clearInterval(id);
};

/** Current time in the configured timezone, e.g. "14:32 IST". Empty during server rendering. */
export function LocalTime({ timezone }: { timezone: string }) {
  const time = useSyncExternalStore(
    subscribeMinute,
    () => {
      try {
        return new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: timezone,
          timeZoneName: "short",
        }).format(new Date());
      } catch {
        return "";
      }
    },
    () => "",
  );
  return <span suppressHydrationWarning>{time}</span>;
}
