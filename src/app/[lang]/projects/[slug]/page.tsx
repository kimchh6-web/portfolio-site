import Link from "next/link";
import { notFound } from "next/navigation";
import { isLang, t, type Lang } from "@/lib/i18n";
import { getPublicBySlug } from "@/lib/content";
import { fmtRange } from "@/lib/dates";

export default async function ProjectDetail({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: l, slug } = await params;
  const lang = (isLang(l) ? l : "ko") as Lang;
  const e = await getPublicBySlug(slug, lang);
  if (!e) notFound();
  const tech = (e.extraObj.tech as string[] | undefined) ?? [];
  const links = (e.extraObj.links as { label: string; url: string }[] | undefined) ?? [];
  const cover = e.extraObj.coverImage as string | undefined;
  return (
    <article className="max-w-3xl">
      <Link href={`/${lang}/projects`} className="text-sm muted link-gold">← {t(lang, "back")}</Link>
      <h1 className="text-3xl font-bold mt-3 mb-1">{e.f.title}</h1>
      <div className="text-sm muted mb-4">{fmtRange(e.dateStart, e.dateEnd, e.isCurrent, lang)}</div>
      {cover && <img src={cover} alt="" className="rounded mb-6 max-h-[420px] object-cover w-full" />}
      {e.f.summary && <p className="text-lg mb-4">{e.f.summary}</p>}
      {e.f.role && <p className="mb-2"><span className="label inline mr-2">{t(lang, "role")}</span>{e.f.role}</p>}
      {tech.length > 0 && <div className="mb-4 flex flex-wrap gap-1"><span className="label inline mr-2">{t(lang, "tech")}</span>{tech.map((x) => <span key={x} className="tag">{x}</span>)}</div>}
      {e.f.body && <div className="prose whitespace-pre-line max-w-2xl">{e.f.body}</div>}
      {links.length > 0 && (
        <div className="mt-6"><h2 className="section-title text-lg">{t(lang, "links")}</h2>
          <ul className="list-disc pl-5">{links.map((x) => <li key={x.url}><a className="underline link-gold" href={x.url} target="_blank" rel="noreferrer">{x.label || x.url}</a></li>)}</ul></div>
      )}
    </article>
  );
}
