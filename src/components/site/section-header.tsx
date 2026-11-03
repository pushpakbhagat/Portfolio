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

/** "§03 — Selected work" label over a large heading, with a rule that spans the page. */
export function SectionHeader({ index, label, title, accent, aside, className }: Props) {
  return (
    <header className={cn("mb-14 md:mb-20", className)}>
      <div className="mb-8 flex items-center gap-4 border-t pt-4" data-reveal>
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
