import { renderQuotePdf } from "@/lib/pdf/render";
import { hasModuleAccess } from "@/lib/rbac";

// @formepdf/core runs a WASM layout engine via node:fs — pin to the Node runtime.
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await hasModuleAccess("quotes"))) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const result = await renderQuotePdf(id);

  if (!result) {
    return new Response("Quote not found", { status: 404 });
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
