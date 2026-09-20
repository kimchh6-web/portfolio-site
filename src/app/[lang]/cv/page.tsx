import { isLang, LANGS, LANG_LABEL, t, type Lang } from "@/lib/i18n";
import { listPublic } from "@/lib/content";

export default async function CvPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = (isLang(l) ? l : "ko") as Lang;
  const count = (await listPublic(["project", "paper", "intl_workshop", "under_review", "preprint", "award", "talk", "work", "education", "training", "skill", "interest"], lang, { inCv: true })).length;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="section-title !my-0 text-2xl">CV</h1>
        <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
          <span className="muted">{t(lang, "cv_lang")}</span>
          {LANGS.map((x) => <a key={x} href={`/${x}/cv`} className={`btn !py-1 ${x === lang ? "border-gold" : ""}`}>{LANG_LABEL[x]}</a>)}
          <a href={`/api/cv/pdf?lang=${lang}`} className="btn btn-primary !py-1">{t(lang, "download_pdf")}</a>
        </div>
      </div>
      {count === 0 ? <p className="muted">{t(lang, "no_content")}</p> :
        <iframe title="CV preview" src={`/api/cv/pdf?lang=${lang}&preview=1`} className="w-full bg-white" style={{ height: "calc(100vh - 220px)", minHeight: 600 }} />}
    </div>
  );
}
