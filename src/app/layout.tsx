import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getSiteData } from "@/lib/content/queries";
import { siteUrl } from "@/lib/env";
import { assetUrl } from "@/lib/storage";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { profile, settings } = await getSiteData();
  const title = settings.site_title || profile.full_name || "Portfolio";
  const description = settings.site_description || profile.intro;
  const ogImage = assetUrl(settings.og_image_path) ?? "/og";
  const favicon = assetUrl(settings.favicon_path);

  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s — ${profile.full_name || title}` },
    description,
    keywords: settings.seo_keywords,
    authors: profile.full_name ? [{ name: profile.full_name }] : undefined,
    creator: profile.full_name || undefined,
    alternates: { canonical: "/" },
    icons: favicon ? { icon: favicon } : undefined,
    openGraph: {
      type: "website",
      url: "/",
      siteName: title,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0c" },
  ],
};

// Marks the document before first paint when the visitor allows motion, so entrance animations can
// start from hidden without a flash (and nothing is hidden for reduced-motion or no-JS visitors).
// On the first public page of a visit it also turns on the short intro overlay (preloader.tsx).
const motionScript = `try{var d=document.documentElement;if(matchMedia('(prefers-reduced-motion: no-preference)').matches){d.classList.add('motion-ok');if(!location.pathname.startsWith('/admin')&&!sessionStorage.getItem('intro-seen'))d.classList.add('preload')}}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { settings } = await getSiteData();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
      </head>
      <body className="min-h-svh">
        <ThemeProvider defaultTheme={settings.default_theme}>
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
