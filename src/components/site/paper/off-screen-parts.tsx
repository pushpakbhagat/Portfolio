"use client";

import { useState } from "react";

// Interactive pieces of the off-screen page: the record player, the manga panel and the speedometer.

export function RecordPlayer({ title, artist, playlists }: { title: string; artist: string; playlists: string[] }) {
  const [playing, setPlaying] = useState(false);
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
          <button type="button" className="os-go" aria-pressed={playing} onClick={() => setPlaying((v) => !v)}>
            {playing ? "pause" : "play"}
          </button>
          <button type="button" onClick={() => setLabel((n) => (n + 1) % labels.length)}>
            next vibe
          </button>
        </div>
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

export function MangaPanel({ shouts }: { shouts: string[] }) {
  const [i, setI] = useState(0);
  return (
    <button type="button" className="os-panel" aria-label="Manga panel. Click to change the line." onClick={() => setI((n) => (n + 1) % shouts.length)}>
      <span aria-hidden className="os-lines" />
      <span className="os-shout">{shouts[i]}</span>
      <svg aria-hidden viewBox="0 0 200 200" className="pp-d">
        <circle cx="100" cy="92" r="50" />
        <path d="M54 74c4-36 36-52 62-42 18 6 28 20 30 38-12-12-28-16-44-10-16 6-32 8-48 14z" />
        <circle cx="80" cy="98" r="14" />
        <circle cx="120" cy="98" r="14" />
        <path d="M94 98h12M66 96l-12-6M134 96l12-6M84 126c10 12 22 12 32 0" />
      </svg>
      <span aria-hidden className="os-bubble">
        it works?!
      </span>
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
