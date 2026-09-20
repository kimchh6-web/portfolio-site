import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { verifyDownload } from "@/lib/sign";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// /api/documents/<fileId>?exp=<unix>&sig=<hmac>  — 관리자 세션이 있으면 서명 없이 허용
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fileId = Number(id);
  const file = await prisma.documentFile.findUnique({ where: { id: fileId }, include: { document: true } });
  if (!file || file.document.deletedAt) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (!(await isAdmin())) {
    const exp = Number(req.nextUrl.searchParams.get("exp") || 0);
    const sig = req.nextUrl.searchParams.get("sig") || "";
    if (!file.document.isPublic || !verifyDownload(fileId, exp, sig)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const dir = path.resolve(process.env.STORAGE_DIR || "./storage");
  const buf = await fs.readFile(path.join(dir, file.storagePath));
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
