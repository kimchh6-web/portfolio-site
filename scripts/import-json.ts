// SQLite 시절 내보낸 prisma/export.json 을 현재 DATABASE_URL(PostgreSQL)로 가져온다.
// 실행: npx tsx scripts/import-json.ts   (비어 있는 DB에만 실행할 것)
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
const prisma = new PrismaClient();
const D = (v: unknown) => (v ? new Date(String(v).replace(" ", "T").replace(/(\d)$/, "$1Z").replace("ZZ", "Z")) : null);
const B = (v: unknown) => v === 1 || v === true;

(async () => {
  const j = JSON.parse(fs.readFileSync("prisma/export.json", "utf-8"));
  if (await prisma.entry.count()) { console.log("DB에 이미 항목이 있어 중단합니다."); process.exit(1); }
  for (const u of j.AdminUser) await prisma.adminUser.create({ data: { id: u.id, username: u.username, passwordHash: u.passwordHash, totpSecret: u.totpSecret, failedCount: 0 } });
  for (const e of j.Entry) await prisma.entry.create({ data: {
    id: e.id, kind: e.kind, slug: e.slug, order: e.order, isPublic: B(e.isPublic), inCv: B(e.inCv), featured: B(e.featured),
    dateStart: D(e.dateStart), dateEnd: D(e.dateEnd), isCurrent: B(e.isCurrent), link: e.link, extra: e.extra, sourceLang: e.sourceLang, deletedAt: D(e.deletedAt),
  } });
  for (const t of j.EntryText) await prisma.entryText.create({ data: { entryId: t.entryId, lang: t.lang, fields: t.fields, origin: t.origin } });
  for (const g of j.Glossary) await prisma.glossary.create({ data: { kind: g.kind, ko: g.ko, en: g.en, ja: g.ja, zhCN: g.zhCN, zhTW: g.zhTW } });
  for (const d of j.Document) await prisma.document.create({ data: { id: d.id, title: d.title, kind: d.kind, tags: d.tags, isPublic: B(d.isPublic), deletedAt: D(d.deletedAt) } });
  for (const f of j.DocumentFile) await prisma.documentFile.create({ data: { documentId: f.documentId, version: f.version, filename: f.filename, mime: f.mime, size: f.size, storagePath: f.storagePath } });
  for (const s of j.Setting) await prisma.setting.upsert({ where: { key: s.key }, create: { key: s.key, value: s.value }, update: { value: s.value } });
  // autoincrement 시퀀스 맞추기
  for (const t of ["AdminUser", "Entry", "Document"]) await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${t}"','id'), COALESCE((SELECT MAX(id) FROM "${t}"),0)+1, false)`);
  console.log(`가져오기 완료: 항목 ${j.Entry.length}, 텍스트 ${j.EntryText.length}, 관리자 ${j.AdminUser.length}`);
  await prisma.$disconnect();
})();
