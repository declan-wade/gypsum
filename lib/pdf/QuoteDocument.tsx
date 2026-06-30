import { Document, Page, Watermark } from "@formepdf/react";

import { Header, BillTo, LineItemsTable, Totals, Notes, Footer } from "./components";
import type { DocumentData } from "./types";

export function QuoteDocument({ data }: { data: DocumentData }) {
  const isDraft = data.status.toUpperCase() === "DRAFT";
  return (
    <Document
      title={`Quote ${data.number}`}
      author={data.seller.name}
      style={{ fontSize: 9, color: "#0f172a" }}
    >
      <Page size="A4" margin={{ top: 40, right: 40, bottom: 56, left: 40 }}>
        {isDraft ? (
          <Watermark text="DRAFT" fontSize={96} color="rgba(15,23,42,0.06)" angle={-45} />
        ) : null}
        <Footer data={data} />
        <Header data={data} title="Quote" />
        <BillTo data={data} />
        <LineItemsTable data={data} />
        <Totals data={data} />
        <Notes notes={data.notes} />
      </Page>
    </Document>
  );
}
