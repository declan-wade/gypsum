import { renderInvoicePdf } from "@/lib/pdf/render";

// @formepdf/core runs a WASM layout engine via node:fs — pin to the Node runtime.
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await renderInvoicePdf(id);

  if (!result) {
    return new Response("Invoice not found", { status: 404 });
  }

  // Wrap in a Node Buffer so the runtime sends raw binary. Passing the bare
  // Uint8Array gets the body re-encoded as text on Vercel, producing a corrupt PDF.
  const body = Buffer.from(result.pdf);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `inline; filename="${result.number}.pdf"`,
    },
  });
}
