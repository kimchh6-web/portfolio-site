import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteGlossary, saveGlossary } from "../actions";

const KINDS = [["person", "인명"], ["org", "기관"], ["degree", "학위"], ["product", "제품·기타"]];

export default async function Glossary() {
  await requireAdmin();
  const rows = await prisma.glossary.findMany({ orderBy: { id: "asc" } });
  const all: (typeof rows[number] | null)[] = [...rows, null];
  const fid = (r: typeof rows[number] | null) => `g-${r?.id ?? "new"}`;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">고유명사 사전</h1>
      <p className="text-sm muted">인명·기관명·학위명의 언어별 공식 표기. 번역 시 우선 적용되고, 비어 있는 언어는 원문을 그대로 둡니다.</p>
      {all.map((r) => <form key={fid(r)} id={fid(r)} action={saveGlossary} />)}
      {rows.map((r) => <form key={`d-${r.id}`} id={`d-${r.id}`} action={deleteGlossary}><input type="hidden" name="id" value={r.id} /></form>)}
      <div className="overflow-x-auto"><table className="admin"><thead><tr><th>종류</th><th>한국어(원문)</th><th>English</th><th>日本語</th><th>简体</th><th>繁體</th><th></th></tr></thead>
        <tbody>
          {all.map((r) => (
            <tr key={fid(r)}>
              <td><input type="hidden" name="id" value={r?.id ?? 0} form={fid(r)} /><select className="select !py-1" name="kind" defaultValue={r?.kind ?? "org"} form={fid(r)}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>
              <td><input className="input !py-1" name="ko" defaultValue={r?.ko ?? ""} form={fid(r)} required /></td>
              <td><input className="input !py-1" name="en" defaultValue={r?.en ?? ""} form={fid(r)} /></td>
              <td><input className="input !py-1" name="ja" defaultValue={r?.ja ?? ""} form={fid(r)} /></td>
              <td><input className="input !py-1" name="zhCN" defaultValue={r?.zhCN ?? ""} form={fid(r)} /></td>
              <td><input className="input !py-1" name="zhTW" defaultValue={r?.zhTW ?? ""} form={fid(r)} /></td>
              <td className="whitespace-nowrap"><button className="btn !py-1 text-xs" form={fid(r)}>{r ? "저장" : "추가"}</button>{r && <button className="btn btn-danger !py-1 text-xs ml-1" form={`d-${r.id}`}>삭제</button>}</td>
            </tr>
          ))}
        </tbody></table></div>
    </div>
  );
}
