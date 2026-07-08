"use client";

import { DataTable } from "@/components/data-table";
import { getColumns } from "./columns";
import type { AuthUser } from "@/lib/auth/users";

interface CompanyOption {
  value: string;
  label: string;
}

// Client wrapper so the company-aware columns are built on the client. Server
// components can pass values into "use client" modules but can't call their
// functions, so getColumns() is invoked here rather than in page.tsx.
export function UsersTable({
  data,
  companies,
  modulesByUser,
}: {
  data: AuthUser[];
  companies: CompanyOption[];
  modulesByUser: Record<string, string[]>;
}) {
  return <DataTable columns={getColumns(companies, modulesByUser)} data={data} />;
}
