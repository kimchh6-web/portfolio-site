import { isLang, t, type Lang } from "@/lib/i18n";
import { listPublic } from "@/lib/content";
import { LineItem } from "@/components/EntryCard";

export default async function Research({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = (isLang(l) ? l : "ko") as Lang;
  const papers = await listPublic(["paper", "intl_workshop", "under_review", "preprint"], lang);
  const awards = await listPublic(["award"], lang);
  const talks = await listPublic(["talk"], lang);
  const block = (title: string, items: typeof papers, secondary: string[]) => items.length > 0 && (
    <section><h2 className="section-title">{title}</h2><ul className="max-w-3xl">{items.map((e) => <LineItem key={e.id} e={e} lang={lang} primary="title" secondary={secondary} />)}</ul></section>
  );
  return (
    <div>
      <h1 className="section-title !mt-0 text-2xl">{t(lang, "nav_research")}</h1>
      {papers.length + awards.length + talks.length === 0 && <p className="muted">{t(lang, "no_content")}</p>}
      {block(t(lang, "papers"), papers, ["authors", "venue", "title_tr"])}
      {block(t(lang, "awards"), awards, ["org", "summary"])}
      {block(t(lang, "talks"), talks, ["venue"])}
    </div>
  );
}
