import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Accomplishment } from "@/lib/content/types";
import { ACCOMPLISHMENT_LABELS, formatMonth } from "@/lib/format";
import { assetUrl } from "@/lib/storage";
import { SectionHeader } from "../section-header";

/** A ledger: kind, title and issuer, date, credential link. Images open in a new tab. */
export function Accomplishments({ items, index }: { items: Accomplishment[]; index: string }) {
  return (
    <section id="achievements" className="container-page scroll-mt-20 py-24 md:py-32">
      <SectionHeader index={index} label="Recognition" title="Certifications &" accent="achievements." />
      <ul className="border-b" data-reveal-children>
        {items.map((item) => {
          const image = assetUrl(item.image_path);
          const link = item.credential_url || image;
          return (
            <li key={item.id} className="grid gap-3 border-t py-6 md:grid-cols-12 md:items-baseline md:gap-6">
              <span className="eyebrow md:col-span-2">{ACCOMPLISHMENT_LABELS[item.kind]}</span>
              <div className="flex items-start gap-4 md:col-span-6">
                {image && (
                  <span className="relative hidden size-12 shrink-0 overflow-hidden rounded-sm border bg-card sm:block">
                    <Image src={image} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-medium tracking-tight">{item.title}</h3>
                  {item.issuer && <p className="text-sm text-muted-foreground">{item.issuer}</p>}
                  {item.description && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{item.description}</p>}
                </div>
              </div>
              <span className="font-mono text-sm text-muted-foreground md:col-span-2">{formatMonth(item.issued_on)}</span>
              <span className="md:col-span-2 md:text-right">
                {link && (
                  <a href={link} target="_blank" rel="noreferrer" className="link-draw inline-flex items-center gap-1 text-sm">
                    {item.credential_url ? "Credential" : "Certificate"} <ArrowUpRight className="size-3.5" />
                  </a>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
