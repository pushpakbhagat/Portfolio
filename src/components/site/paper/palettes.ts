import type { CSSProperties } from "react";
import type { PaperPaletteName } from "@/lib/content/types";

// Colour palettes of the paper design. A palette is five colours; paper.css mixes every other
// shade from them. The palette in use is chosen in Admin → Settings → Paper design. To add one,
// add it here, to PaperPaletteName, to the settings schema and to the database check constraint.

export type PaperPalette = {
  /** The dark background the sheets sit on. */
  desk: string;
  /** The sheets themselves. */
  paper: string;
  /** Lines, headings, borders and buttons. Must read clearly on the paper. */
  ink: string;
  /** Highlighter behind the headline word and on sticky notes. */
  hi: string;
  /** Second accent for notes and the click hint. */
  pop: string;
};

export const PAPER_PALETTES: Record<PaperPaletteName, PaperPalette> = {
  plum: { desk: "#221a2e", paper: "#f6eee3", ink: "#6a3df0", hi: "#c9f158", pop: "#ff9e7a" },
  blueprint: { desk: "#1b1b1f", paper: "#f3ecdc", ink: "#3157ff", hi: "#ffd84d", pop: "#ff6b4a" },
  marigold: { desk: "#14203a", paper: "#fbf3e0", ink: "#1f3fa8", hi: "#f6b12d", pop: "#e4572e" },
  forest: { desk: "#12261f", paper: "#f4efe1", ink: "#1c7a55", hi: "#ffb84d", pop: "#f28ca5" },
};

/** The palette as CSS variables for the .pp root element. */
export function paletteStyle(palette: PaperPalette): CSSProperties {
  return {
    "--pp-desk": palette.desk,
    "--pp-paper": palette.paper,
    "--pp-ink": palette.ink,
    "--pp-hi": palette.hi,
    "--pp-pop": palette.pop,
  } as CSSProperties;
}
