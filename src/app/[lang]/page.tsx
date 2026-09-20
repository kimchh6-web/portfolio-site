import Link from "next/link";
import { isLang, t, type Lang } from "@/lib/i18n";
import { EMPTY_PROFILE, getSetting, listPublic, pickLang, type SiteProfile } from "@/lib/content";
import { ProjectCard, LineItem } from "@/components/EntryCard";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = (isLang(l) ? l : "ko") as Lang;
  const p = await getSetting<SiteProfile>("profile", EMPTY_PROFILE);
  const photo = p.photo || "/profile.jpg";
  const featured = await listPublic(["project"], lang, { featured: true });
  const work = await listPublic(["work"], lang);
  const edu = await listPublic(["education"], lang);
  const training = await listPublic(["training"], lang);
  const name = pickLang(p.name, lang);

  return (
    <div className="grid gap-10 md:grid-cols-[260px_1px_1fr] md:gap-12 py-4">
      {/* 왼쪽: 사진 · 이름 · 소속 */}
      <aside className="md:sticky md:top-8 self-start">
        <img src={photo} alt={name} className="w-48 md:w-full rounded-md object-cover aspect-[4/5]" />
        <h1 className="text-3xl font-bold mt-5 mb-1">{name}</h1>
        {p.title && <div className="text-sm muted">{pickLang(p.title, lang)}</div>}
        {p.affiliation && <div className="text-sm">{pickLang(p.affiliation, lang)}</div>}
        {p.tagline && <p className="text-sm muted mt-4 leading-relaxed">{pickLang(p.tagline, lang)}</p>}
        <div className="mt-4 space-y-1 text-sm">
          {p.email && <a href={`mailto:${p.email}`} className="block link-gold underline">{p.email}</a>}
          {p.github && <a href={p.github} target="_blank" rel="noreferrer" className="block link-gold underline">GitHub</a>}
          {(p.links ?? []).map((x) => <a key={x.url} href={x.url} target="_blank" rel="noreferrer" className="block link-gold underline">{x.label || x.url}</a>)}
        </div>
      </aside>

      {/* 세로 구분선 */}
      <div className="hidden md:block bg-line" />

      {/* 오른쪽: 경력 */}
      <section className="min-w-0">
        {work.length > 0 && <><h2 className="section-title !mt-0">{t(lang, "work")}</h2><ul>{work.map((e) => <LineItem key={e.id} e={e} lang={lang} primary="org" secondary={["title", "location"]} />)}</ul></>}
        {edu.length > 0 && <><h2 className="section-title">{t(lang, "education")}</h2><ul>{edu.map((e) => <LineItem key={e.id} e={e} lang={lang} primary="org" secondary={["degree", "location", "summary"]} />)}</ul></>}
        {training.length > 0 && <><h2 className="section-title">{t(lang, "training")}</h2><ul>{training.map((e) => <LineItem key={e.id} e={e} lang={lang} primary="title" secondary={["org", "summary"]} />)}</ul></>}
        {featured.length > 0 && (
          <>
            <h2 className="section-title">{t(lang, "featured")}</h2>
            <div className="max-w-2xl">{featured.slice(0, 4).map((e) => <ProjectCard key={e.id} e={e} lang={lang} />)}</div>
            <div className="mt-4"><Link href={`/${lang}/projects`} className="btn">{t(lang, "all_projects")} →</Link></div>
          </>
        )}
        {work.length + edu.length + training.length + featured.length === 0 && <p className="muted">{t(lang, "no_content")}</p>}
      </section>
    </div>
  );
}
