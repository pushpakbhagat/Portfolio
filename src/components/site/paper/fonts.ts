import { Gochi_Hand, Reenie_Beanie, Special_Elite } from "next/font/google";

// Faces only the paper design uses. Not preloaded, so the studio design never downloads them.
const hand = Gochi_Hand({ variable: "--font-pp-hand", subsets: ["latin"], weight: "400", preload: false });
const signature = Reenie_Beanie({ variable: "--font-pp-sig", subsets: ["latin"], weight: "400", preload: false });
const typewriter = Special_Elite({ variable: "--font-pp-type", subsets: ["latin"], weight: "400", preload: false });

export const paperFontClasses = `${hand.variable} ${signature.variable} ${typewriter.variable}`;
