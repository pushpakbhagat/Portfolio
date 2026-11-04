"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/** Fired by the first-visit intro overlay when it has gone; the hero entrance waits for it. */
export const INTRO_DONE = "portfolio:intro-done";

/**
 * One scroll and motion system for the public site:
 * - Lenis smooths wheel scrolling on desktop (touch keeps native scrolling) and drives
 *   ScrollTrigger from GSAP's ticker, so there is a single rAF loop and no scroll listeners.
 * - Sections opt into effects with data attributes, so they can stay Server Components.
 * Nothing runs when the visitor prefers reduced motion: content is simply shown.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia(MOTION_OK).matches) return;
    const instance = new Lenis({ autoRaf: false, lerp: 0.11, anchors: { offset: -72 } });
    const raf = (time: number) => instance.raf(time * 1000);
    instance.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    // Hold scrolling while the first-visit intro overlay is up.
    const resume = () => instance.start();
    if (document.documentElement.classList.contains("preload")) {
      instance.stop();
      window.addEventListener(INTRO_DONE, resume, { once: true });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the instance only exists on the client
    setLenis(instance);
    return () => {
      window.removeEventListener(INTRO_DONE, resume);
      gsap.ticker.remove(raf);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  // New page: start at the top and re-measure once images and fonts settle.
  useEffect(() => {
    if (!window.location.hash) lenis?.scrollTo(0, { immediate: true, force: true });
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => window.clearTimeout(id);
  }, [pathname, lenis]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const cleanupIntro = intro();
        reveals();
        scrubbed();
        return cleanupIntro;
      });
      return () => mm.revert();
    },
    { dependencies: [pathname], scope, revertOnUpdate: true },
  );

  return (
    <LenisContext.Provider value={lenis}>
      <div ref={scope} className="contents">
        {children}
      </div>
    </LenisContext.Provider>
  );
}

const nonEmpty = <T,>(list: T[]) => list.length > 0;

/**
 * Hero entrance. Initial states come from CSS (globals.css) so nothing flashes before hydration.
 * On a first visit it waits for the intro overlay to leave.
 */
function intro() {
  const chars = gsap.utils.toArray<HTMLElement>('[data-intro="chars"] .split-inner');
  const clips = gsap.utils.toArray<HTMLElement>('[data-intro="clip"]');
  const fades = gsap.utils.toArray<HTMLElement>('[data-intro="fade"]');
  if (!chars.length && !clips.length && !fades.length) return;

  // Move the start state from CSS to inline styles, then drop the attribute so the CSS fallback
  // animation can no longer interfere. GSAP reads the CSS translateY(105%) back as a *pixel* `y`;
  // zero it explicitly, or that offset stays after `yPercent` returns to 0 (letters stuck low).
  if (nonEmpty(chars)) gsap.set(chars, { y: 0, yPercent: 105 });
  if (nonEmpty(clips)) gsap.set(clips, { clipPath: "inset(100% 0% 0% 0%)" });
  if (nonEmpty(fades)) gsap.set(fades, { autoAlpha: 0, y: 12 });
  document.querySelectorAll("[data-intro]").forEach((el) => el.removeAttribute("data-intro"));

  const tl = gsap.timeline({ defaults: { ease: "expo.out" }, paused: true });
  if (nonEmpty(chars)) tl.to(chars, { y: 0, yPercent: 0, duration: 1.25, stagger: 0.028, clearProps: "transform" }, 0);
  if (nonEmpty(clips)) tl.to(clips, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut", clearProps: "clipPath" }, 0.15);
  if (nonEmpty(fades)) tl.to(fades, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.07 }, 0.55);

  const play = () => tl.play();
  if (document.documentElement.classList.contains("preload")) {
    window.addEventListener(INTRO_DONE, play, { once: true });
    // Never leave the hero hidden: if the overlay's signal hasn't come after 4s, play anyway.
    const safety = window.setTimeout(play, 4000);
    return () => {
      window.clearTimeout(safety);
      window.removeEventListener(INTRO_DONE, play);
    };
  }
  tl.delay(0.1).play();
}

