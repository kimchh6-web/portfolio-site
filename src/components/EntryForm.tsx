"use client";
import { useState } from "react";
import { LANGS, LANG_LABEL, type Lang } from "@/lib/i18n";
import type { KindDef } from "@/lib/kinds";

type Props = {
  def: KindDef;
  entry: {
    id: number; order: number; isPublic: boolean; inCv: boolean; featured: boolean; isCurrent: boolean;
    dateStart: string; dateEnd: string; link: string; sourceLang: Lang; tech: string; links: string; coverImage: string;
  } | null;
  texts: Record<string, { fields: Record<string, string>; origin: string }>;
  translationEnabled: boolean;
  action: (fd: FormData) => void;
};

export default function EntryForm({ def, entry, texts, translationEnabled, action }: Props) {
  const [srcLang, setSrcLang] = useState<Lang>(entry?.sourceLang ?? "ko");
  const [tab, setTab] = useState<Lang>(entry?.sourceLang ?? "ko");
  const isNew = !entry;
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={entry?.id ?? 0} />
      <input type="hidden" name="kind" value={def.kind} />

      <div className="grid gap-3 sm:grid-cols-4">
        <label className="block"><span className="label">원문 언어</span>
          <select className="select" name="sourceLang" value={srcLang} onChange={(e) => { setSrcLang(e.target.value as Lang); setTab(e.target.value as Lang); }}>
            {LANGS.map((l) => <option key={l} value={l}>{LANG_LABEL[l]}</option>)}
          </select></label>
        <label className="block"><span className="label">정렬 순서 (작을수록 위)</span><input className="input" type="number" name="order" defaultValue={entry?.order ?? 0} /></label>
        {def.hasDate && <>
          <label className="block"><span className="label">시작 (년-월)</span><input className="input" type="month" name="dateStart" defaultValue={entry?.dateStart ?? ""} /></label>
          <label className="block"><span className="label">종료 (년-월)</span><input className="input" type="month" name="dateEnd" defaultValue={entry?.dateEnd ?? ""} /></label>
        </>}
        <div className="sm:col-span-4 flex flex-wrap gap-5 text-sm">
          {def.hasDate && <label className="flex items-center gap-1"><input type="checkbox" name="isCurrent" defaultChecked={entry?.isCurrent} /> 현재 진행 중</label>}
          <label className="flex items-center gap-1"><input type="checkbox" name="isPublic" defaultChecked={entry?.isPublic ?? true} /> 공개</label>
          <label className="flex items-center gap-1"><input type="checkbox" name="inCv" defaultChecked={entry?.inCv ?? (def.group !== "project")} /> CV에 포함</label>
          {def.kind === "project" && <label className="flex items-center gap-1"><input type="checkbox" name="featured" defaultChecked={entry?.featured} /> 대표 프로젝트</label>}
          <label className="flex items-center gap-1"><input type="checkbox" name="autoTranslate" defaultChecked={translationEnabled} disabled={!translationEnabled} /> 저장 시 자동 번역{!translationEnabled && <span className="muted">(API 키 없음)</span>}</label>
        </div>
        <label className="block sm:col-span-4"><span className="label">링크 (URL)</span><input className="input" name="link" defaultValue={entry?.link ?? ""} placeholder="https://" /></label>
        {def.kind === "project" && <>
          <label className="block sm:col-span-2"><span className="label">기술 (쉼표 구분)</span><input className="input" name="tech" defaultValue={entry?.tech ?? ""} placeholder="Python, FastAPI, React" /></label>
          <label className="block sm:col-span-2"><span className="label">커버 이미지 URL</span><input className="input" name="coverImage" defaultValue={entry?.coverImage ?? ""} /></label>
          <label className="block sm:col-span-4"><span className="label">관련 링크 (한 줄에 하나, ‘이름 | URL’)</span><textarea className="textarea" rows={2} name="links" defaultValue={entry?.links ?? ""} placeholder={"GitHub | https://github.com/...\n데모 | https://..."} /></label>
        </>}
      </div>

      <div className="rule pt-4">
        <div className="flex flex-wrap gap-1 border-b border-line mb-4">
          {LANGS.map((l) => {
            const st = texts[l];
            const badge = l === srcLang ? "원문" : st ? (st.origin === "user-edited" ? "직접 수정" : st.origin === "machine" ? "자동" : "") : "없음";
            return <button type="button" key={l} onClick={() => setTab(l)} className={`px-3 py-2 text-sm ${tab === l ? "nav-active font-semibold" : "muted"}`}>{LANG_LABEL[l]} <span className="text-xs opacity-70">{badge}</span></button>;
          })}
        </div>
        {LANGS.map((l) => (
          <div key={l} className={tab === l ? "grid gap-3" : "hidden"}>
            {l !== srcLang && <p className="text-xs muted">비워 두면 자동 번역 결과를 씁니다. 직접 입력하면 ‘직접 수정’으로 표시되고 재번역해도 덮어쓰지 않습니다.</p>}
            {def.fields.map((f) => {
              const v = texts[l]?.fields?.[f.key] ?? "";
              const name = `f__${l}__${f.key}`;
              return (
                <label key={f.key} className="block"><span className="label">{f.label}{f.noTranslate && l !== srcLang ? " (원문 유지)" : ""}</span>
                  {f.multiline ? <textarea className="textarea" rows={6} name={name} defaultValue={v} /> : <input className="input" name={name} defaultValue={v} required={l === srcLang && f.key === def.fields[0].key} />}
                </label>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="btn btn-primary">{isNew ? "추가" : "저장"}</button>
      </div>
    </form>
  );
}
