import { Fragment, type ElementType, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type SplitTextProps<T extends ElementType> = {
  as?: T;
  text: string;
  /** "chars" masks every character (headings), "words" masks words (longer lines). */
  by?: "chars" | "words";
} & Omit<ComponentPropsWithoutRef<T>, "children">;

/**
 * Renders text pre-split into masked spans so GSAP can reveal it without a client-side split
 * (no layout shift, works without JS). Screen readers get the plain text through aria-label.
 */
export function SplitText<T extends ElementType = "span">({
  as,
  text,
  by = "chars",
  className,
  ...props
}: SplitTextProps<T>) {
  const Tag = (as ?? "span") as ElementType;
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <Tag aria-label={text} className={cn(className)} {...props}>
      {words.map((word, w) => (
        <Fragment key={w}>
          <span aria-hidden className="split-mask whitespace-nowrap">
            {by === "chars" ? (
              Array.from(word).map((char, c) => (
                <span key={c} className="split-inner">
                  {char}
                </span>
              ))
            ) : (
              <span className="split-inner">{word}</span>
            )}
          </span>
          {w < words.length - 1 && " "}
        </Fragment>
      ))}
    </Tag>
  );
}

/** Words that brighten one by one while the paragraph scrolls through the viewport. */
export function ScrubText({ text, className }: { text: string; className?: string }) {
  return (
    <p data-scrub-words className={className}>
      {text.split(/\s+/).filter(Boolean).map((word, i) => (
        <Fragment key={i}>
          <span className="scrub-word">{word}</span>{" "}
        </Fragment>
      ))}
    </p>
  );
}
