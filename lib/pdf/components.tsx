// Reusable building blocks for the invoice/quote PDFs, built on @formepdf/react.
// These render server-side only (via renderDocument in the route handlers) — do
// not import them into client components.
//
// To restyle the documents, edit the StyleSheet below and these primitives; the
// per-document files (InvoiceDocument/QuoteDocument) just compose them.

import {
  View,
  Text,
  Table,
  Row,
  Cell,
  Fixed,
  StyleSheet,
} from "@formepdf/react";

import { formatMoney, formatDate } from "@/lib/format";
import type { DocumentData, PartyAddress, Seller } from "./types";

const COLORS = {
  ink: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  headerBg: "#1e293b",
  zebra: "#f8fafc",
};

const styles = StyleSheet.create({
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  businessName: { fontSize: 18, fontWeight: 700, color: COLORS.ink },
  metaLine: { fontSize: 9, color: COLORS.muted, lineHeight: 1.5 },
  docTitle: { fontSize: 24, fontWeight: 700, color: COLORS.ink, textAlign: "right" },
  metaRight: { fontSize: 9, color: COLORS.muted, textAlign: "right", lineHeight: 1.6 },
  metaRightStrong: { fontSize: 9, color: COLORS.ink, fontWeight: 700 },

  // Bill-to
  billRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.muted,
    marginBottom: 4,
    letterSpacing: 1,
  },
  billName: { fontSize: 11, fontWeight: 700, color: COLORS.ink, marginBottom: 2 },
  billLine: { fontSize: 9, color: COLORS.muted, lineHeight: 1.5 },

  // Table
  th: { fontSize: 8, fontWeight: 700, color: "#ffffff", letterSpacing: 0.5 },
  thRight: {
    fontSize: 8,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: 0.5,
    textAlign: "right",
  },
  cell: { paddingVertical: 7, paddingHorizontal: 8, fontSize: 9, color: COLORS.ink },
  headerCell: { paddingVertical: 8, paddingHorizontal: 8 },
  right: { textAlign: "right" },

  // Totals
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  totals: { width: 240 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 9, color: COLORS.muted },
  totalValue: { fontSize: 9, color: COLORS.ink, textAlign: "right" },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    marginTop: 4,
    borderTop: `1px solid ${COLORS.border}`,
  },
  grandLabel: { fontSize: 11, fontWeight: 700, color: COLORS.ink },
  grandValue: { fontSize: 11, fontWeight: 700, color: COLORS.ink, textAlign: "right" },

  // Notes
  notes: { marginTop: 28 },
  notesText: { fontSize: 9, color: COLORS.muted, lineHeight: 1.5 },

  // Footer
  footer: { borderTop: `1px solid ${COLORS.border}`, paddingTop: 8 },
  footerRow: { flexDirection: "row", justifyContent: "space-between" },
  footerLabel: { fontSize: 8, fontWeight: 700, color: COLORS.muted, marginBottom: 2 },
  footerText: { fontSize: 8, color: COLORS.muted, lineHeight: 1.5 },
  pageNum: { fontSize: 8, color: COLORS.muted, textAlign: "right" },
});

function addressLines(addr: PartyAddress): string[] {
  const cityLine = [addr.city, addr.state, addr.postcode].filter(Boolean).join(" ");
  return [addr.line1, addr.line2, cityLine, addr.country].filter(
    (l): l is string => Boolean(l && l.trim()),
  );
}

