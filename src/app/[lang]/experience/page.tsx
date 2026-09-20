import { isLang, t, type Lang } from "@/lib/i18n";
import { listPublic } from "@/lib/content";
import { LineItem } from "@/components/EntryCard";

export default async function Experience({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = (isLang(l) ? l : "ko") as Lang;
  const work = await listPublic(["work"], lang);
  const edu = await listPublic(["education"], lang);
  const training = await listPublic(["training"], lang);
  return (
    <div>
      <h1 className="section-title !mt-0 text-2xl">{t(lang, "nav_experience")}</h1>
      {work.length + edu.length + training.length === 0 && <p className="muted">{t(lang, "no_content")}</p>}
      {work.length > 0 && <section><h2 className="section-title">{t(lang, "work")}</h2><ul className="max-w-3xl">{work.map((e) => <LineItem key={e.id} e={e} lang={lang} primary="org" secondary={["title", "location"]} />)}</ul></section>}
      {edu.length > 0 && <section><h2 className="section-title">{t(lang, "education")}</h2><ul className="max-w-3xl">{edu.map((e) => <LineItem key={e.id} e={e} lang={lang} primary="org" secondary={["degree", "location", "summary"]} />)}</ul></section>}
      {training.length > 0 && <section><h2 className="section-title">{t(lang, "training")}</h2><ul className="max-w-3xl">{training.map((e) => <LineItem key={e.id} e={e} lang={lang} primary="title" secondary={["org", "summary"]} />)}</ul></section>}
    </div>
  );
}
