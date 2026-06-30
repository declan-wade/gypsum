import { renderDocument } from "@formepdf/core";

import { prisma } from "@/lib/prisma";
import { InvoiceDocument } from "./InvoiceDocument";
import { QuoteDocument } from "./QuoteDocument";
import type { BillTo, DocumentData, Seller } from "./types";

type CompanyRow = {
  name: string;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  country: string | null;
};

type ContactRow = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
} | null;

function sellerFromConfig(
  config: Awaited<ReturnType<typeof prisma.businessConfig.findFirst>>,
): Seller {
  return {
    name: config?.businessName ?? "Your Business",
    email: config?.businessEmail ?? null,
    phone: config?.businessPhone ?? null,
    address: {
      line1: config?.businessAddressLine1 ?? null,
      line2: config?.businessAddressLine2 ?? null,
      city: config?.businessCity ?? null,
      state: config?.businessState ?? null,
      postcode: config?.businessPostcode ?? null,
    },
    abn: config?.abn ?? null,
    payTo: config?.payTo ?? null,
    bsb: config?.bsb ?? null,
    accountNumber: config?.accountNumber ?? null,
    bankName: config?.bankName ?? null,
  };
}

function billToFrom(company: CompanyRow, contact: ContactRow): BillTo {
  return {
    companyName: company.name,
    contactName: contact ? `${contact.firstName} ${contact.lastName}`.trim() : null,
    email: contact?.email ?? company.email,
    phone: contact?.phone ?? company.phone,
    address: {
      line1: company.addressLine1,
      line2: company.addressLine2,
      city: company.city,
      state: company.state,
      postcode: company.postcode,
      country: company.country,
    },
  };
}

export interface RenderedPdf {
  pdf: Uint8Array;
  /** Document number, used for the download filename. */
  number: string;
}

/** Render an invoice to PDF bytes. Returns null if the invoice does not exist. */
export async function renderInvoicePdf(id: string): Promise<RenderedPdf | null> {
  const [invoice, config] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: {
        company: true,
        contact: true,
        lineItems: { include: { product: true }, orderBy: { position: "asc" } },
      },
    }),
    prisma.businessConfig.findFirst(),
  ]);

  if (!invoice) return null;

  const data: DocumentData = {
    kind: "invoice",
    number: invoice.number,
    status: invoice.status,
    issueDate: invoice.issueDate,
    termDate: invoice.dueDate,
    notes: invoice.notes,
    seller: sellerFromConfig(config),
    billTo: billToFrom(invoice.company, invoice.contact),
    lineItems: invoice.lineItems.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
    subtotal: Number(invoice.subtotal),
    taxAmount: Number(invoice.taxAmount),
    total: Number(invoice.total),
    amountPaid: Number(invoice.amountPaid),
    balanceDue: Number(invoice.total) - Number(invoice.amountPaid),
  };

  const pdf = await renderDocument(<InvoiceDocument data={data} />);
  return { pdf, number: invoice.number };
}

/** Render a quote to PDF bytes. Returns null if the quote does not exist. */
export async function renderQuotePdf(id: string): Promise<RenderedPdf | null> {
  const [quote, config] = await Promise.all([
    prisma.quote.findUnique({
      where: { id },
      include: {
        company: true,
        contact: true,
        lineItems: { include: { product: true }, orderBy: { position: "asc" } },
      },
    }),
    prisma.businessConfig.findFirst(),
  ]);

  if (!quote) return null;

  const data: DocumentData = {
    kind: "quote",
    number: quote.number,
    status: quote.status,
    issueDate: quote.issueDate,
    termDate: quote.expiryDate,
    notes: quote.notes,
    seller: sellerFromConfig(config),
    billTo: billToFrom(quote.company, quote.contact),
    lineItems: quote.lineItems.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
    subtotal: Number(quote.subtotal),
    taxAmount: Number(quote.taxAmount),
    total: Number(quote.total),
  };

  const pdf = await renderDocument(<QuoteDocument data={data} />);
  return { pdf, number: quote.number };
}
