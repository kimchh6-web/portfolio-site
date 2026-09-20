import Link from "next/link";
import type { EntryView } from "@/lib/content";
import { fmtRange } from "@/lib/dates";
import { t, type Lang } from "@/lib/i18n";

export function ProjectCard({ e, lang }: { e: EntryView; lang: Lang }) {
  const tech = (e.extraObj.tech as string[] | undefined) ?? [];
  return (
    <Link href={`/${lang}/projects/${e.slug}`} className="block py-4 group">
      <h3 className="font-semibold text-lg pb-2 mb-2 border-b border-gold-soft group-hover:border-gold group-hover:text-gold transition-colors">{e.f.title}</h3>
      {e.f.summary && <p className="text-sm">{e.f.summary}</p>}
      {(tech.length > 0 || e.dateStart) && <p className="text-xs muted mt-2">{[fmtRange(e.dateStart, e.dateEnd, e.isCurrent, lang), tech.slice(0, 6).join(" · ")].filter(Boolean).join("  ·  ")}</p>}
    </Link>
  );
}

export function LineItem({ e, lang, primary, secondary }: { e: EntryView; lang: Lang; primary: string; secondary?: string[] }) {
  const date = fmtRange(e.dateStart, e.dateEnd, e.isCurrent, lang);
  const sec = (secondary ?? []).map((k) => e.f[k]).filter(Boolean).join(" · ");
  return (
    <li className="py-3 border-b border-line last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="font-medium">{e.f[primary]}</span>
        {date && <span className="text-xs muted">{date}</span>}
      </div>
      {sec && <div className="text-sm muted">{sec}</div>}
      {e.f.body && <p className="text-sm mt-1 whitespace-pre-line">{e.f.body}</p>}
      {e.link && <a href={e.link} target="_blank" rel="noreferrer" className="text-xs link-gold underline">{t(lang, "view")}</a>}
    </li>
  );
}
