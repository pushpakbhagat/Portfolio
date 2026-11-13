"use client";

import Image from "next/image";
import { useRef, useState } from "react";

// Interactive pieces of the off-screen page: the record player, the manga panel and the speedometer.

export function RecordPlayer({
  title,
  artist,
  playlists,
  src,
}: {
  title: string;
  artist: string;
  playlists: string[];
  /** Uploaded track. Without one the player only animates. */
  src: string | null;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const next = !playing;
    setPlaying(next);
    if (!audio.current) return;
    if (next) audio.current.play().catch(() => setPlaying(false));
    else audio.current.pause();
  };

  const [label, setLabel] = useState(0);
  const labels = ["var(--pp-pop)", "var(--pp-hi)", "var(--pp-ink-soft)", "var(--pp-chalk)"];

  return (
    <div className="os-music">
      <div className="os-deck">
        <div className="os-vinyl" data-on={playing}>
          <i style={{ background: labels[label] }}>
            now
            <br />
            playing
          </i>
        </div>
        <svg aria-hidden viewBox="0 0 60 100" className="pp-d os-arm" data-on={playing}>
          <circle cx="46" cy="10" r="7" />
          <path d="M46 17L18 78l-8 4 2 10 12-4-2-8" />
        </svg>
      </div>
      <div>
        <small className="os-kicker">ON REPEAT</small>
        <h3>{title || "Always something playing"}</h3>
        {artist && <p className="os-muted">{artist}</p>}
        <div aria-hidden className="os-eq" data-on={playing}>
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} style={{ animationDelay: `${-i * 0.13}s`, animationDuration: `${0.7 + (i % 4) * 0.18}s` }} />
          ))}
        </div>
        <div className="os-ctl">
          <button type="button" className="os-go" aria-pressed={playing} onClick={toggle}>
            {playing ? "pause" : "play"}
          </button>
          <button type="button" onClick={() => setLabel((n) => (n + 1) % labels.length)}>
            next vibe
          </button>
        </div>
        {src && <audio ref={audio} src={src} preload="none" onEnded={() => setPlaying(false)} />}
        {playlists.length > 0 && (
          <ul className="os-tape">
            {playlists.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Manga panel. With uploaded images it shows them one at a time on a card, and a click moves to
 * the next picture and the next line; without any it shows the drawn face.
 */
export function MangaPanel({ shouts, images }: { shouts: string[]; images: string[] }) {
  const [i, setI] = useState(0);
  const steps = Math.max(shouts.length, images.length, 1);
  const hasCard = images.length > 0;

  return (
    <button
      type="button"
      className="os-panel"
      aria-label={hasCard && images.length > 1 ? "Manga panel. Click for the next picture." : "Manga panel. Click to change the line."}
      onClick={() => setI((n) => (n + 1) % steps)}
    >
      <span aria-hidden className="os-lines" />
      {shouts.length > 0 && <span className="os-shout">{shouts[i % shouts.length]}</span>}
      {hasCard ? (
        <span className="os-card">
          <span>
            <Image key={images[i % images.length]} src={images[i % images.length]} alt="" fill sizes="(min-width: 760px) 300px, 70vw" />
          </span>
          {images.length > 1 && (
            <small>
              {(i % images.length) + 1} / {images.length} · tap for the next one
            </small>
          )}
        </span>
      ) : (
        <>
        <svg aria-hidden viewBox="0 0 200 200" className="pp-d">
          <path d="M52 84c0 46 20 68 48 68s48-22 48-68" />
          <path
            style={{ fill: "currentColor" }}
            d="M48 88c-6-40 18-70 52-70 16-8 40 0 50 18 10 14 10 34 6 52-6-16-14-26-24-32-14 8-28 6-40-2-10 8-24 16-34 18-6 6-8 10-10 18z"
          />
          <path d="M70 22l-6-14M92 16l2-16M116 18l10-14M138 30l14-8" />
          <rect x="58" y="86" width="36" height="24" rx="5" />
          <rect x="106" y="86" width="36" height="24" rx="5" />
          <path d="M94 96h12M58 94l-10-4M142 94l10-4" />
          <path d="M67 102c4-7 14-7 18 0M115 102c4-7 14-7 18 0M60 78c8-7 20-7 30-1M110 77c10-6 22-6 30 1" />
          <path style={{ fill: "currentColor" }} d="M80 120c12 4 28 4 40 0-3 18-11 26-20 26s-17-8-20-26z" />
          <path d="M62 124l3 8M72 136l3 8M86 144l1 8M100 146v8M114 144l-1 8M128 136l-3 8M138 124l-3 8" />
        </svg>
          <span aria-hidden className="os-bubble">
            it works?!
          </span>
        </>
      )}
    </button>
  );
}

const GEARS = ["IDLING", "CRUISING", "IN THE ZONE", "DEADLINE MODE"];
const TICKS = Array.from({ length: 11 }, (_, k) => {
  const a = Math.PI * (1 - k / 10);
  return { x1: 150 + Math.cos(a) * 98, y1: 150 - Math.sin(a) * 98, x2: 150 + Math.cos(a) * 86, y2: 150 - Math.sin(a) * 86 };
});

export function Speedometer() {
  const [rev, setRev] = useState(33);
  const gear = GEARS[rev < 25 ? 0 : rev < 55 ? 1 : rev < 85 ? 2 : 3];

  return (
    <div className="os-gauge">
      <svg aria-hidden viewBox="0 0 300 180">
        <path d="M30 150a120 120 0 0 1 240 0" fill="none" stroke="var(--pp-desk-3)" strokeWidth="16" strokeLinecap="round" />
        <path
          d="M30 150a120 120 0 0 1 240 0"
          fill="none"
          stroke="var(--pp-hi)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray="377"
          strokeDashoffset={377 - (377 * rev) / 100}
        />
        <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          {TICKS.map((t, k) => (
            <line key={k} x1={t.x1.toFixed(1)} y1={t.y1.toFixed(1)} x2={t.x2.toFixed(1)} y2={t.y2.toFixed(1)} />
          ))}
        </g>
        <path className="os-needle" style={{ transform: `rotate(${-90 + rev * 1.8}deg)` }} d="M150 150L150 48" stroke="var(--pp-pop)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="150" cy="150" r="12" fill="var(--pp-chalk)" />
      </svg>
      <output htmlFor="os-rev">{gear}</output>
      <label htmlFor="os-rev">Rev it</label>
      <input id="os-rev" type="range" min={0} max={100} value={rev} onChange={(e) => setRev(Number(e.target.value))} />
    </div>
  );
}
