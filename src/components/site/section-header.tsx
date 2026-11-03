import { SplitText } from "@/components/motion/split-text";
import { cn } from "@/lib/utils";

type Props = {
  index: string;
  label: string;
  title?: string;
  /** Words of the title set in the serif italic accent, e.g. "work". */
  accent?: string;
  aside?: React.ReactNode;
  className?: string;
};

/** Small "+" registration mark, like on a printed sheet. Spins in when it scrolls into view. */
export function Crosshair({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 12 12" data-spin className={cn("pointer-events-none absolute size-3 text-foreground/40", className)}>
      <path d="M6 0v12M0 6h12" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/**
 * "§03 — Selected work" label over a large heading, with a rule that spans the page. Behind it,
 * the section number is set huge in outline and drifts slower than the page as you scroll.
 */
export function SectionHeader({ index, label, title, accent, aside, className }: Props) {
  return (
    <header className={cn("relative isolate mb-14 md:mb-20", className)}>
      <span
        aria-hidden
        data-parallax="30"
        className="text-outline pointer-events-none absolute -top-[0.28em] right-0 -z-10 font-mono text-[clamp(7rem,20vw,19rem)] leading-none font-semibold tracking-tighter select-none"
      >
        {index}
      </span>
      <div className="relative mb-8 flex items-center gap-4 border-t pt-4" data-reveal>
        <Crosshair className="-top-[6.5px] -left-[6px]" />
        <Crosshair className="-top-[6.5px] -right-[6px]" />
        <p className="eyebrow">
          §{index} — {label}
        </p>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      {title && (
        <h2 className="text-headline max-w-5xl" data-split-reveal="blur">
          <SplitText text={title} by="words" />
          {accent && (
            <>
              {" "}
              <SplitText text={accent} by="words" className="serif-accent" />
            </>
          )}
        </h2>
      )}
    </header>
  );
}
