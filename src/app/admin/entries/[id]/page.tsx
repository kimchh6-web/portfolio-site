import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { KIND_MAP } from "@/lib/kinds";
import { toInputMonth } from "@/lib/dates";
import { translationEnabled } from "@/lib/translate";
import type { Lang } from "@/lib/i18n";
import EntryForm from "@/components/EntryForm";
import { deleteEntry, retranslateEntry, saveEntry } from "../../actions";

export default async function EditEntry({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ kind?: string; saved?: string; tr?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const entry = isNew ? null : await prisma.entry.findUnique({ where: { id: Number(id) }, include: { texts: true } });
  if (!isNew && !entry) notFound();
  const def = KIND_MAP[isNew ? (sp.kind ?? "project") : entry!.kind];
  if (!def) notFound();

  const texts: Record<string, { fields: Record<string, string>; origin: string }> = {};
  for (const t of entry?.texts ?? []) { try { texts[t.lang] = { fields: JSON.parse(t.fields), origin: t.origin }; } catch {} }
  let extra: Record<string, unknown> = {}; try { extra = JSON.parse(entry?.extra ?? "{}"); } catch {}
  const links = ((extra.links as { label: string; url: string }[] | undefined) ?? []).map((l) => `${l.label} | ${l.url}`).join("\n");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href={`/admin/entries?group=${def.group}`} className="text-sm muted">← 목록</Link>
        <h1 className="text-xl font-semibold">{isNew ? `${def.label} 추가` : `${def.label} 편집`}</h1>
        {sp.saved && <span className="badge">저장됨</span>}
        {sp.tr && <span className="badge">{sp.tr === "fail" ? "번역 실패" : `${sp.tr}개 언어 번역됨`}</span>}
        {!isNew && (
          <div className="ml-auto flex gap-2">
            <form action={retranslateEntry}><input type="hidden" name="id" value={entry!.id} /><button className="btn !py-1" disabled={!translationEnabled()}>다시 번역</button></form>
            <form action={deleteEntry}><input type="hidden" name="id" value={entry!.id} /><input type="hidden" name="group" value={def.group} /><button className="btn btn-danger !py-1">휴지통으로</button></form>
          </div>
        )}
      </div>
      <EntryForm
        def={def}
        entry={entry ? {
          id: entry.id, order: entry.order, isPublic: entry.isPublic, inCv: entry.inCv, featured: entry.featured, isCurrent: entry.isCurrent,
          dateStart: toInputMonth(entry.dateStart), dateEnd: toInputMonth(entry.dateEnd), link: entry.link ?? "", sourceLang: entry.sourceLang as Lang,
          tech: ((extra.tech as string[] | undefined) ?? []).join(", "), links, coverImage: (extra.coverImage as string | undefined) ?? "",
        } : null}
        texts={texts}
        translationEnabled={translationEnabled()}
        action={saveEntry}
      />
    </div>
  );
}
