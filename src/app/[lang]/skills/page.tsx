import { isLang, t, type Lang } from "@/lib/i18n";
import { listPublic } from "@/lib/content";

export default async function Skills({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = (isLang(l) ? l : "ko") as Lang;
  const items = await listPublic(["skill"], lang);
  return (
    <div>
      <h1 className="section-title !mt-0 text-2xl">{t(lang, "nav_skills")}</h1>
      {items.length === 0 ? <p className="muted">{t(lang, "no_content")}</p> : (
        <div className="grid gap-y-3 gap-x-6 sm:grid-cols-[160px_1fr] max-w-3xl">
          {items.map((e) => (
            <div key={e.id} className="contents">
              <div className="font-medium">{e.f.category}</div>
              <div className="flex flex-wrap gap-1">{(e.f.title || "").split(",").map((s) => s.trim()).filter(Boolean).map((s) => <span key={s} className="tag">{s}</span>)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
