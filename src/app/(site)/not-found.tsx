import Link from "next/link";
import { StatusPage, primaryButton, secondaryButton } from "@/components/site/status-page";

export default function SiteNotFound() {
  return (
    <StatusPage code="404" title="This page doesn't exist." body="It may have been moved, renamed or unpublished. The work is still all on the home page.">
      <Link href="/" className={primaryButton}>
        Back home
      </Link>
      <Link href="/#work" className={secondaryButton}>
        See projects
      </Link>
    </StatusPage>
  );
}
