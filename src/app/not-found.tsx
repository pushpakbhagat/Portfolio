import type { Metadata } from "next";
import Link from "next/link";
import { StatusPage, primaryButton } from "@/components/site/status-page";

export const metadata: Metadata = { title: "Page not found" };

/** Any URL that matches no route at all (outside the site's own layout). */
export default function NotFound() {
  return (
    <main>
      <StatusPage code="404" title="This page doesn't exist." body="It may have been moved or never existed.">
        <Link href="/" className={primaryButton}>
          Back home
        </Link>
      </StatusPage>
    </main>
  );
}
