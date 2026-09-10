import { NextResponse } from "next/server";
import { requireSession, AuthorizationError } from "@/lib/auth-guard";
import { generateQuotationPdf } from "@/pdf/generate-quotation-pdf";
import { logError } from "@/lib/server-log";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
  } catch (err) {
    logError("pdf:auth", err);
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const { id } = await ctx.params;

  let buffer: Buffer | null = null;
  try {
    buffer = await generateQuotationPdf(id);
  } catch (err) {
    logError(`pdf:generate(${id})`, err);
    return NextResponse.json({ error: "Failed to generate PDF." }, { status: 500 });
  }

  if (!buffer) {
    return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${id}.pdf"`,
    },
  });
}
