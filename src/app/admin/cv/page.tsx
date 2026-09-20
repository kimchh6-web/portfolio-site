import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LANGS, LANG_LABEL, isLang, type Lang } from "@/lib/i18n";
import { CV_SECTIONS, KINDS, KIND_MAP } from "@/lib/kinds";
import { getSetting, setSetting } from "@/lib/content";
import { redirect } from "next/navigation";

async function setCvLang(fd: FormData) {
  "use server";
  await requireAdmin();
  const l = String(fd.get("lang"));
  if (isLang(l)) await setSetting("cvLang", l);
  redirect("/admin/cv");
}

export default async function CvEditor() {
  await requireAdmin();
  const lang = await getSetting<Lang>("cvLang", "ko");
  const rows = await prisma.entry.findMany({ where: { inCv: true, deletedAt: null }, include: { texts: true }, orderBy: [{ order: "asc" }, { dateStart: "desc" }] });
  const bySec = new Map<string, typeof rows>();
  for (const r of rows) { const s = KIND_MAP[r.kind]?.cvSection; if (!s) continue; (bySec.get(s) ?? bySec.set(s, []).get(s)!).push(r); }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">CV 편집기</h1>
        <form action={setCvLang} className="flex items-center gap-2 text-sm">
          <span className="muted">문서 언어</span>
          <select className="select !w-auto !py-1" name="lang" defaultValue={lang}>{LANGS.map((l) => <option key={l} value={l}>{LANG_LABEL[l]}</option>)}</select>
          <button className="btn !py-1">적용</button>
        </form>
        <div className="ml-auto flex gap-2">
          {LANGS.map((l) => <a key={l} className={`btn !py-1 text-xs ${l === lang ? "border-gold" : ""}`} href={`/api/cv/pdf?lang=${l}&all=1`}>PDF {l}</a>)}
        </div>
      </div>
      <p className="text-sm muted">항목의 ‘CV에 포함’을 켜면 여기에 나타납니다. 섹션 제목·날짜는 선택한 언어로 자동 변환되고, 본문은 각 항목의 언어별 텍스트를 씁니다. 비공개 항목도 관리자 PDF에는 포함되고, 공개 /cv 페이지에는 빠집니다.</p>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {CV_SECTIONS.map((s) => {
            const items = bySec.get(s.key) ?? [];
            const addKinds = KINDS.filter((k) => k.cvSection === s.key);
            return (
              <div key={s.key} className="py-2">
                <div className="flex items-center gap-2 mb-1"><span className="font-medium text-sm">{s.title[lang]}</span><span className="text-xs muted">{items.length}</span>
                  <div className="ml-auto flex gap-1">{addKinds.map((k) => <Link key={k.kind} href={`/admin/entries/new?kind=${k.kind}`} className="text-xs underline">+{k.label}</Link>)}</div></div>
                <ul className="text-xs space-y-0.5">{items.map((e) => {
                  const tx = e.texts.find((t) => t.lang === lang) ?? e.texts.find((t) => t.lang === e.sourceLang);
                  let t = ""; try { const f = JSON.parse(tx?.fields ?? "{}"); t = f.title || f.org || f.category || ""; } catch {}
                  const missing = !e.texts.some((t) => t.lang === lang);
                  return <li key={e.id}><Link className="underline" href={`/admin/entries/${e.id}`}>{t}</Link>{missing && <span className="badge ml-1">번역 없음</span>}{!e.isPublic && <span className="muted ml-1">(비공개)</span>}</li>;
                })}</ul>
              </div>
            );
          })}
        </div>
        <iframe title="CV preview" src={`/api/cv/pdf?lang=${lang}&all=1&preview=1`} className="w-full bg-white" style={{ minHeight: 900 }} />
      </div>
    </div>
  );
}
