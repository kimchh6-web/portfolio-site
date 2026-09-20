import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { KIND_MAP } from "@/lib/kinds";
import { translationEnabled } from "@/lib/translate";
import { LANGS } from "@/lib/i18n";

export default async function Dashboard() {
  await requireAdmin();
  const recent = await prisma.entry.findMany({ where: { deletedAt: null }, include: { texts: true }, orderBy: { updatedAt: "desc" }, take: 8 });
  const total = await prisma.entry.count({ where: { deletedAt: null } });
  const docs = await prisma.document.count({ where: { deletedAt: null } });
  const size = await prisma.documentFile.aggregate({ _sum: { size: true } });
  const logins = await prisma.loginLog.findMany({ orderBy: { at: "desc" }, take: 5 });
  const missing = recent.filter((e) => e.texts.length < LANGS.length).length;
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">대시보드</h1>
      <p className="text-sm muted">항목 <b className="text-fg">{total}</b> · 문서 <b className="text-fg">{docs}</b> · 저장 용량 <b className="text-fg">{((size._sum.size ?? 0) / 1048576).toFixed(1)} MB</b> · 자동 번역 <b className="text-fg">{translationEnabled() ? "켜짐" : "꺼짐"}</b>{!translationEnabled() && <span> (.env에 ANTHROPIC_API_KEY 필요)</span>}</p>
      <div className="rule pt-4">
        <div className="flex items-center mb-2"><h2 className="font-semibold">최근 수정</h2>{missing > 0 && <span className="ml-3 badge">번역 없음 {missing}건</span>}</div>
        <table className="admin"><thead><tr><th>종류</th><th>제목</th><th>언어</th><th>수정</th></tr></thead><tbody>
          {recent.map((e) => {
            const src = e.texts.find((t) => t.lang === e.sourceLang);
            let title = ""; try { const f = JSON.parse(src?.fields ?? "{}"); title = f.title || f.org || f.category || ""; } catch {}
            return <tr key={e.id}><td>{KIND_MAP[e.kind]?.label ?? e.kind}</td><td><Link className="underline" href={`/admin/entries/${e.id}`}>{title || "(제목 없음)"}</Link></td>
              <td className="text-xs">{LANGS.map((l) => <span key={l} className={`mr-1 ${e.texts.some((t) => t.lang === l) ? "" : "opacity-30"}`}>{l}</span>)}</td>
              <td className="text-xs muted">{e.updatedAt.toLocaleString("ko-KR")}</td></tr>;
          })}
        </tbody></table>
      </div>
      <div className="rule pt-4"><h2 className="font-semibold mb-2">최근 로그인 시도</h2>
        <ul className="text-xs muted space-y-1">{logins.map((l) => <li key={l.id}>{l.at.toLocaleString("ko-KR")} · {l.ip} · {l.success ? "성공" : `실패 (${l.note ?? ""})`}</li>)}</ul></div>
    </div>
  );
}
