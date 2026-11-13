"use client";

import { saveProfile, saveSettings } from "@/lib/admin/actions";
import { profileSchema, settingsSchema } from "@/lib/admin/schemas";
import { AVAILABILITY_LABELS } from "@/lib/format";
import { SectionedForm, type FormGroup } from "./sectioned-form";

const PROFILE_GROUPS: FormGroup[] = [
  {
    title: "Identity",
    description: "How you introduce yourself across the site.",
    fields: [
      { name: "full_name", label: "Full name", type: "text" },
      { name: "email", label: "Public email", type: "email", description: "Shown in the contact section and footer. Leave empty to hide." },
      {
        name: "titles",
        label: "Professional titles",
        type: "list",
        itemLabel: "title",
        description: "The first is your main title. Add more and the hero rotates through them.",
        wide: true,
      },
      { name: "intro", label: "Hero introduction", type: "textarea", description: "One or two sentences under your name.", wide: true },
    ],
  },
  {
    title: "Availability",
    fields: [
      {
        name: "availability",
        label: "Status",
        type: "select",
        options: Object.entries(AVAILABILITY_LABELS).map(([value, label]) => ({ value, label })),
      },
      { name: "availability_note", label: "Short note", type: "text", placeholder: "Open to full-time roles from June", description: "Replaces the status label in the hero when set." },
    ],
  },
  {
    title: "About",
    description: "Only filled-in fields are shown.",
    fields: [
      {
        name: "about",
        label: "About you",
        type: "textarea",
        description: "Separate paragraphs with a blank line. The first paragraph is shown large and lights up as visitors scroll.",
        wide: true,
      },
      { name: "current_status", label: "Currently", type: "text", placeholder: "Software developer at …" },
      { name: "experience_summary", label: "Experience", type: "text", placeholder: "e.g. 2 years building web apps" },
      { name: "interests", label: "Technical interests", type: "textarea", wide: true },
      { name: "career_goals", label: "Career goals", type: "textarea", wide: true },
    ],
  },
  {
    title: "Location",
    fields: [
      { name: "location", label: "Location", type: "text", placeholder: "Pune, India" },
      { name: "timezone", label: "Timezone", type: "text", placeholder: "Asia/Kolkata", description: "Shows your local time in the hero. Leave empty to hide." },
    ],
  },
  {
    title: "Photo and resume",
    fields: [
      {
        name: "photo_path",
        label: "Profile photo",
        type: "image",
        folder: "profile",
        description: "Best: a PNG or WebP with the background removed (remove.bg, Canva), so you stand on the page. A normal photo works too; its edges fade out.",
      },
      { name: "resume_path", label: "Resume (PDF)", type: "image", folder: "resume", accept: "image+pdf", description: "Adds “Download resume” buttons." },
    ],
  },
];

export function ProfileForm({ defaultValues }: { defaultValues: Record<string, unknown> }) {
  return <SectionedForm groups={PROFILE_GROUPS} schema={profileSchema} defaultValues={defaultValues} save={saveProfile} />;
}

const SECTION_TOGGLES = [
  ["focus", "What I do"],
  ["projects", "Projects"],
  ["skills", "Skills"],
  ["experience", "Experience"],
  ["education", "Education"],
  ["accomplishments", "Certifications & achievements"],
  ["github", "GitHub"],
  ["contact", "Contact form"],
] as const;

