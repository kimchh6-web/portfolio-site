import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LANG, isLang } from "@/lib/i18n";

const PUBLIC_FILE = /\.(.*)$/;

function pickFromHeader(h: string | null): string {
  if (!h) return DEFAULT_LANG;
  const parts = h.split(",").map((s) => s.trim().split(";")[0]);
  for (const p of parts) {
    const low = p.toLowerCase();
    if (low.startsWith("ko")) return "ko";
    if (low.startsWith("en")) return "en";
    if (low.startsWith("ja")) return "ja";
    if (low === "zh-tw" || low === "zh-hant" || low === "zh-hk") return "zh-TW";
    if (low.startsWith("zh")) return "zh-CN";
  }
  return DEFAULT_LANG;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname.startsWith("/_next") || PUBLIC_FILE.test(pathname)) {
    if (pathname.startsWith("/admin")) {
      const res = NextResponse.next();
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
    return NextResponse.next();
  }
  const first = pathname.split("/")[1];
  if (isLang(first)) {
    const res = NextResponse.next();
    res.cookies.set("lang", first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }
  const cookie = req.cookies.get("lang")?.value;
  const lang = isLang(cookie) ? cookie : pickFromHeader(req.headers.get("accept-language"));
  const url = req.nextUrl.clone();
  url.pathname = `/${lang}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
