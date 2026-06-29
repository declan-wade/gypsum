import {
  Building2,
  Users,
  Handshake,
  FileText,
  FileCheck,
  Package,
  List,
  UserCog,
  Clock,
  FolderKanban,
  ListChecks,
  type LucideIcon,
  Cog,
} from "lucide-react"

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
}

export interface NavGroup {
  title: string
  url: string
  items: NavItem[]
}

export const navMain: NavGroup[] = [
  {
    title: "Clients",
    url: "#",
    items: [
      { title: "Companies", url: "/companies", icon: Building2 },
      { title: "Contacts", url: "/contacts", icon: Users },
      { title: "Deals", url: "/deals", icon: Handshake },
    ],
  },
  {
    title: "Finance",
    url: "#",
    items: [
      { title: "Invoices", url: "/invoices", icon: FileText },
      { title: "Quotes", url: "/quotes", icon: FileCheck },
      { title: "Products", url: "/products", icon: Package },
      { title: "Line Items", url: "/line-items", icon: List },
    ],
  },
  {
    title: "Management",
    url: "#",
    items: [
      { title: "Projects", url: "/projects", icon: FolderKanban },
      { title: "Tasks", url: "/tasks", icon: ListChecks },
      { title: "Users", url: "/users", icon: UserCog },
      { title: "Time Tracking", url: "/time-tracking", icon: Clock },
    ],
  },
  {
    title: "Configuration",
    url: "#",
    items: [
      { title: "Business Config", url: "/business-config", icon: Cog },
    ],
  },
]
