// Throwaway smoke test: renders the invoice & quote templates with mock data
// (no DB) to verify the formepdf WASM pipeline + templates produce valid,
// correctly-paginated PDFs. Run: bun run scripts/pdf-smoke.tsx
import { renderDocumentWithLayout } from "@formepdf/core";
import { writeFileSync } from "node:fs";

import { InvoiceDocument } from "@/lib/pdf/InvoiceDocument";
import { QuoteDocument } from "@/lib/pdf/QuoteDocument";
import type { DocumentData } from "@/lib/pdf/types";

const seller = {
  name: "Codex Group Pty Ltd",
  email: "declan@codexgroup.com.au",
  phone: "0400 000 000",
  address: { line1: "1 Example St", city: "Sydney", state: "NSW", postcode: "2000" },
  abn: "12 345 678 901",
  payTo: "Codex Group Pty Ltd",
  bsb: "062-000",
  accountNumber: "1234 5678",
  bankName: "CBA",
};

const billTo = {
  companyName: "Acme Industries",
  contactName: "Jane Buyer",
  email: "jane@acme.test",
  phone: "0411 111 111",
  address: { line1: "9 Client Rd", city: "Melbourne", state: "VIC", postcode: "3000" },
};

function items(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    description: `Professional services line item ${i + 1} — consulting & delivery`,
    quantity: 1 + (i % 3),
    unitPrice: 150,
    lineTotal: 150 * (1 + (i % 3)),
  }));
}

const invoice: DocumentData = {
  kind: "invoice",
  number: "INV00000002",
  status: "SENT",
  issueDate: new Date("2026-06-01"),
  termDate: new Date("2026-06-30"),
  notes: "Thank you for your business. Payment due within 30 days.",
  seller,
  billTo,
  lineItems: items(40), // many rows -> force multi-page + header repeat
  subtotal: 9000,
  taxAmount: 900,
  total: 9900,
  amountPaid: 1000,
  balanceDue: 8900,
};

const quote: DocumentData = {
  kind: "quote",
  number: "QU-1001",
  status: "DRAFT", // exercises the DRAFT watermark
  issueDate: new Date("2026-06-15"),
  termDate: new Date("2026-07-15"),
  notes: "Valid for 30 days.",
  seller,
  billTo,
  lineItems: items(3),
  subtotal: 900,
  taxAmount: 90,
  total: 990,
};

function collectText(el: any, out: string[]) {
  if (el?.textContent) out.push(el.textContent);
  for (const c of el?.children ?? []) collectText(c, out);
}

async function run(name: string, doc: any, path: string) {
  const { pdf, layout } = await renderDocumentWithLayout(doc);
  const header = String.fromCharCode(...pdf.slice(0, 5));
  const texts: string[] = [];
  for (const page of layout.pages) for (const el of page.elements) collectText(el, texts);
  writeFileSync(path, pdf);
  console.log(`\n[${name}] -> ${path}`);
  console.log(`  bytes=${pdf.length} header=${header} pages=${layout.pages.length}`);
  console.log(`  sampleText: ${texts.filter(Boolean).slice(0, 6).join(" | ")}`);
  if (header !== "%PDF-") throw new Error(`${name}: not a valid PDF`);
}

await run("invoice", <InvoiceDocument data={invoice} />, "/tmp/smoke-invoice.pdf");
await run("quote", <QuoteDocument data={quote} />, "/tmp/smoke-quote.pdf");
console.log("\nOK");
