import { isLang, t, type Lang } from "@/lib/i18n";
import { EMPTY_PROFILE, getSetting, type SiteProfile } from "@/lib/content";

export default async function Contact({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = (isLang(l) ? l : "ko") as Lang;
  const p = await getSetting<SiteProfile>("profile", EMPTY_PROFILE);
  return (
    <div className="max-w-xl">
      <h1 className="section-title !mt-0 text-2xl">{t(lang, "contact_title")}</h1>
      <div className="space-y-2">
        {p.email && <p><span className="label inline mr-2">{t(lang, "email")}</span><a className="underline link-gold" href={`mailto:${p.email}`}>{p.email}</a></p>}
        {p.github && <p><span className="label inline mr-2">GitHub</span><a className="underline link-gold" href={p.github} target="_blank" rel="noreferrer">{p.github}</a></p>}
        {p.profileUrl && <p><span className="label inline mr-2">Profile</span><a className="underline link-gold" href={p.profileUrl} target="_blank" rel="noreferrer">{p.profileUrl}</a></p>}
        {(p.links ?? []).map((x) => <p key={x.url}><span className="label inline mr-2">{x.label}</span><a className="underline link-gold" href={x.url} target="_blank" rel="noreferrer">{x.url}</a></p>)}
      </div>
    </div>
  );
}
