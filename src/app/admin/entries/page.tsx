import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { KINDS, KIND_MAP } from "@/lib/kinds";
import { LANGS } from "@/lib/i18n";
import { togglePublic } from "../actions";

export default async function Entries({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  await requireAdmin();
  const { group = "project" } = await searchParams;
  const kinds = KINDS.filter((k) => k.group === group).map((k) => k.kind);
  const rows = await prisma.entry.findMany({ where: { kind: { in: kinds }, deletedAt: null }, include: { texts: true }, orderBy: [{ kind: "asc" }, { order: "asc" }, { dateStart: "desc" }] });
  const title = { project: "프로젝트", research: "논문·수상", experience: "경력·교육", skill: "기술", cv: "CV 전용" }[group] ?? group;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="ml-auto flex flex-wrap gap-2">
          {KINDS.filter((k) => k.group === group).map((k) => <Link key={k.kind} href={`/admin/entries/new?kind=${k.kind}`} className="btn btn-primary !py-1">+ {k.label}</Link>)}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="admin"><thead><tr><th>종류</th><th>제목</th><th>기간</th><th>번역</th><th>공개</th><th>CV</th><th></th></tr></thead><tbody>
          {rows.length === 0 && <tr><td colSpan={7} className="muted">항목이 없습니다. 오른쪽 위 버튼으로 추가하세요.</td></tr>}
          {rows.map((e) => {
            const src = e.texts.find((t) => t.lang === e.sourceLang);
            let t = ""; try { const f = JSON.parse(src?.fields ?? "{}"); t = f.title || f.org || f.category || ""; } catch {}
            return (
              <tr key={e.id}>
                <td className="whitespace-nowrap">{KIND_MAP[e.kind]?.label}</td>
                <td><Link className="underline" href={`/admin/entries/${e.id}`}>{t || "(제목 없음)"}</Link>{e.featured && <span className="badge ml-2">대표</span>}</td>
                <td className="text-xs muted whitespace-nowrap">{e.dateStart ? e.dateStart.toISOString().slice(0, 7) : ""}{e.isCurrent ? " ~ 현재" : e.dateEnd ? ` ~ ${e.dateEnd.toISOString().slice(0, 7)}` : ""}</td>
                <td className="text-xs">{LANGS.map((l) => { const x = e.texts.find((t) => t.lang === l); return <span key={l} title={x?.origin} className={`mr-1 ${x ? (x.origin === "user-edited" ? "text-gold" : "") : "opacity-30"}`}>{l}</span>; })}</td>
                <td><form action={togglePublic}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="group" value={group} /><button className="btn !py-0.5 !px-2 text-xs">{e.isPublic ? "공개" : "비공개"}</button></form></td>
                <td className="text-xs">{e.inCv ? "✓" : ""}</td>
                <td><Link className="btn !py-0.5 !px-2 text-xs" href={`/admin/entries/${e.id}`}>편집</Link></td>
              </tr>
            );
          })}
        </tbody></table>
      </div>
    </div>
  );
}
