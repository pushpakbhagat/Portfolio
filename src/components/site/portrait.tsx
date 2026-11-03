import Image from "next/image";
import { cn } from "@/lib/utils";
import { BrandIcon } from "./brand-icon";

export type PortraitChip = { name: string; slug: string; src: string | null };

/** Chip positions around the portrait (percent of the figure), with staggered float timing. */
const CHIP_SPOTS = [
  { left: "-6%", top: "22%", delay: "0s" },
  { right: "-8%", top: "12%", delay: "1.4s" },
  { right: "-4%", top: "52%", delay: "2.6s" },
  { left: "-10%", top: "60%", delay: "0.8s" },
] as const;

/**
 * The hero portrait. A transparent cutout (PNG / WebP / AVIF) stands directly on the page, lit
 * by a halo, ringed by slow orbits and floating tech chips, and fades out at the bottom into the
 * rule below. An ordinary photo with a backdrop gets its edges dissolved instead, so it never
 * reads as a box pasted on top.
 */
export function Portrait({
  src,
  name,
  initials,
  chips,
  className,
}: {
  src: string | null;
  name: string;
  initials: string;
  chips: PortraitChip[];
  className?: string;
}) {
  const cutout = Boolean(src && /\.(png|webp|avif)(\?|$)/i.test(src));

  return (
    <figure className={cn("relative isolate", className)}>
      {/* Halo and orbits sit behind the head. */}
      <div aria-hidden className="absolute inset-x-[-12%] top-[2%] -z-10 aspect-square">
        <div
          className="absolute inset-[14%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, color-mix(in oklch, var(--signal) 30%, transparent), color-mix(in oklch, var(--signal) 8%, transparent) 55%, transparent 72%)",
          }}
        />
        <svg viewBox="0 0 200 200" className="orbit-spin absolute inset-0 size-full overflow-visible">
          <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="0.4" strokeDasharray="1.5 3.5" />
          <circle cx="100" cy="8" r="2.2" className="fill-signal" />
        </svg>
        <svg viewBox="0 0 200 200" className="orbit-spin-reverse absolute inset-[10%] size-[80%] overflow-visible">
          <ellipse cx="100" cy="100" rx="96" ry="96" fill="none" stroke="var(--signal)" strokeOpacity="0.35" strokeWidth="0.35" strokeDasharray="40 12 4 12" />
          <circle cx="4" cy="100" r="1.6" className="fill-foreground/60" />
        </svg>
      </div>

      <div data-parallax="10" className="relative">
        {src ? (
          <Image
            src={src}
            alt={`Portrait of ${name}`}
            width={900}
            height={1107}
            preload
            sizes="(min-width: 1024px) 34vw, 60vw"
            className={cn(
              "h-auto w-full",
              cutout
                ? "portrait-fade drop-shadow-[0_24px_40px_color-mix(in_oklch,var(--foreground)_18%,transparent)]"
                : "portrait-blend mix-blend-multiply dark:mix-blend-normal dark:brightness-90",
            )}
          />
        ) : (
          <div className="grid aspect-[4/5] place-items-center">
            <span className="serif-accent text-[clamp(4rem,12vw,10rem)] leading-none text-foreground/80">{initials}</span>
          </div>
        )}
      </div>

      {chips.length > 0 && (
        <ul aria-label="Main technologies" className="hidden sm:block">
          {chips.slice(0, CHIP_SPOTS.length).map((chip, i) => {
            const { delay, ...spot } = CHIP_SPOTS[i];
            return (
              <li key={chip.name} className="absolute z-10" style={spot}>
                <span
                  className="float-chip inline-flex items-center gap-2 rounded-full border bg-background/85 px-3 py-1.5 text-xs font-medium shadow-[0_8px_24px_-12px_color-mix(in_oklch,var(--foreground)_35%,transparent)] backdrop-blur-[2px]"
                  style={{ animationDelay: delay }}
                >
                  <BrandIcon slug={chip.slug} src={chip.src} className="size-3.5 text-signal" />
                  {chip.name}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </figure>
  );
}
