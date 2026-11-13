"use client";

import { useEffect, type ReactNode } from "react";
import { paperFontClasses } from "@/components/site/paper/fonts";
import "./admin-theme.css";

/**
 * Applies the plum paper look to the admin. The root layout's inline script already marks
 * <html data-admin="paper"> on a direct visit; this covers arriving by in-app navigation and
 * removes the mark when leaving, so the public site keeps its own colours.
 */
export function AdminTheme({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.admin = "paper";
    return () => {
      delete root.dataset.admin;
    };
  }, []);

  return <div className={`admin-paper ${paperFontClasses}`}>{children}</div>;
}
