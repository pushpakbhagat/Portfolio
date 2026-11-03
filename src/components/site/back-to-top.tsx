"use client";

import { ArrowUp } from "lucide-react";
import { useLenis } from "@/components/motion/motion-provider";

export function BackToTop() {
  const lenis = useLenis();
  return (
    <button
      type="button"
      onClick={() => (lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: "smooth" }))}
      className="group inline-flex items-center gap-3 text-sm"
    >
      <span className="grid size-10 place-items-center rounded-full border transition-colors group-hover:border-foreground group-hover:bg-foreground group-hover:text-background">
        <ArrowUp className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5" />
      </span>
      Back to top
    </button>
  );
}
