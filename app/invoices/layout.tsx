import { requireModuleAccess } from "@/lib/rbac";

// RBAC guard for the "invoices" module — gates the list and all nested routes.
export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireModuleAccess("invoices");
  return children;
}
