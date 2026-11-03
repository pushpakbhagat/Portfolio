import type { ReactNode } from "react";

/** Shared layout for 404 / error pages: big code, a line of explanation, actions. */
export function StatusPage({ code, title, body, children }: { code: string; title: string; body: string; children: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="bg-hairlines pointer-events-none absolute inset-0 -z-10" />
      <div className="container-page grid min-h-svh content-center gap-8 py-28">
        <p className="eyebrow">Error — {code}</p>
        <p
          aria-hidden
          className="text-[clamp(7rem,30vw,22rem)] leading-[0.8] font-semibold tracking-[-0.07em] text-transparent [-webkit-text-stroke:1px_color-mix(in_oklch,var(--foreground)_35%,transparent)]"
        >
          {code}
        </p>
        <div className="grid gap-6 border-t pt-6 md:grid-cols-12">
          <div className="md:col-span-7">
            <h1 className="text-title">
              <span className="serif-accent">{title}</span>
            </h1>
            <p className="mt-3 max-w-md text-muted-foreground">{body}</p>
          </div>
          <div className="flex flex-wrap items-start gap-3 md:col-span-5 md:justify-end">{children}</div>
        </div>
      </div>
    </section>
  );
}

export const primaryButton =
  "inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground";
export const secondaryButton =
  "inline-flex h-12 items-center rounded-full border border-foreground/25 px-6 text-sm font-medium transition-colors hover:border-foreground";
