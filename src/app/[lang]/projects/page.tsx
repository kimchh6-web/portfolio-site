import { isLang, t, type Lang } from "@/lib/i18n";
import { listPublic } from "@/lib/content";
import { ProjectCard } from "@/components/EntryCard";

export default async function Projects({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = (isLang(l) ? l : "ko") as Lang;
  const items = await listPublic(["project"], lang);
  return (
    <div>
      <h1 className="section-title !mt-0 text-2xl">{t(lang, "nav_projects")}</h1>
      {items.length === 0 ? <p className="muted">{t(lang, "no_content")}</p> :
        <div className="max-w-2xl">{items.map((e) => <ProjectCard key={e.id} e={e} lang={lang} />)}</div>}
    </div>
  );
}