function reveals() {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-reveal]")) {
    gsap.from(el, {
      autoAlpha: 0,
      y: 28,
      duration: 1.1,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  }

  for (const el of gsap.utils.toArray<HTMLElement>("[data-reveal-children]")) {
    if (!el.children.length) continue;
    gsap.from(el.children, {
      autoAlpha: 0,
      y: 24,
      duration: 1,
      ease: "expo.out",
      stagger: 0.06,
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  }

  // Headings: words rise out of a blur, one after another.
  for (const el of gsap.utils.toArray<HTMLElement>("[data-split-reveal]")) {
    const words = el.querySelectorAll(".split-inner");
    if (!words.length) continue;
    const blur = el.dataset.splitReveal === "blur";
    gsap.from(words, {
      yPercent: blur ? 35 : 105,
      autoAlpha: blur ? 0 : 1,
      filter: blur ? "blur(12px)" : "none",
      duration: blur ? 1.3 : 1.1,
      ease: "expo.out",
      stagger: blur ? 0.07 : 0.018,
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
      clearProps: "filter",
    });
  }

  for (const el of gsap.utils.toArray<HTMLElement>("[data-clip]")) {
    gsap.from(el, {
      clipPath: "inset(100% 0% 0% 0%)",
      duration: 1.4,
      ease: "expo.inOut",
      clearProps: "clipPath",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  }

  // Registration marks spin into place.
  for (const el of gsap.utils.toArray<HTMLElement>("[data-spin]")) {
    gsap.from(el, {
      rotate: -180,
      scale: 0,
      duration: 1.2,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
    });
  }

  // Icons pop in with a little overshoot (skills grid).
  for (const el of gsap.utils.toArray<HTMLElement>("[data-pop]")) {
    const items = el.querySelectorAll("[data-pop-item]");
    if (!items.length) continue;
    gsap.from(items, {
      scale: 0.3,
      rotate: -18,
      autoAlpha: 0,
      duration: 0.8,
      ease: "back.out(2.2)",
      stagger: 0.045,
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  }

  // Numbers count up from zero when they come into view. The final value is in the HTML already.
  for (const el of gsap.utils.toArray<HTMLElement>("[data-count]")) {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target) || target <= 0) continue;
    const counter = { value: 0 };
    gsap.to(counter, {
      value: target,
      duration: 1.6,
      ease: "power3.out",
      onUpdate: () => {
        el.textContent = String(Math.round(counter.value));
      },
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
    });
  }
}

/** Effects tied to scroll position (scrub). */
function scrubbed() {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-scrub-words]")) {
    const words = el.querySelectorAll(".scrub-word");
    if (!words.length) continue;
    gsap.fromTo(
      words,
      { opacity: 0.16 },
      {
        opacity: 1,
        stagger: 0.1,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 50%", scrub: true },
      },
    );
  }

  for (const el of gsap.utils.toArray<HTMLElement>("[data-parallax]")) {
    const amount = Number(el.dataset.parallax) || 10;
    gsap.fromTo(
      el,
      { yPercent: -amount / 2 },
      {
        yPercent: amount / 2,
        ease: "none",
        scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  }

  for (const el of gsap.utils.toArray<HTMLElement>("[data-line]")) {
    const track = el.parentElement ?? el;
    const trigger = { trigger: track, start: "top 70%", end: "bottom 60%", scrub: true } as const;
    gsap.fromTo(el, { scaleY: 0 }, { scaleY: 1, ease: "none", transformOrigin: "top center", scrollTrigger: trigger });
    // A glowing dot rides the tip of the line.
    const dot = track.querySelector<HTMLElement>("[data-line-dot]");
    if (dot) {
      gsap.fromTo(
        dot,
        { y: 0, autoAlpha: 0 },
        { y: () => track.offsetHeight, autoAlpha: 1, ease: "none", scrollTrigger: { ...trigger, invalidateOnRefresh: true } },
      );
    }
  }

  const hero = document.querySelector<HTMLElement>("[data-hero-exit]");
  if (hero) {
    gsap.to(hero, {
      yPercent: -14,
      autoAlpha: 0.2,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    });
  }

  const progress = document.querySelector<HTMLElement>("[data-progress]");
  if (progress) {
    gsap.fromTo(
      progress,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        transformOrigin: "left center",
        scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
      },
    );
  }
}