const SETTINGS_GROUPS: FormGroup[] = [
  {
    title: "Publishing",
    fields: [
      {
        name: "is_published",
        label: "Portfolio is live",
        type: "switch",
        description: "When off, visitors see a short “back soon” page. The admin keeps working.",
        wide: true,
      },
    ],
  },
  {
    title: "Search and sharing",
    description: "Defaults for search engines and link previews. Project pages have their own.",
    fields: [
      { name: "site_title", label: "Site title", type: "text", wide: true },
      { name: "site_description", label: "Description", type: "textarea", wide: true },
      { name: "seo_keywords", label: "Keywords", type: "tags", wide: true },
      { name: "og_image_path", label: "Share image", type: "image", folder: "site", description: "1200 × 630 px. Shown when the site is shared." },
      { name: "favicon_path", label: "Favicon", type: "image", folder: "site", description: "Square PNG, SVG or ICO." },
    ],
  },
  {
    title: "Appearance and navigation",
    fields: [
      {
        name: "design",
        label: "Design",
        type: "select",
        description: "The look every visitor sees. Paper has its own content below.",
        options: [
          { value: "studio", label: "Studio (original)" },
          { value: "paper", label: "Paper (hand-drawn)" },
        ],
      },
      {
        name: "default_theme",
        label: "Default theme",
        type: "select",
        options: [
          { value: "system", label: "Follow the visitor's system" },
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ],
      },
      { name: "logo_path", label: "Logo", type: "image", folder: "site", description: "Replaces your name in the top bar. Optional." },
      { name: "nav_links", label: "Navigation links", type: "links", description: "Use #about, #work, #skills, #experience, #education, #achievements, #github or #contact. Both designs use these; Paper adds its off-screen link itself.", wide: true },
      { name: "footer_text", label: "Footer text", type: "textarea", wide: true },
    ],
  },
  {
    id: "paper",
    title: "Paper design",
    description: "Only shown when the design above is set to Paper. Empty blocks are left out.",
    fields: [
      {
        name: "paper_palette",
        label: "Colours",
        type: "select",
        options: [
          { value: "plum", label: "Plum and peach" },
          { value: "blueprint", label: "Blueprint (cobalt and yellow)" },
          { value: "marigold", label: "Marigold and ink" },
          { value: "forest", label: "Forest desk" },
        ],
      },
      { name: "paper_show_compass", label: "Show the compass", type: "switch", description: "The mini-map in the corner of large screens." },
      { name: "paper_show_switchboard", label: "Show the tech switches", type: "switch", description: "Switches above your projects that highlight them by technology." },
      { name: "paper_headline", label: "Headline", type: "text", placeholder: "Apps that feel", description: "The rotating words follow it." },
      { name: "paper_swap_words", label: "Rotating words", type: "tags", description: "Up to 6, e.g. fast, simple, alive." },
      { name: "paper_beliefs", label: "Things I believe in", type: "list", itemLabel: "belief", description: "Short lines, shown as paper scraps.", wide: true },
      { name: "paper_looking_for", label: "What I look for", type: "list", itemLabel: "item", description: "Up to 3. Visitors tick them off to finish a drawing.", wide: true },
      { name: "paper_meme_path", label: "Footer image", type: "image", folder: "site", description: "A meme or photo for the end of the page. Optional." },
      { name: "paper_meme_caption", label: "Footer image caption", type: "text" },
    ],
  },
  {
    id: "off-screen",
    title: "Off-screen page",
    description: "Paper design only: a separate page about life outside work, at /off-screen. Empty blocks are left out.",
    fields: [
      { name: "paper_show_off_screen", label: "Show the off-screen page", type: "switch", description: "Off hides the page and every link to it.", wide: true },
      { name: "os_intro", label: "Intro", type: "textarea", wide: true },
      { name: "os_track_title", label: "On repeat: track", type: "text", placeholder: "Song title" },
      { name: "os_track_artist", label: "On repeat: artist", type: "text" },
      {
        name: "os_track_path",
        label: "On repeat: audio file",
        type: "image",
        folder: "audio",
        accept: "audio",
        description: "Plays when a visitor presses play. Only upload audio you have the right to share.",
        wide: true,
      },
      { name: "os_playlists", label: "Playlist labels", type: "list", itemLabel: "label", description: "e.g. coding: lo-fi", wide: true },
      { name: "os_films", label: "Film tickets", type: "list", itemLabel: "ticket", description: "Write each as label: title, e.g. favourite film: Interstellar", wide: true },
      { name: "os_film_images", label: "Film strip images", type: "images", folder: "site", max: 8, description: "Shown as the frames of the film strip. Without any, the frames show your ticket titles.", wide: true },
      { name: "os_anime", label: "Anime notes", type: "list", itemLabel: "note", description: "e.g. watching: One Piece", wide: true },
      { name: "os_anime_images", label: "Anime images", type: "images", folder: "site", max: 8, description: "Shown one at a time on a card in the manga panel. Clicking the card moves to the next.", wide: true },
      { name: "os_shouts", label: "Manga panel lines", type: "list", itemLabel: "line", description: "Short and loud. The panel cycles through them on click.", wide: true },
      { name: "os_games", label: "Games", type: "list", itemLabel: "game", description: "Write each as name: note, e.g. GTA: open-world chaos", wide: true },
    ],
  },
  {
    title: "Sections",
    description: "Turn whole sections of the home page on or off. Sections without content are hidden anyway.",
    fields: SECTION_TOGGLES.map(([key, label]) => ({ name: `sections.${key}`, label, type: "switch" as const })),
  },
  {
    title: "Announcement banner",
    fields: [
      { name: "announcement_enabled", label: "Show the banner", type: "switch", wide: true },
      { name: "announcement_text", label: "Text", type: "text", placeholder: "New case study: …" },
      { name: "announcement_url", label: "Link", type: "text", placeholder: "/projects/… or https://…" },
    ],
  },
  {
    id: "github",
    title: "GitHub",
    fields: [
      { name: "github_username", label: "Username", type: "text", placeholder: "pushpakbhagat", description: "Leave empty to hide the GitHub section." },
      { name: "github_show_activity", label: "Show contribution graph", type: "switch", description: "Needs GITHUB_TOKEN on the server." },
    ],
  },
  {
    title: "Contact notifications",
    fields: [
      {
        name: "notification_email",
        label: "Send new messages to",
        type: "email",
        description: "Private: never shown on the site. Needs RESEND_API_KEY and CONTACT_FROM_EMAIL on the server; messages are always saved to the inbox.",
        wide: true,
      },
    ],
  },
];

export function SettingsForm({ defaultValues }: { defaultValues: Record<string, unknown> }) {
  return <SectionedForm groups={SETTINGS_GROUPS} schema={settingsSchema} defaultValues={defaultValues} save={saveSettings} />;
}
