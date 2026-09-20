import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";
import LangSwitcher from "./LangSwitcher";

export default function SiteHeader({ lang, name, sections, current }: {
  lang: Lang; name: string; sections: { key: string; href: string }[]; current: string;
}) {
  const label = (key: string) => t(lang, `nav_${key}` as never);
  return (
    <header className="border-b border-line">
      <div className="container flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
        <Link href={`/${lang}`} className="font-semibold text-lg link-gold" style={{ fontFamily: "var(--font-serif)" }}>{name || "Portfolio"}</Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {sections.map((s) => (
            <Link key={s.key} href={`/${lang}${s.href}`} className={`py-1 link-gold ${current === s.key ? "nav-active" : ""}`}>{label(s.key)}</Link>
          ))}
        </nav>
        <div className="ml-auto"><LangSwitcher lang={lang} label={t(lang, "lang_switch")} /></div>
      </div>
    </header>
  );
}
