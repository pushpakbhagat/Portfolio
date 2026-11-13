import type { Metadata } from "next";
import { Bangers, Rye } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MangaPanel, RecordPlayer, Speedometer } from "@/components/site/paper/off-screen-parts";
import { getSiteData } from "@/lib/content/queries";
import { assetUrl } from "@/lib/storage";
import "@/components/site/paper/off-screen.css";

// Life outside work, kept apart from the portfolio itself. Part of the paper design only.

const comic = Bangers({ variable: "--font-os-comic", subsets: ["latin"], weight: "400", preload: false });
const western = Rye({ variable: "--font-os-west", subsets: ["latin"], weight: "400", preload: false });

export const revalidate = 3600;
export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteData();
  return { title: "Off-screen", description: settings.os_intro || undefined, alternates: { canonical: "/off-screen" } };
}

/** "label: text" → both halves. A line without a colon is all text. */
function pair(line: string) {
  const i = line.indexOf(":");
  return i < 0 ? { label: "", text: line.trim() } : { label: line.slice(0, i).trim(), text: line.slice(i + 1).trim() };
}

// Three original drawings, handed out to the games in turn.
const GAME_ART_ORDER = ["city", "west", "car"] as const;

const GAME_ART: Record<(typeof GAME_ART_ORDER)[number], { bg: string; color: string; paths: React.ReactNode }> = {
  city: {
    bg: "#2b1f47",
    color: "#ff9e7a",
    paths: (
      <>
        <circle cx="72" cy="30" r="12" />
        <path d="M6 92V58h14V40h16v52M36 92V30h18v62M54 92V52h16v40M70 92V66h20v26M2 92h96M26 50h4M42 40h6M42 54h6M60 62h4" />
      </>
    ),
  },
  west: {
    bg: "#3a1f1a",
    color: "#f6b12d",
    paths: (
      <>
        <circle cx="70" cy="32" r="14" />
        <path d="M2 84h96M30 84V40M30 58c-10 0-12-4-12-14M30 66c10 0 14-6 14-18M8 84c8-10 16-10 22 0M60 84c10-16 24-16 34 0" />
      </>
    ),
  },
  car: {
    bg: "#12261f",
    color: "#c9f158",
    paths: (
      <>
        <path d="M8 64h8l10-18h36l14 14 14 4v10H8zM30 46l-4 14M58 46l6 14M2 30h22M2 40h14M2 52h8" />
        <circle cx="28" cy="74" r="8" />
        <circle cx="72" cy="74" r="8" />
      </>
    ),
  },
};

const FRAME_COLORS = ["var(--pp-pop)", "var(--pp-hi)", "var(--pp-ink-soft)", "var(--pp-paper)"];

export default async function OffScreenPage() {
  const { profile, settings } = await getSiteData();
  if (settings.design !== "paper" || !settings.paper_show_off_screen) notFound();
  const firstName = profile.full_name.split(" ")[0];
  const films = settings.os_films.map(pair);
  const games = settings.os_games.map(pair);
  const { os_anime: anime, os_shouts: shouts } = settings;
  const stills = settings.os_film_images.flatMap((p) => assetUrl(p) ?? []);
  const posters = settings.os_anime_images.flatMap((p) => assetUrl(p) ?? []);
  // The strip scrolls by half its width, so it needs two identical runs of at least six frames.
  const run = stills.length > 0 ? Array.from({ length: Math.max(6, stills.length) }, (_, i) => stills[i % stills.length]) : [];

  return (
    <div className={`pp-home pp-wrap os ${comic.variable} ${western.variable}`}>
      <header className="pp-sheet os-top">
        <p className="os-kicker">OFF-SCREEN</p>
        <h1>When I&apos;m not coding</h1>
        {settings.os_intro && <p>{settings.os_intro}</p>}
        <Link href="/" className="pp-btn">
          ← back to the work
        </Link>
      </header>

      <section className="os-sec" aria-labelledby="os-music">
        <p className="pp-lab">side A</p>
        <h2 id="os-music">Always something playing</h2>
        <RecordPlayer
          title={settings.os_track_title}
          artist={settings.os_track_artist}
          playlists={settings.os_playlists}
          src={assetUrl(settings.os_track_path)}
        />
      </section>

      <section className="os-sec" aria-labelledby="os-films">
        <p className="pp-lab">reel 2</p>
        <h2 id="os-films">Movie nights</h2>
        <div aria-hidden className="os-strip">
          <div className="os-frames">
            {/* Two identical halves, so the strip can loop: uploaded stills, else ticket titles, else numbers. */}
            {run.length > 0
              ? [...run, ...run].map((src, i) => (
                  <span key={i} className="os-still">
                    <Image src={src} alt="" fill sizes="210px" />
                  </span>
                ))
              : Array.from({ length: 12 }, (_, i) => (
                  <span key={i} style={{ background: FRAME_COLORS[i % FRAME_COLORS.length] }}>
                    {films.length > 0 ? films[(i % 6) % films.length].text : `scene ${String((i % 6) + 1).padStart(2, "0")}`}
                  </span>
                ))}
          </div>
        </div>
        {films.length > 0 && (
          <ul className="os-tix">
            {films.map((film) => (
              <li key={film.text}>
                <em>ADMIT ONE</em>
                {film.label}
                <b>{film.text}</b>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(shouts.length > 0 || posters.length > 0 || anime.length > 0) && (
        <section className="os-sec" aria-labelledby="os-anime">
          <p className="pp-lab">episode 3</p>
          <h2 id="os-anime">The anime arc</h2>
          {(shouts.length > 0 || posters.length > 0) && <MangaPanel shouts={shouts} images={posters} />}
          {anime.length > 0 && (
            <ul className="os-shelf">
              {anime.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {games.length > 0 && (
        <section className="os-sec" aria-labelledby="os-games">
          <p className="pp-lab">level 4</p>
          <h2 id="os-games">Player one</h2>
          <div className="os-garage">
            <ul className="os-cases">
              {games.map((game, i) => {
                const art = GAME_ART[GAME_ART_ORDER[i % GAME_ART_ORDER.length]];
                return (
                  <li key={game.text + i}>
                    <svg aria-hidden viewBox="0 0 100 100" className="pp-d" style={{ background: art.bg, color: art.color }}>
                      {art.paths}
                    </svg>
                    <b>{game.label || game.text}</b>
                    {game.label && <small>{game.text}</small>}
                  </li>
                );
              })}
            </ul>
            <Speedometer />
          </div>
        </section>
      )}

      <section className="os-sec os-last" aria-label="Get in touch">
        <div className="os-wanted">
          <h2>WANTED</h2>
          <p>for building things that work</p>
          <strong>{profile.full_name}</strong>
          {profile.availability_note && <p>Reward: {profile.availability_note.toLowerCase()}</p>}
          <Link href="/#connect">turn {firstName || "them"} in (say hi)</Link>
        </div>
      </section>
    </div>
  );
}
