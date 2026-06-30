import { Document, Page } from "@formepdf/react";

import { Header, BillTo, LineItemsTable, Totals, Notes, Footer } from "./components";
import type { DocumentData } from "./types";

export function InvoiceDocument({ data }: { data: DocumentData }) {
  return (
    <Document
      title={`Invoice ${data.number}`}
      author={data.seller.name}
      style={{ fontSize: 9, color: "#0f172a" }}
    >
      <Page size="A4" margin={{ top: 40, right: 40, bottom: 56, left: 40 }}>
        <Footer data={data} />
        <Header data={data} title="Tax Invoice" />
        <BillTo data={data} />
        <LineItemsTable data={data} />
        <Totals data={data} />
        <Notes notes={data.notes} />
      </Page>
    </Document>
  );
}
