import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BODY_FONT, LANGS, SERIF_FONT, isLang, type Lang } from "@/lib/i18n";
import { EMPTY_PROFILE, getSetting, pickLang, type SiteProfile } from "@/lib/content";
import { prisma } from "@/lib/db";
import SiteHeader from "@/components/SiteHeader";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const p = await getSetting<SiteProfile>("profile", EMPTY_PROFILE);
  const name = pickLang(p.name, lang);
  const base = process.env.SITE_URL || "";
  return {
    title: p.siteTitle || "Portfolio",
    description: pickLang(p.tagline, lang),
    alternates: { languages: Object.fromEntries(LANGS.map((l) => [l, `${base}/${l}`])) },
  };
}

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const p = await getSetting<SiteProfile>("profile", EMPTY_PROFILE);

  // 내용이 있는 섹션만 메뉴에 노출
  const counts = await prisma.entry.groupBy({ by: ["kind"], where: { isPublic: true, deletedAt: null }, _count: { _all: true } });
  const has = (kinds: string[]) => counts.some((c) => kinds.includes(c.kind) && c._count._all > 0);
  const cvCount = await prisma.entry.count({ where: { inCv: true, isPublic: true, deletedAt: null } });
  const sections = [
    { key: "projects", href: "/projects", show: has(["project"]) },
    { key: "research", href: "/research", show: has(["paper", "intl_workshop", "under_review", "preprint", "award", "talk"]) },
    { key: "experience", href: "/experience", show: has(["work", "education", "training"]) },
    { key: "skills", href: "/skills", show: has(["skill"]) },
    { key: "cv", href: "/cv", show: cvCount > 0 },
    { key: "contact", href: "/contact", show: !!(p.email || p.github || p.links?.length) },
  ].filter((s) => s.show);

  return (
    <div lang={lang} style={{ ["--font-body" as string]: BODY_FONT[lang as Lang], ["--font-serif" as string]: SERIF_FONT[lang as Lang] }}>
      <SiteHeader lang={lang as Lang} name={p.siteTitle || "Portfolio"} sections={sections} current="" />
      <main className="container py-8 min-h-[70vh]">{children}</main>
      <footer className="container py-8 text-xs muted border-t border-line mt-12">
        © {new Date().getFullYear()} {pickLang(p.name, lang)}
      </footer>
    </div>
  );
}