export function Header({ data, title }: { data: DocumentData; title: string }) {
  const { seller } = data;
  return (
    <View style={styles.header}>
      <View style={{ maxWidth: 280 }}>
        <Text style={styles.businessName}>{seller.name}</Text>
        {seller.abn ? <Text style={styles.metaLine}>ABN {seller.abn}</Text> : null}
        {addressLines(seller.address).map((line, i) => (
          <Text key={i} style={styles.metaLine}>
            {line}
          </Text>
        ))}
        {seller.email ? <Text style={styles.metaLine}>{seller.email}</Text> : null}
        {seller.phone ? <Text style={styles.metaLine}>{seller.phone}</Text> : null}
      </View>
      <View style={{ maxWidth: 220 }}>
        <Text style={styles.docTitle}>{title}</Text>
        <View style={{ marginTop: 8 }}>
          <Text style={styles.metaRight}>
            <Text style={styles.metaRightStrong}>Number  </Text>
            {data.number}
          </Text>
          <Text style={styles.metaRight}>
            <Text style={styles.metaRightStrong}>Issued  </Text>
            {formatDate(data.issueDate)}
          </Text>
          {data.termDate ? (
            <Text style={styles.metaRight}>
              <Text style={styles.metaRightStrong}>
                {data.kind === "invoice" ? "Due  " : "Expires  "}
              </Text>
              {formatDate(data.termDate)}
            </Text>
          ) : null}
          <Text style={styles.metaRight}>
            <Text style={styles.metaRightStrong}>Status  </Text>
            {data.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function BillTo({ data }: { data: DocumentData }) {
  const { billTo } = data;
  return (
    <View style={styles.billRow}>
      <View style={{ maxWidth: 280 }}>
        <Text style={styles.sectionLabel}>BILL TO</Text>
        <Text style={styles.billName}>{billTo.companyName}</Text>
        {billTo.contactName ? (
          <Text style={styles.billLine}>{billTo.contactName}</Text>
        ) : null}
        {addressLines(billTo.address).map((line, i) => (
          <Text key={i} style={styles.billLine}>
            {line}
          </Text>
        ))}
        {billTo.email ? <Text style={styles.billLine}>{billTo.email}</Text> : null}
        {billTo.phone ? <Text style={styles.billLine}>{billTo.phone}</Text> : null}
      </View>
    </View>
  );
}

export function LineItemsTable({ data }: { data: DocumentData }) {
  return (
    <Table
      columns={[
        { width: { fraction: 0.52 } },
        { width: { fraction: 0.12 } },
        { width: { fraction: 0.18 } },
        { width: { fraction: 0.18 } },
      ]}
    >
      <Row header style={{ backgroundColor: COLORS.headerBg }}>
        <Cell style={styles.headerCell}>
          <Text style={styles.th}>DESCRIPTION</Text>
        </Cell>
        <Cell style={styles.headerCell}>
          <Text style={styles.thRight}>QTY</Text>
        </Cell>
        <Cell style={styles.headerCell}>
          <Text style={styles.thRight}>UNIT PRICE</Text>
        </Cell>
        <Cell style={styles.headerCell}>
          <Text style={styles.thRight}>AMOUNT</Text>
        </Cell>
      </Row>
      {data.lineItems.map((item, i) => (
        <Row
          key={i}
          style={i % 2 === 1 ? { backgroundColor: COLORS.zebra } : undefined}
        >
          <Cell style={styles.cell}>
            <Text>{item.description}</Text>
          </Cell>
          <Cell style={styles.cell}>
            <Text style={styles.right}>{item.quantity}</Text>
          </Cell>
          <Cell style={styles.cell}>
            <Text style={styles.right}>{formatMoney(item.unitPrice)}</Text>
          </Cell>
          <Cell style={styles.cell}>
            <Text style={styles.right}>{formatMoney(item.lineTotal)}</Text>
          </Cell>
        </Row>
      ))}
    </Table>
  );
}

function TotalLine({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.totalRow}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={styles.totalValue}>{formatMoney(value)}</Text>
    </View>
  );
}

export function Totals({ data }: { data: DocumentData }) {
  const taxLabel = data.kind === "invoice" ? "GST (10%)" : "Tax";
  const isInvoice = data.kind === "invoice";
  return (
    <View style={styles.totalsWrap}>
      <View style={styles.totals}>
        <TotalLine label="Subtotal" value={data.subtotal} />
        <TotalLine label={taxLabel} value={data.taxAmount} />
        <View style={styles.grandRow}>
          <Text style={styles.grandLabel}>
            {isInvoice ? "Total" : "Total"}
          </Text>
          <Text style={styles.grandValue}>{formatMoney(data.total)}</Text>
        </View>
        {isInvoice && (data.amountPaid ?? 0) > 0 ? (
          <TotalLine label="Paid" value={data.amountPaid ?? 0} />
        ) : null}
        {isInvoice ? (
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Balance Due</Text>
            <Text style={styles.grandValue}>
              {formatMoney(data.balanceDue ?? data.total)}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function Notes({ notes }: { notes?: string | null }) {
  if (!notes || !notes.trim()) return null;
  return (
    <View style={styles.notes}>
      <Text style={styles.sectionLabel}>NOTES</Text>
      <Text style={styles.notesText}>{notes}</Text>
    </View>
  );
}

function hasBankDetails(seller: Seller): boolean {
  return Boolean(seller.bsb || seller.accountNumber || seller.payTo || seller.bankName);
}

/** Fixed footer: bank/payment details (invoices only) + page numbers. */
export function Footer({ data }: { data: DocumentData }) {
  const { seller } = data;
  const showBank = data.kind === "invoice" && hasBankDetails(seller);
  const payTo = seller.payTo || seller.name;
  return (
    <Fixed position="footer">
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          {showBank ? (
            <View style={{ maxWidth: 360 }}>
              <Text style={styles.footerLabel}>PAYMENT DETAILS</Text>
              <Text style={styles.footerText}>
                {payTo}
                {seller.bankName ? ` · ${seller.bankName}` : ""}
              </Text>
              <Text style={styles.footerText}>
                {seller.bsb ? `BSB ${seller.bsb}` : ""}
                {seller.bsb && seller.accountNumber ? "   " : ""}
                {seller.accountNumber ? `Acct ${seller.accountNumber}` : ""}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <Text style={styles.pageNum}>
            Page {"{{pageNumber}}"} of {"{{totalPages}}"}
          </Text>
        </View>
      </View>
    </Fixed>
  );
}
