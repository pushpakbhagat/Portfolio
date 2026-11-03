"use client";

import { useEffect } from "react";
import Link from "next/link";
import { StatusPage, primaryButton, secondaryButton } from "@/components/site/status-page";

/** Shown when a page fails to render (e.g. the database is unreachable). */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage code="500" title="Something went wrong." body="This page couldn't load right now. Trying again usually fixes it.">
      <button type="button" onClick={reset} className={primaryButton}>
        Try again
      </button>
      <Link href="/" className={secondaryButton}>
        Back home
      </Link>
    </StatusPage>
  );
}
