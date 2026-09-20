import { NextRequest, NextResponse } from "next/server";
import { isLang } from "@/lib/i18n";
import { buildCvHtml } from "@/lib/cv-render";
import { htmlToPdf } from "@/lib/pdf";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang") ?? "ko";
  if (!isLang(lang)) return NextResponse.json({ error: "bad lang" }, { status: 400 });
  const admin = await isAdmin();
  const wantPrivate = req.nextUrl.searchParams.get("all") === "1" && admin;
  const preview = req.nextUrl.searchParams.get("preview") === "1";
  const { html, filename } = await buildCvHtml(lang, wantPrivate);
  if (preview) return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  try {
    const pdf = await htmlToPdf(html);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
