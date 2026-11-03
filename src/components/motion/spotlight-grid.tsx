"use client";

import type { ComponentProps, PointerEvent } from "react";

/**
 * A list whose `.spotlight` cells glow where the pointer is. One listener on the list writes the
 * pointer position into the hovered cell's CSS variables; the glow itself is pure CSS.
 */
export function SpotlightGrid(props: ComponentProps<"ul">) {
  function onPointerMove(event: PointerEvent<HTMLUListElement>) {
    if (event.pointerType !== "mouse") return;
    const cell = (event.target as HTMLElement).closest<HTMLElement>(".spotlight");
    if (!cell) return;
    const rect = cell.getBoundingClientRect();
    cell.style.setProperty("--x", `${event.clientX - rect.left}px`);
    cell.style.setProperty("--y", `${event.clientY - rect.top}px`);
  }
  return <ul onPointerMove={onPointerMove} {...props} />;
}
