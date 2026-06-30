import { renderQuotePdf } from "@/lib/pdf/render";

// @formepdf/core runs a WASM layout engine via node:fs — pin to the Node runtime.
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await renderQuotePdf(id);

  if (!result) {
    return new Response("Quote not found", { status: 404 });
  }

  return new Response(result.pdf as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${result.number}.pdf"`,
    },
  });
}
