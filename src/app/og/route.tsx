import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getPublishedProject, getSiteData } from "@/lib/content/queries";

// Generated share image, used when no image is uploaded in Settings (site) or as a project cover.
// Text only ever comes from published content (looked up by slug), never from the query string.

export const revalidate = 3600;

const PAPER = "#f4f1ea";
const INK = "#14130f";
const MUTED = "#6b675e";
const SIGNAL = "#e8521c";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("project");
  const [{ profile }, project] = await Promise.all([getSiteData(), slug ? getPublishedProject(slug) : Promise.resolve(null)]);

  const eyebrow = project ? `Case study${project.category ? ` — ${project.category}` : ""}` : profile.titles[0] || "Portfolio";
  const title = project?.title ?? (profile.full_name || "Portfolio");
  const body = project?.summary ?? profile.intro;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: PAPER, color: INK }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: MUTED }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: SIGNAL }} />
          {eyebrow}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: title.length > 24 ? 96 : 128, fontWeight: 700, letterSpacing: -5, lineHeight: 0.95 }}>{title}</div>
          {body && <div style={{ fontSize: 32, lineHeight: 1.35, color: MUTED, maxWidth: 900 }}>{body.slice(0, 160)}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: MUTED, borderTop: `1px solid #ddd7cb`, paddingTop: 24 }}>
          <span>{profile.full_name}</span>
          <span>{project ? `/projects/${project.slug}` : ""}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
