// Single source of truth for RBAC modules. Client-safe (no server imports) so
// both the sidebar/admin UI and the server-side guards share one registry.
//
// To add a future module: add an entry here, then create a 4-line
// app/<segment>/layout.tsx that calls requireModuleAccess("<key>"). Nav
// filtering, the user-admin permission picker, and route gating all read from
// this list automatically.

export type ModuleAccessLevel =
  // Any signed-in user can access (home, personal pages).
  | "always"
  // Grantable per-user via the Users admin screen.
  | "grantable"
  // Restricted to admins; never grantable to regular users.
  | "admin";

export interface ModuleDef {
  key: string;
  label: string;
  /** Top-level route this module guards (matches the sidebar url). */
  href: string;
  level: ModuleAccessLevel;
}

export const MODULE_REGISTRY = [
  // Home
  { key: "dashboard", label: "Dashboard", href: "/", level: "always" },
  { key: "my-tasks", label: "My Tasks", href: "/my-tasks", level: "always" },
  { key: "activities", label: "Activity", href: "/activities", level: "always" },
  // Clients
  { key: "companies", label: "Companies", href: "/companies", level: "grantable" },
  { key: "contacts", label: "Contacts", href: "/contacts", level: "grantable" },
  { key: "deals", label: "Deals", href: "/deals", level: "grantable" },
  // Finance
  { key: "invoices", label: "Invoices", href: "/invoices", level: "grantable" },
  { key: "quotes", label: "Quotes", href: "/quotes", level: "grantable" },
  { key: "products", label: "Products", href: "/products", level: "grantable" },
  { key: "line-items", label: "Line Items", href: "/line-items", level: "grantable" },
  // Management
  { key: "projects", label: "Projects", href: "/projects", level: "grantable" },
  { key: "tasks", label: "Tasks", href: "/tasks", level: "grantable" },
  { key: "time-tracking", label: "Time Tracking", href: "/time-tracking", level: "grantable" },
  // Operations / Configuration — admin only
  { key: "users", label: "Users", href: "/users", level: "admin" },
  { key: "workflows", label: "Workflows", href: "/workflows", level: "admin" },
  { key: "business-config", label: "Business Config", href: "/business-config", level: "admin" },
  { key: "settings", label: "Settings", href: "/settings", level: "always" },
] as const satisfies readonly ModuleDef[];

export type ModuleKey = (typeof MODULE_REGISTRY)[number]["key"];

export const GRANTABLE_MODULES = MODULE_REGISTRY.filter(
  (m) => m.level === "grantable"
);

const ALWAYS_KEYS: string[] = MODULE_REGISTRY.filter((m) => m.level === "always").map(
  (m) => m.key
);
const GRANTABLE_KEYS = new Set<string>(GRANTABLE_MODULES.map((m) => m.key));
const ALL_KEYS: string[] = MODULE_REGISTRY.map((m) => m.key);

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin";
}

// The set of module keys a user can access, given their role and the modules
// explicitly granted to them. Admins get everything; everyone else gets the
// always-on modules plus any granted grantable module (admin modules are never
// included for non-admins).
export function computeAccessibleModules(
  role: string | null | undefined,
  grantedKeys: readonly string[]
): Set<string> {
  if (isAdminRole(role)) return new Set(ALL_KEYS);
  const accessible = new Set<string>(ALWAYS_KEYS);
  for (const key of grantedKeys) {
    if (GRANTABLE_KEYS.has(key)) accessible.add(key);
  }
  return accessible;
}

// Keep only valid grantable keys — guards against stale/unknown keys being
// persisted from a client submission.
export function sanitizeGrantableKeys(keys: readonly string[]): string[] {
  return [...new Set(keys)].filter((k) => GRANTABLE_KEYS.has(k));
}

export function hrefsForModuleKeys(keys: Iterable<string>): string[] {
  const byKey = new Map<string, string>(MODULE_REGISTRY.map((m) => [m.key, m.href]));
  const hrefs: string[] = [];
  for (const key of keys) {
    const href = byKey.get(key);
    if (href) hrefs.push(href);
  }
  return hrefs;
}
