"use client";

import { DataTable } from "@/components/data-table";
import { getColumns, type LineItemRow } from "./columns";
import type { ProductOption } from "./forms";

interface LineItemsTableProps {
  data: LineItemRow[];
  products: ProductOption[];
  action?: React.ReactNode;
}

export function LineItemsTable({ data, products, action }: LineItemsTableProps) {
  return <DataTable columns={getColumns(products)} data={data} action={action} />;
}
