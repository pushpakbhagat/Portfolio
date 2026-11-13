import type { Metadata } from "next";
import { AdminTheme } from "@/components/admin/admin-theme";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <TooltipProvider delayDuration={300}>
      <AdminTheme>{children}</AdminTheme>
    </TooltipProvider>
  );
}
