"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ExternalLink, FileText, KeyRound, LogOut, Menu, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { signOut } from "@/lib/admin/auth-actions";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "./nav";

type Props = {
  email: string;
  unread: number;
  projects: { id: string; title: string }[];
  siteName: string;
  children: ReactNode;
};

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function Sidebar({ unread, siteName, onNavigate }: { unread: number; siteName: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <Link href="/admin" onClick={onNavigate} className="flex h-14 items-center gap-2.5 border-b px-5">
        <span className="grid size-6 place-items-center rounded-sm bg-foreground text-[11px] font-semibold text-background">
          {siteName.slice(0, 1).toUpperCase() || "P"}
        </span>
        <span className="truncate text-sm font-medium">{siteName}</span>
      </Link>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((group, g) => (
          <div key={g} className="mb-5">
            {group.title && <p className="eyebrow mb-2 px-2">{group.title}</p>}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-8 items-center gap-2.5 rounded-md px-2 text-sm transition-colors",
                        active ? "bg-sidebar-accent font-medium text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                      )}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                      {item.href === "/admin/messages" && unread > 0 && (
                        <span className="ml-auto rounded-full bg-signal px-1.5 text-[10px] leading-4 font-medium text-signal-foreground">
                          {unread}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t p-3">
        <a
          href="/"
          target="_blank"
          className="flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
        >
          <ExternalLink className="size-4" /> View site
        </a>
      </div>
    </div>
  );
}

export function AdminShell({ email, unread, projects, siteName, children }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setSearchOpen(false);
    router.push(href);
  };

  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-svh border-r bg-sidebar lg:block">
        <Sidebar unread={unread} siteName={siteName} />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 lg:px-8">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0">
              <SheetTitle className="sr-only">Admin menu</SheetTitle>
              <Sidebar unread={unread} siteName={siteName} onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-full max-w-sm items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="size-4" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline">Ctrl K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild aria-label={`${unread} unread messages`}>
              <Link href="/admin/messages?status=unread" className="relative">
                <Bell className="size-4" />
                {unread > 0 && <span className="absolute top-2 right-2 size-1.5 rounded-full bg-signal" />}
              </Link>
            </Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-2" aria-label="Account">
                  <span className="grid size-7 place-items-center rounded-full bg-foreground text-xs font-medium text-background uppercase">
                    {email.slice(0, 1)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/reset-password">
                    <KeyRound className="size-4" /> Change password
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/" target="_blank">
                    <ExternalLink className="size-4" /> View site
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void signOut()}>
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8 lg:py-10">{children}</main>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen} title="Search admin" description="Jump to a section or project">
        <CommandInput placeholder="Go to…" />
        <CommandList>
          <CommandEmpty>Nothing found.</CommandEmpty>
          {ADMIN_NAV.map((group, g) => (
            <CommandGroup key={g} heading={group.title || "General"}>
              {group.items.map((item) => (
                <CommandItem key={item.href} value={`${item.label} ${item.keywords ?? ""}`} onSelect={() => go(item.href)}>
                  <item.icon className="size-4" /> {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          {projects.length > 0 && (
            <CommandGroup heading="Projects">
              {projects.map((p) => (
                <CommandItem key={p.id} value={`project ${p.title}`} onSelect={() => go(`/admin/projects/${p.id}`)}>
                  <FileText className="size-4" /> {p.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
