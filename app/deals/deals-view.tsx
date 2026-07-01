"use client";

import * as React from "react";
import { LayoutGridIcon, TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { DataTable } from "@/components/data-table";
import { columns, type DealRow } from "./columns";
import { DealsBoard } from "./deals-board";

type View = "table" | "board";

export function DealsView({ data }: { data: DealRow[] }) {
  const [view, setView] = React.useState<View>("table");

  return (
    <div className="flex flex-col gap-3">
      <ButtonGroup className="self-start">
        <Button
          variant={view === "table" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("table")}
          aria-pressed={view === "table"}
        >
          <TableIcon />
          Table
        </Button>
        <Button
          variant={view === "board" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("board")}
          aria-pressed={view === "board"}
        >
          <LayoutGridIcon />
          Board
        </Button>
      </ButtonGroup>

      {view === "table" ? (
        <DataTable columns={columns} data={data} />
      ) : (
        <DealsBoard data={data} />
      )}
    </div>
  );
}
