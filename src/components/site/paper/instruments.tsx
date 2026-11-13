"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PointingHand } from "./doodles";

// Small working instruments on the paper design's main screen: a compass that tracks where you
// are on the page, a command palette (Ctrl+K) and the switchboard that filters projects by tech.

export type CompassPin = { id: string; label: string; href: string; angle: number };

/** Floating mini-map. Pins are the page's sections; the needle points at the one in view. */
export function Compass({ pins }: { pins: CompassPin[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const targets = pins.flatMap((p) => document.getElementById(p.id) ?? []);
    if (!targets.length) return;
    // A section counts as "in view" while it crosses the middle band of the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [pins]);

  const needle = pins.find((p) => p.id === active)?.angle ?? 0;

  return (
    <aside className="pp-compass" aria-label="Page compass">
      <button type="button" className="pp-compass-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? "hide map" : "map"}
      </button>
      {open && (
        <div className="pp-compass-dial">
          <svg aria-hidden viewBox="0 0 100 100">
            <g fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6">
              <circle cx="50" cy="50" r="16" />
              <circle cx="50" cy="50" r="32" />
              <circle cx="50" cy="50" r="46" />
              <path d="M50 2v96M2 50h96M16 16l68 68M84 16L16 84" />
            </g>
          </svg>
          <span aria-hidden className="pp-compass-sweep" />
          <span aria-hidden className="pp-compass-needle" style={{ transform: `translate(-50%, -100%) rotate(${needle}deg)` }} />
          {pins.map((pin) => {
            const rad = (pin.angle * Math.PI) / 180;
            return (
              <a
                key={pin.id}
                href={pin.href}
                aria-current={pin.id === active ? "location" : undefined}
                // Rounded so the server and the browser print the same string.
                style={{ left: `${(50 + 35 * Math.sin(rad)).toFixed(2)}%`, top: `${(50 - 35 * Math.cos(rad)).toFixed(2)}%` }}
              >
                {pin.label}
              </a>
            );
          })}
        </div>
      )}
    </aside>
  );
}

export type PaletteItem = { label: string; hint: string; href: string };

/** Ctrl+K (or the "search" button in the nav): type to jump to any section or project. */
export function CommandPalette({ items }: { items: PaletteItem[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const q = query.trim().toLowerCase();
  const matches = q ? items.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(q)) : items;

  const open = () => {
    setQuery("");
    setIndex(0);
    dialog.current?.showModal();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    dialog.current?.close();
    window.location.href = href;
  };

  return (
    <>
      <button type="button" className="pp-search" onClick={open}>
        search <kbd>Ctrl K</kbd>
      </button>
      <dialog ref={dialog} className="pp-palette" aria-label="Jump to a section or project">
        <input
          type="text"
          value={query}
          placeholder="Where to?"
          aria-label="Search sections and projects"
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIndex((i) => Math.min(i + 1, matches.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && matches[index]) {
              e.preventDefault();
              go(matches[index].href);
            }
          }}
        />
        <ul>
          {matches.map((item, i) => (
            <li key={item.href}>
              <a
                href={item.href}
                data-active={i === index}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.href);
                }}
              >
                {item.label}
                <small>{item.hint}</small>
              </a>
            </li>
          ))}
          {matches.length === 0 && <li className="pp-palette-empty">Nothing matches “{query}”.</li>}
        </ul>
        <p>↑ ↓ to move · Enter to open · Esc to close</p>
      </dialog>
    </>
  );
}

export type BoardProject = { id: string; slug: string; title: string; summary: string; cover: string | null; tech: string[] };

/** Project cards with a row of switches above them: flip a technology on to light up the projects that use it. */
export function WorkBoard({ projects, switches }: { projects: BoardProject[]; switches: boolean }) {
  const [on, setOn] = useState<string[]>([]);
  // Technologies used by the most projects first, capped so the row stays one glance long.
  const counts = new Map<string, number>();
  for (const p of projects) for (const t of p.tech) counts.set(t, (counts.get(t) ?? 0) + 1);
  const techs = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name]) => name);
  const toggle = (name: string) => setOn((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]));

  return (
    <>
      {switches && techs.length > 1 && (
        <div className="pp-switches" role="group" aria-label="Filter projects by technology">
          {techs.map((name) => (
            <button key={name} type="button" aria-pressed={on.includes(name)} onClick={() => toggle(name)}>
              <i aria-hidden />
              {name}
            </button>
          ))}
        </div>
      )}
      <ul className="pp-cards">
        {projects.map((project) => {
          const lit = on.length > 0 && project.tech.some((t) => on.includes(t));
          return (
            <li key={project.id} className="pp-card" data-lit={lit} data-dim={on.length > 0 && !lit}>
              <div className="pp-shot">
                {project.cover ? (
                  <Image src={project.cover} alt="" fill sizes="(min-width: 760px) 320px, 90vw" />
                ) : (
                  <span aria-hidden>{project.title[0]}</span>
                )}
              </div>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              {project.tech.length > 0 && (
                <ul className="pp-chips">
                  {project.tech.slice(0, 5).map((t) => (
                    <li key={t} data-on={on.includes(t)}>
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              <Link href={`/projects/${project.slug}`}>
                read the story<span className="sr-only"> of {project.title}</span>
                <PointingHand />
              </Link>
            </li>
          );
        })}
        <li aria-hidden className="pp-card-empty">
          next one&apos;s
          <br />
          cooking…
        </li>
      </ul>
    </>
  );
}
