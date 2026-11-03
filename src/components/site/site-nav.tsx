"use client";

import { useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLenis } from "@/components/motion/motion-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Availability, NavLink, SocialLink } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  logo: string | null;
  links: NavLink[];
  socials: SocialLink[];
  availability: Availability;
  showContact: boolean;
};

/** "#about" works from every page: on the home page it scrolls, elsewhere it navigates home first. */
const toHref = (href: string) => (href.startsWith("#") ? `/${href}` : href);

export function SiteNav({ name, logo, links, socials, availability, showContact }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const lenis = useLenis();
  // Settings may already list Contact; never show it twice.
  const menuLinks =
    showContact && !links.some((l) => l.href === "#contact") ? [...links, { label: "Contact", href: "#contact" }] : links;

  // Hide while scrolling down, reappear on the way up. One ScrollTrigger, no scroll listener.
  useGSAP(
    () => {
      const el = ref.current!;
      let hidden = false;
      const st = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate(self) {
          const y = self.scroll();
          setScrolled(y > 24);
          const hide = self.direction === 1 && y > 240;
          if (hide === hidden) return;
          hidden = hide;
          gsap.to(el, { yPercent: hide ? -100 : 0, duration: 0.5, ease: "expo.out", overwrite: true });
        },
      });
      return () => st.kill();
    },
    { scope: ref },
  );

  function onAnchorClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith("#") || pathname !== "/") return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    const go = () => {
      if (lenis) lenis.scrollTo(target as HTMLElement, { offset: -72 });
      else target.scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", href);
    };
    // From the mobile menu, wait for it to close (it locks page scrolling while open).
    if (open) {
      setOpen(false);
      window.setTimeout(go, 350);
    } else go();
  }

  return (
    <header
      ref={ref}
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-500",
        scrolled ? "border-border bg-background/95" : "border-transparent bg-transparent",
      )}
    >
      <nav aria-label="Main" className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" className="group flex h-11 items-center gap-2.5 text-sm font-medium tracking-tight">
          <span className="relative grid size-2 place-items-center" aria-hidden>
            <span
              className={cn(
                "absolute size-2 rounded-full",
                availability === "open" ? "bg-signal" : availability === "limited" ? "bg-amber-500" : "bg-muted-foreground",
              )}
            />
            {availability === "open" && <span className="absolute size-2 animate-ping rounded-full bg-signal/60" />}
          </span>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- uploaded logo, any format incl. SVG
            <img src={logo} alt={name || "Home"} className="h-6 w-auto" />
          ) : (
            name || "Home"
          )}
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <ul className="mr-3 flex items-center gap-6">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={toHref(link.href)}
                  onClick={(e) => onAnchorClick(e, link.href)}
                  className="link-draw text-sm text-foreground/75 transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <ThemeToggle />
          {showContact && (
            <Link
              href="/#contact"
              onClick={(e) => onAnchorClick(e, "#contact")}
              className="beam ml-2 inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:-translate-y-px"
            >
              Let&apos;s talk
            </Link>
          )}
        </div>

        <div className="-mr-2 flex items-center md:hidden">
          <ThemeToggle className="size-11" />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="eyebrow !text-foreground h-11 px-3">Menu</SheetTrigger>
            <SheetContent side="top" className="gap-0 border-0 bg-background p-0 data-[side=top]:h-dvh">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="container-page flex h-full flex-col pt-20 pb-[max(2rem,env(safe-area-inset-bottom))]">
                <ul className="flex flex-col">
                  {menuLinks.map((link, i) => (
                    <li
                      key={link.href}
                      className="animate-in fade-in slide-in-from-bottom-6 fill-mode-both duration-700"
                      style={{ animationDelay: `${100 + i * 70}ms` }}
                    >
                      <SheetClose asChild>
                        <Link
                          href={toHref(link.href)}
                          onClick={(e) => onAnchorClick(e, link.href)}
                          className="flex items-baseline gap-4 border-b py-4 text-[clamp(2.5rem,12vw,3.5rem)] leading-none font-medium tracking-tighter"
                        >
                          <span className="eyebrow w-6">{String(i + 1).padStart(2, "0")}</span>
                          {link.label}
                        </Link>
                      </SheetClose>
                    </li>
                  ))}
                </ul>
                <div
                  className="mt-auto animate-in space-y-4 fade-in fill-mode-both duration-700"
                  style={{ animationDelay: `${150 + menuLinks.length * 70}ms` }}
                >
                  <p className="eyebrow inline-flex items-center gap-2">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        availability === "open" ? "bg-signal" : availability === "limited" ? "bg-amber-500" : "bg-muted-foreground",
                      )}
                    />
                    {name}
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {socials.map((s) => (
                      <li key={s.id}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-11 items-center rounded-full border px-4 text-sm"
                        >
                          {s.label || s.platform} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
