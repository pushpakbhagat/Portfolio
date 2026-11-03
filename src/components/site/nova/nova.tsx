"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, SendHorizontal, Volume2, VolumeX, X } from "lucide-react";
import { useTheme } from "next-themes";
import { INTRO_DONE, useLenis } from "@/components/motion/motion-provider";
import { cn } from "@/lib/utils";
import { answer, greeting, sectionTip, type NovaAction, type NovaKnowledge, type NovaReply } from "./brain";

type Message = { id: number; from: "nova" | "you"; text: string; actions?: NovaAction[] };

const QUIET_KEY = "nova-quiet";
const TIPS_KEY = "nova-tips";
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Reveals text a few characters at a time ("typing"). Instant with reduced motion. */
function useTypewriter(text: string, speed = 16) {
  const [shown, setShown] = useState(text);
  useEffect(() => {
    // Typing is driven by a timer, so updating state here is intended.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (reducedMotion()) {
      setShown(text);
      return;
    }
    setShown("");
    /* eslint-enable react-hooks/set-state-in-effect */
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed]);
  return shown;
}

/** The orb: a dark core, an orbit ring and two eyes that follow the pointer and blink. */
function Face({ talking, size = 56 }: { talking: boolean; size?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, dist / 300) * (size / 14);
        el.style.setProperty("--ex", `${(dx / dist) * reach}px`);
        el.style.setProperty("--ey", `${(dy / dist) * reach}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, [size]);

  const eye = Math.round(size * 0.11);
  return (
    <span ref={ref} aria-hidden className="relative grid place-items-center" style={{ width: size, height: size }}>
      {/* Halo */}
      <span className="nova-breathe absolute inset-[-30%] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--signal)_45%,transparent),transparent_65%)]" />
      {/* Orbit ring */}
      <svg viewBox="0 0 100 100" className="orbit-spin absolute inset-[-14%] size-[128%] overflow-visible">
        <circle cx="50" cy="50" r="48" fill="none" stroke="var(--signal)" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="22 8 3 8" />
        <circle cx="50" cy="2" r="2.6" fill="var(--signal)" />
      </svg>
      {/* Core */}
      <span
        className="relative grid size-full place-items-center rounded-full shadow-[0_0_0_1px_color-mix(in_oklch,var(--signal)_55%,transparent),0_10px_30px_-8px_color-mix(in_oklch,var(--signal)_70%,transparent),inset_0_-6px_14px_rgb(0_0_0/0.45)]"
        style={{
          background:
            "radial-gradient(circle at 32% 26%, oklch(0.42 0.02 260), oklch(0.2 0.01 260) 55%, oklch(0.12 0.005 260) 100%)",
        }}
      >
        <span className="absolute top-[14%] left-[24%] h-[18%] w-[30%] rounded-full bg-white/25 blur-[2px]" />
        <span
          className="relative flex items-center transition-transform duration-200"
          style={{ gap: eye * 0.9, transform: "translate(var(--ex, 0px), var(--ey, 0px))" }}
        >
          {[0, 1].map((i) => (
            <span
              key={i}
              className="nova-eye block rounded-full bg-signal shadow-[0_0_8px_var(--signal)]"
              style={{ width: eye * 0.75, height: eye * 1.25, animationDelay: i ? "0.04s" : "0s" }}
            />
          ))}
        </span>
        {talking && (
          <span className="nova-talk absolute bottom-[22%] flex items-end gap-[2px]">
            {[0, 1, 2].map((i) => (
              <span key={i} className="block h-[5px] w-[2px] origin-bottom rounded-full bg-signal/90" />
            ))}
          </span>
        )}
      </span>
    </span>
  );
}

function Bubble({ text, onClose }: { text: string; onClose: () => void }) {
  const shown = useTypewriter(text);
  return (
    <div
      role="status"
      className="animate-in fade-in slide-in-from-bottom-2 relative max-w-[16rem] rounded-2xl rounded-br-sm border bg-background px-4 py-3 text-sm leading-snug shadow-[0_18px_40px_-18px_color-mix(in_oklch,var(--foreground)_45%,transparent)] duration-300"
    >
      <p className="eyebrow mb-1 !text-signal">Nova</p>
      <p>{shown}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="absolute top-1 right-1 grid size-7 place-items-center rounded-full text-muted-foreground hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

function MessageBubble({ message, onAction, latest }: { message: Message; onAction: (a: NovaAction) => void; latest: boolean }) {
  const typed = useTypewriter(message.text, 12);
  const text = message.from === "nova" && latest ? typed : message.text;
  const done = text.length >= message.text.length;
  return (
    <li className={cn("flex flex-col gap-2", message.from === "you" ? "items-end" : "items-start")}>
      <p
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          message.from === "you" ? "rounded-br-sm bg-foreground text-background" : "rounded-bl-sm bg-surface",
        )}
      >
        {text}
      </p>
      {message.actions && done && (
        <div className="flex flex-wrap gap-1.5">
          {message.actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => onAction(a)}
              className="inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs transition-colors hover:border-signal hover:text-signal"
            >
              {a.label}
              {a.kind === "link" && a.external && <ArrowUpRight className="size-3" />}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

/**
 * Nova, the site guide: a small character in the corner that greets first-time visitors, drops a
 * short tip as each section comes into view, and opens a console that answers questions from the
 * portfolio's own content (see brain.ts). Tips can be muted; the choice is remembered.
 */
export function Nova({ knowledge }: { knowledge: NovaKnowledge }) {
  const [open, setOpen] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const [quiet, setQuiet] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const nextId = useRef(1);
  const lastTipAt = useRef(0);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const orbRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const lenis = useLenis();
  const { resolvedTheme, setTheme } = useTheme();

  const say = useCallback((reply: NovaReply) => {
    setMessages((m) => [...m, { id: nextId.current++, from: "nova", ...reply }]);
  }, []);

  // Restore the mute choice.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
      setQuiet(localStorage.getItem(QUIET_KEY) === "1");
    } catch {}
  }, []);

  const showTip = useCallback(
    (text: string | null) => {
      if (!text || open || quiet) return;
      if (Date.now() - lastTipAt.current < 7000) return;
      lastTipAt.current = Date.now();
      setTip(text);
    },
    [open, quiet],
  );

  // Hide a tip after a few seconds.
  useEffect(() => {
    if (!tip) return;
    const id = window.setTimeout(() => setTip(null), 5200);
    return () => window.clearTimeout(id);
  }, [tip]);

  // First visit: say hello once the intro has finished.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(TIPS_KEY + ":hello") === "1";
      sessionStorage.setItem(TIPS_KEY + ":hello", "1");
    } catch {}
    if (seen) return;
    const hello = `Hi, I'm Nova. Ask me anything about ${knowledge.firstName}'s work.`;
    let timer = 0;
    const go = () => (timer = window.setTimeout(() => showTip(hello), 1600));
    if (document.documentElement.classList.contains("preload")) window.addEventListener(INTRO_DONE, go, { once: true });
    else go();
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(INTRO_DONE, go);
    };
    // Only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Section tips, once per section per visit.
  useEffect(() => {
    if (pathname !== "/") return;
    const ids = ["about", "work", "skills", "experience", "contact"];
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const key = `${TIPS_KEY}:${entry.target.id}`;
          try {
            if (sessionStorage.getItem(key)) continue;
            sessionStorage.setItem(key, "1");
          } catch {}
          showTip(sectionTip(entry.target.id, knowledge));
        }
      },
      { threshold: 0.35 },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [pathname, knowledge, showTip]);

  // Keep the newest message in view.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
  }, [messages, thinking]);

  function openConsole() {
    setTip(null);
    setOpen(true);
    if (!messages.length) say(greeting(knowledge));
    window.setTimeout(() => inputRef.current?.focus(), 150);
  }

  function closeConsole() {
    setOpen(false);
    orbRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeConsole();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function ask(question: string) {
    const q = question.trim();
    if (!q || thinking) return;
    setMessages((m) => [...m, { id: nextId.current++, from: "you", text: q }]);
    setThinking(true);
    window.setTimeout(() => {
      const reply = answer(q, knowledge);
      if (reply.effect === "theme") setTheme(resolvedTheme === "dark" ? "light" : "dark");
      setThinking(false);
      say(reply);
    }, reducedMotion() ? 0 : 450);
  }

  function goTo(id: string) {
    if (pathname !== "/") {
      router.push(`/#${id}`);
      return;
    }
    const target = document.getElementById(id);
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { offset: -72 });
    else target.scrollIntoView({ behavior: "smooth" });
  }

  function onAction(action: NovaAction) {
    switch (action.kind) {
      case "ask":
        ask(action.question);
        break;
      case "scroll":
        goTo(action.target);
        if (window.matchMedia("(max-width: 640px)").matches) setOpen(false);
        break;
      case "link":
        if (action.external || action.href.startsWith("mailto:")) window.open(action.href, action.external ? "_blank" : "_self", "noopener");
        else router.push(action.href);
        break;
      case "theme":
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        break;
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input);
    setInput("");
  }

  function toggleQuiet() {
    const next = !quiet;
    setQuiet(next);
    setTip(null);
    try {
      localStorage.setItem(QUIET_KEY, next ? "1" : "0");
    } catch {}
  }

  return (
    <div className="fixed right-4 bottom-4 z-[56] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {open && (
        <section
          role="dialog"
          aria-label="Nova, site guide"
          className="animate-in fade-in slide-in-from-bottom-4 flex h-[min(34rem,calc(100svh-7rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border bg-background shadow-[0_30px_80px_-30px_color-mix(in_oklch,var(--foreground)_55%,transparent)] duration-300"
        >
          <header className="flex items-center gap-3 border-b px-4 py-3">
            <Face talking={thinking} size={34} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Nova</p>
              <p className="eyebrow inline-flex items-center gap-1.5 !text-[0.6rem]">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Site guide · answers from this portfolio
              </p>
            </div>
            <button
              type="button"
              onClick={toggleQuiet}
              aria-label={quiet ? "Turn tips on" : "Mute tips"}
              title={quiet ? "Turn tips on" : "Mute tips"}
              className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground"
            >
              {quiet ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            <button
              type="button"
              onClick={closeConsole}
              aria-label="Close"
              className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </header>

          <ul ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4" data-lenis-prevent aria-live="polite">
            {messages.map((m, i) => (
              <MessageBubble key={m.id} message={m} onAction={onAction} latest={i === messages.length - 1} />
            ))}
            {thinking && (
              <li className="flex items-center gap-1 px-1" aria-label="Nova is thinking">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </li>
            )}
          </ul>

          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about projects, skills, resume…"
              aria-label="Ask Nova"
              maxLength={200}
              className="h-11 min-w-0 flex-1 rounded-full bg-surface px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!input.trim() || thinking}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-signal text-signal-foreground transition-opacity disabled:opacity-40"
            >
              <SendHorizontal className="size-4" />
            </button>
          </form>
        </section>
      )}

      {!open && tip && <Bubble text={tip} onClose={() => setTip(null)} />}

      <button
        ref={orbRef}
        type="button"
        onClick={() => (open ? closeConsole() : openConsole())}
        aria-label={open ? "Close Nova" : "Open Nova, the site guide"}
        aria-expanded={open}
        className="group grid size-16 place-items-center rounded-full transition-transform duration-500 ease-[var(--ease-out-expo)] hover:scale-105 focus-visible:outline-offset-4 sm:size-[4.5rem]"
      >
        <Face talking={Boolean(tip) || thinking} />
      </button>
    </div>
  );
}
