// Line drawings for the paper design. Every drawing gets the "pp-d" class, whose SVG filter
// (defined once in DoodleDefs) wobbles the strokes so they read as hand-drawn.

const DOODLES = {
  cup: (
    <>
      <path d="M14 26h30v18a12 12 0 0 1-12 12h-6a12 12 0 0 1-12-12z" />
      <path d="M44 30h5a6 6 0 0 1 0 12h-5" />
      <path d="M22 18c-3-4 3-6 0-10M32 18c-3-4 3-6 0-10" />
    </>
  ),
  terminal: (
    <>
      <rect x="6" y="12" width="52" height="40" rx="5" />
      <path d="M6 22h52M14 32l7 5-7 5M26 43h12" />
    </>
  ),
  bug: (
    <>
      <ellipse cx="32" cy="36" rx="13" ry="16" />
      <path d="M32 20v32M22 14l6 8M42 14l-6 8M19 30H8M19 40H9M45 30h11M45 40h10M21 48l-8 6M43 48l8 6" />
    </>
  ),
  rocket: (
    <>
      <path d="M32 6c10 8 12 22 8 36H24c-4-14-2-28 8-36z" />
      <circle cx="32" cy="24" r="5" />
      <path d="M24 36l-9 10 9-2M40 36l9 10-9-2M28 46c0 6 4 8 4 12 0-4 4-6 4-12" />
    </>
  ),
  cat: (
    <>
      <path d="M16 26V10l10 8h12l10-8v16c4 12-2 26-16 26S12 38 16 26z" />
      <path d="M25 30v3M39 30v3M29 38c2 2 4 2 6 0M8 34l10 2M8 42l10-2M56 34l-10 2M56 42l-10-2" />
    </>
  ),
  bulb: <path d="M22 38c-10-8-6-26 10-26s20 18 10 26v6H22zM24 50h16M27 56h10M10 14l-3-3M54 14l3-3" />,
  star: <path d="M32 6l6 20 20 6-20 6-6 20-6-20-20-6 20-6z" />,
  branch: (
    <>
      <circle cx="18" cy="12" r="6" />
      <circle cx="18" cy="52" r="6" />
      <circle cx="46" cy="24" r="6" />
      <path d="M18 18v28M46 30c0 12-28 6-28 16" />
    </>
  ),
} as const;

export type DoodleName = keyof typeof DOODLES;

export function DoodleDefs() {
  return (
    <svg width="0" height="0" aria-hidden className="absolute">
      <filter id="pp-wob">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" />
        <feDisplacementMap in="SourceGraphic" scale="3.2" />
      </filter>
    </svg>
  );
}

/** A chalk doodle in the margin of a section. Decorative, hidden on narrow screens. */
export function Doodle({ name, side, top }: { name: DoodleName; side: "l" | "r"; top: string }) {
  return (
    <svg aria-hidden viewBox="0 0 64 64" className={`pp-d pp-dood pp-dood-${side}`} style={{ top }}>
      {DOODLES[name]}
    </svg>
  );
}

/** Scribbled ellipse that circles a nav link. */
export function Scribble() {
  return (
    <svg aria-hidden viewBox="0 0 120 50" preserveAspectRatio="none" className="pp-d">
      <path d="M10 26C10 8 50 4 78 6c26 2 36 12 32 24-4 12-40 16-66 13C26 41 6 38 12 22" />
    </svg>
  );
}

/** A hand pointing left, placed after a link to show it can be clicked. */
export function PointingHand() {
  return (
    <svg aria-hidden viewBox="0 0 64 42" className="pp-d pp-point">
      <path d="M30 12H9a5 5 0 0 0 0 10h17" />
      <path d="M30 12c5-7 16-7 22-2 7 6 8 17 3 24-4 5-11 6-19 6-6 0-10-2-10-6" />
      <path d="M26 22h7a4 4 0 0 1 0 8h-7M27 30h5a4 4 0 0 1 0 8h-4" />
    </svg>
  );
}

/** Hero drawing: a developer with glasses at a laptop, with a mug and a plant. */
export function HeroArt() {
  return (
    <svg viewBox="0 0 380 270" role="img" aria-label="Line drawing of a developer with glasses working at a laptop" className="pp-d pp-art">
      <path d="M14 236h352" />
      <path d="M118 236l14-74h118l14 74zM138 170h106l9 56H129z" />
      <path d="M150 186h30M150 198h52M150 210h22M214 186l8 6-8 6" />
      <circle cx="191" cy="92" r="38" />
      <path d="M156 78c2-26 26-40 48-32 14 4 22 14 24 28-10-10-22-12-34-8-12 4-26 6-38 12z" />
      <circle cx="176" cy="96" r="11" />
      <circle cx="206" cy="96" r="11" />
      <path d="M187 96h8M165 94l-10-4M217 94l10-4" />
      <path d="M182 116c6 5 13 5 19 0" />
      <path d="M160 126c-22 8-34 22-38 40M222 126c22 8 34 22 38 40M185 130l6 12 6-12M191 142v18" />
      <path d="M292 198h34v24a12 12 0 0 1-12 12h-10a12 12 0 0 1-12-12zM326 204h6a7 7 0 0 1 0 14h-6M302 188c-3-5 3-7 0-12M314 188c-3-5 3-7 0-12" />
      <path d="M44 236v-30h30v30M59 206c0-24-18-28-22-44 16 4 22 18 22 44zM59 206c2-20 16-26 26-34-2 18-12 26-26 34z" />
      <path d="M290 60l-12 12 12 12M320 60l12 12-12 12M310 54l-10 36" />
      <path d="M70 70l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" />
    </svg>
  );
}

/** The three layers of the checklist drawing: sky, rocket, lift-off. */
export const ROCKET_LAYERS = [
  <path key="sky" d="M10 170c40-14 80-14 120 0 20 6 40 6 60 0M30 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3zM160 30l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM150 88v4M44 108v4" />,
  <path key="rocket" d="M100 36c22 18 26 52 16 86H84c-10-34-6-68 16-86zM89 76a11 11 0 1 0 22 0 11 11 0 1 0-22 0M84 108l-20 24 22-6M116 108l20 24-22-6" />,
  <path key="fire" d="M90 128c0 16 10 22 10 36 0-14 10-20 10-36M82 150c-6 6-8 12-6 18M118 150c6 6 8 12 6 18M40 20c10-8 22-6 28 2M132 60c8-4 16-2 20 4" />,
];
