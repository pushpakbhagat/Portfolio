import {
  AtSign,
  Award,
  Briefcase,
  Compass,
  FolderKanban,
  GitBranch,
  GraduationCap,
  History,
  Inbox,
  LayoutDashboard,
  Settings,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; keywords?: string };

export const ADMIN_NAV: { title: string; items: NavItem[] }[] = [
  {
    title: "",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, keywords: "dashboard home" },
      { href: "/admin/messages", label: "Messages", icon: Inbox, keywords: "contact inbox email" },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/profile", label: "Profile", icon: UserRound, keywords: "about hero name photo resume availability" },
      { href: "/admin/projects", label: "Projects", icon: FolderKanban, keywords: "work case study portfolio" },
      { href: "/admin/skills", label: "Skills", icon: Wrench, keywords: "technologies categories toolkit" },
      { href: "/admin/focus", label: "What I do", icon: Compass, keywords: "services areas focus" },
      { href: "/admin/experience", label: "Experience", icon: Briefcase, keywords: "jobs work internship" },
      { href: "/admin/education", label: "Education", icon: GraduationCap, keywords: "degree qualifications university" },
      { href: "/admin/accomplishments", label: "Certifications", icon: Award, keywords: "achievements awards courses hackathons" },
      { href: "/admin/social", label: "Social links", icon: AtSign, keywords: "linkedin github twitter" },
      { href: "/admin/github", label: "GitHub", icon: GitBranch, keywords: "repositories repos" },
    ],
  },
  {
    title: "Site",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings, keywords: "seo theme navigation footer announcement publish" },
      { href: "/admin/activity", label: "Activity", icon: History, keywords: "log history changes" },
    ],
  },
];
