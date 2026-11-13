"use client";

import { useEffect, useState } from "react";
import { ROCKET_LAYERS } from "./doodles";

const MOTION_OK = "(prefers-reduced-motion: no-preference)";
const SWAP_FONTS = ["var(--pp-hand)", "var(--pp-type)", "var(--pp-serif)"];

/** The paper design has no intro overlay: clear the flag the root layout set for it. */
export function PaperBoot() {
  useEffect(() => {
    document.documentElement.classList.remove("preload", "preload-js");
  }, []);
  return null;
}

/** The last word of the headline: cycles through the words, each in a different hand. */
export function SwapWord({ words }: { words: string[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (words.length < 2 || !window.matchMedia(MOTION_OK).matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % words.length), 1900);
    return () => window.clearInterval(id);
  }, [words.length]);

  if (!words.length) return null;
  // All words share one grid cell and only the current one is visible, so the highlight box keeps
  // the size of the widest word and the headline never reflows.
  return (
    <span className="pp-swap">
      {words.map((word, n) => (
        <span key={word} aria-hidden={n !== i} data-on={n === i} style={{ fontFamily: SWAP_FONTS[n % SWAP_FONTS.length] }}>
          {word}
        </span>
      ))}
    </span>
  );
}

/** "What I look for": ticking an item strikes it through and draws one more part of the rocket. */
export function Checklist({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));

  return (
    <>
      <div>
        <h2 className="pp-h2">What I look for</h2>
        {items.map((item, i) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={checked[i]}
              onChange={(e) => setChecked((prev) => prev.map((v, n) => (n === i ? e.target.checked : v)))}
            />
            <span>{item}</span>
          </label>
        ))}
        <p className="pp-hint">Tick them off to finish the drawing.</p>
      </div>
      <div className="pp-pic">
        <svg viewBox="0 0 200 200" role="img" aria-label="A rocket drawing that fills in as items are ticked" className="pp-d">
          {ROCKET_LAYERS.map((layer, i) => (
            // Layers beyond the number of items are always drawn, so the picture can be finished.
            <g key={i} data-on={i >= items.length || checked[i]}>
              {layer}
            </g>
          ))}
        </svg>
      </div>
    </>
  );
}
