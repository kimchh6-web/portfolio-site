import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { KIND_MAP } from "@/lib/kinds";
import { deleteEntry, restoreEntry } from "../actions";

export default async function Trash() {
  await requireAdmin();
  // 30일 지난 항목 자동 삭제
  await prisma.entry.deleteMany({ where: { deletedAt: { lt: new Date(Date.now() - 30 * 86400000) } } });
  const rows = await prisma.entry.findMany({ where: { deletedAt: { not: null } }, include: { texts: true }, orderBy: { deletedAt: "desc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">휴지통 <span className="text-sm muted font-normal">30일 후 자동 삭제</span></h1>
      <div><table className="admin"><thead><tr><th>종류</th><th>제목</th><th>삭제일</th><th></th></tr></thead><tbody>
        {rows.length === 0 && <tr><td colSpan={4} className="muted">비어 있습니다.</td></tr>}
        {rows.map((e) => {
          let t = ""; try { const f = JSON.parse(e.texts.find((x) => x.lang === e.sourceLang)?.fields ?? "{}"); t = f.title || f.org || f.category || ""; } catch {}
          return <tr key={e.id}><td>{KIND_MAP[e.kind]?.label}</td><td>{t}</td><td className="text-xs muted">{e.deletedAt?.toLocaleDateString("ko-KR")}</td>
            <td className="flex gap-1">
              <form action={restoreEntry}><input type="hidden" name="id" value={e.id} /><button className="btn !py-0.5 !px-2 text-xs">복원</button></form>
              <form action={deleteEntry}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="hard" value="1" /><button className="btn btn-danger !py-0.5 !px-2 text-xs">완전 삭제</button></form>
            </td></tr>;
        })}
      </tbody></table></div>
    </div>
  );
}
