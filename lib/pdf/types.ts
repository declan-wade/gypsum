// Shared data shape for the invoice/quote PDF templates. Keeping this flat and
// decoupled from Prisma means the React document templates stay easy to read and
// edit, and the mapping from DB rows lives in one place (render.ts).

export type DocumentKind = "invoice" | "quote";

export interface PartyAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
}

/** The business issuing the document (from BusinessConfig). */
export interface Seller {
  name: string;
  email?: string | null;
  phone?: string | null;
  address: PartyAddress;
  abn?: string | null;
  // Bank/payment details — only shown on invoices.
  payTo?: string | null;
  bsb?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
}

/** Who the document is billed to (company + optional contact). */
export interface BillTo {
  companyName: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address: PartyAddress;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface DocumentData {
  kind: DocumentKind;
  /** Human-facing number, e.g. "INV00000002" or "QU-1001". */
  number: string;
  status: string;
  issueDate: Date;
  /** Due date for invoices, expiry date for quotes. */
  termDate: Date | null;
  notes?: string | null;

  seller: Seller;
  billTo: BillTo;
  lineItems: LineItem[];

  subtotal: number;
  taxAmount: number;
  total: number;
  // Invoice-only payment figures.
  amountPaid?: number;
  balanceDue?: number;
}
