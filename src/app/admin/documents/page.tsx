import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteDocument, updateDocument, uploadDocument } from "../actions";

const KINDS = [["resume", "이력서"], ["cover_letter", "자기소개서"], ["certificate", "증명서"], ["other", "기타"]];

export default async function Documents({ searchParams }: { searchParams: Promise<{ e?: string; saved?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const docs = await prisma.document.findMany({ where: { deletedAt: null }, include: { files: { orderBy: { version: "desc" } } }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">문서 보관함 {sp.saved && <span className="badge">저장됨</span>}</h1>
      {sp.e && <p className="text-sm" style={{ color: "#b3261e" }}>{decodeURIComponent(sp.e)}</p>}
      <form action={uploadDocument} className="grid gap-3 sm:grid-cols-4 pb-6 rule pt-4" encType="multipart/form-data">
        <label className="block sm:col-span-2"><span className="label">제목</span><input className="input" name="title" placeholder="비우면 파일명" /></label>
        <label className="block"><span className="label">종류</span><select className="select" name="kind">{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="block"><span className="label">태그 (쉼표)</span><input className="input" name="tags" /></label>
        <label className="block sm:col-span-3"><span className="label">파일 (20MB 이하: pdf, docx, pptx, hwp, png, jpg, zip …)</span><input className="input" type="file" name="file" required /></label>
        <div className="flex items-end gap-3"><label className="flex items-center gap-1 text-sm"><input type="checkbox" name="isPublic" /> 공개</label><button className="btn btn-primary">업로드</button></div>
      </form>

      <div className="space-y-3">
        {docs.length === 0 && <p className="muted">문서가 없습니다.</p>}
        {docs.map((d) => (
          <div key={d.id} className="rule pt-4">
            <form action={updateDocument} className="grid gap-2 sm:grid-cols-5 items-end">
              <input type="hidden" name="id" value={d.id} />
              <label className="block sm:col-span-2"><span className="label">제목</span><input className="input" name="title" defaultValue={d.title} /></label>
              <label className="block"><span className="label">종류</span><select className="select" name="kind" defaultValue={d.kind}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label className="block"><span className="label">태그</span><input className="input" name="tags" defaultValue={d.tags} /></label>
              <div className="flex items-center gap-2"><label className="flex items-center gap-1 text-sm"><input type="checkbox" name="isPublic" defaultChecked={d.isPublic} /> 공개</label><button className="btn !py-1">저장</button></div>
            </form>
            <div className="mt-3 text-sm">
              <div className="label">버전</div>
              <ul className="space-y-1">{d.files.map((f) => (
                <li key={f.id} className="flex flex-wrap gap-3 items-center">
                  <span className="badge">v{f.version}</span>
                  <a className="underline" href={`/api/documents/${f.id}`}>{f.filename}</a>
                  <span className="text-xs muted">{(f.size / 1024).toFixed(0)} KB · {f.uploadedAt.toLocaleString("ko-KR")}</span>
                </li>))}</ul>
              <div className="flex flex-wrap gap-3 mt-3 items-center">
                <form action={uploadDocument} className="flex gap-2 items-center" encType="multipart/form-data">
                  <input type="hidden" name="documentId" value={d.id} /><input className="input !w-auto" type="file" name="file" required /><button className="btn !py-1">새 버전 업로드</button>
                </form>
                <form action={deleteDocument} className="ml-auto"><input type="hidden" name="id" value={d.id} /><button className="btn btn-danger !py-1">삭제</button></form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
