"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import path from "node:path";
import crypto from "node:crypto";
import { deleteFile, putFile } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { getSession, requireAdmin } from "@/lib/auth";
import { LANGS, isLang, type Lang } from "@/lib/i18n";
import { KIND_MAP } from "@/lib/kinds";
import { fromInputMonth } from "@/lib/dates";
import { translateEntry } from "@/lib/translate";
import { setSetting } from "@/lib/content";

const MAX_FAIL = 5, LOCK_MIN = 15;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}
function fail(msg: string): never { redirect(`/admin/login?e=${encodeURIComponent(msg)}`); }

// ---------- 로그인 ----------
export async function loginPassword(fd: FormData) {
  const username = String(fd.get("username") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const ip = await clientIp();
  const u = await prisma.adminUser.findUnique({ where: { username } });
  if (!u) { await prisma.loginLog.create({ data: { ip, success: false, note: "no user" } }); fail("로그인 실패"); }
  if (u.lockedUntil && u.lockedUntil > new Date()) fail(`잠금 중입니다. ${LOCK_MIN}분 뒤 다시 시도하세요.`);
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) {
    const failed = u.failedCount + 1;
    await prisma.adminUser.update({ where: { id: u.id }, data: { failedCount: failed, lockedUntil: failed >= MAX_FAIL ? new Date(Date.now() + LOCK_MIN * 60000) : null } });
    await prisma.loginLog.create({ data: { ip, success: false, note: "bad password" } });
    fail("로그인 실패");
  }
  const s = await getSession();
  if (!u.totpSecret) {
    await prisma.adminUser.update({ where: { id: u.id }, data: { failedCount: 0, lockedUntil: null } });
    await prisma.loginLog.create({ data: { ip, success: true, note: "password only (no totp)" } });
    s.userId = u.id; s.pwOk = false; s.loginAt = Date.now();
    await s.save();
    redirect("/admin");
  }
  s.pwOk = true; s.userId = undefined; s.loginAt = Date.now();
  await s.save();
  redirect("/admin/login");
}

export async function loginTotp(fd: FormData) {
  const code = String(fd.get("code") ?? "").trim();
  const s = await getSession();
  const ip = await clientIp();
  if (!s.pwOk || !s.loginAt || Date.now() - s.loginAt > 5 * 60000) { s.destroy(); fail("다시 로그인하세요."); }
  const u = await prisma.adminUser.findFirst();
  if (!u?.totpSecret) fail("설정 오류");
  if (u.lockedUntil && u.lockedUntil > new Date()) fail("잠금 중입니다.");
  const ok = authenticator.verify({ token: code, secret: u.totpSecret });
  if (!ok) {
    const failed = u.failedCount + 1;
    await prisma.adminUser.update({ where: { id: u.id }, data: { failedCount: failed, lockedUntil: failed >= MAX_FAIL ? new Date(Date.now() + LOCK_MIN * 60000) : null } });
    await prisma.loginLog.create({ data: { ip, success: false, note: "bad totp" } });
    fail("OTP가 맞지 않습니다.");
  }
  await prisma.adminUser.update({ where: { id: u.id }, data: { failedCount: 0, lockedUntil: null } });
  await prisma.loginLog.create({ data: { ip, success: true } });
  s.userId = u.id; s.pwOk = false;
  await s.save();
  redirect("/admin");
}

export async function logout() {
  const s = await getSession();
  s.destroy();
  redirect("/admin/login");
}

// ---------- 항목 CRUD ----------
function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s가-힣-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || crypto.randomBytes(4).toString("hex");
}

export async function saveEntry(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id") || 0);
  const kind = String(fd.get("kind") ?? "");
  const def = KIND_MAP[kind];
  if (!def) throw new Error("unknown kind");
  const sourceLang = (isLang(String(fd.get("sourceLang"))) ? String(fd.get("sourceLang")) : "ko") as Lang;

  // 언어별 필드 수집: 이름 규칙 f__<lang>__<key>
  const perLang: Record<string, Record<string, string>> = {};
  for (const [k, v] of fd.entries()) {
    const m = /^f__(.+?)__(.+)$/.exec(k);
    if (!m) continue;
    (perLang[m[1]] ??= {})[m[2]] = String(v);
  }
  const src = perLang[sourceLang] ?? {};
  const extra: Record<string, unknown> = {};
  const tech = String(fd.get("tech") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (tech.length) extra.tech = tech;
  const linksRaw = String(fd.get("links") ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (linksRaw.length) extra.links = linksRaw.map((l) => { const [label, url] = l.includes("|") ? l.split("|").map((x) => x.trim()) : [l, l]; return { label, url }; });
  const cover = String(fd.get("coverImage") ?? "").trim();
  if (cover) extra.coverImage = cover;

  const data = {
    kind,
    order: Number(fd.get("order") || 0),
    isPublic: fd.get("isPublic") === "on",
    inCv: fd.get("inCv") === "on",
    featured: fd.get("featured") === "on",
    dateStart: def.hasDate ? fromInputMonth(String(fd.get("dateStart") ?? "")) : null,
    dateEnd: def.hasDate ? fromInputMonth(String(fd.get("dateEnd") ?? "")) : null,
    isCurrent: fd.get("isCurrent") === "on",
    link: String(fd.get("link") ?? "").trim() || null,
    extra: JSON.stringify(extra),
    sourceLang,
  };
  let entryId = id;
  if (id) {
    await prisma.entry.update({ where: { id }, data });
  } else {
    const slug = kind === "project" ? await uniqueSlug(slugify(src.title || "project")) : null;
    const created = await prisma.entry.create({ data: { ...data, slug } });
    entryId = created.id;
  }

  // 텍스트 저장: 원문은 user, 다른 언어는 값이 있고 기존과 다르면 user-edited
  const existing = await prisma.entryText.findMany({ where: { entryId } });
  for (const lang of LANGS) {
    const fields = perLang[lang];
    if (!fields) continue;
    const nonEmpty = Object.values(fields).some((v) => v.trim());
    const prev = existing.find((x) => x.lang === lang);
    if (lang === sourceLang) {
      await prisma.entryText.upsert({ where: { entryId_lang: { entryId, lang } }, create: { entryId, lang, fields: JSON.stringify(fields), origin: "user" }, update: { fields: JSON.stringify(fields), origin: "user" } });
    } else if (nonEmpty) {
      const changed = !prev || prev.fields !== JSON.stringify(fields);
      const origin = changed ? "user-edited" : prev!.origin;
      await prisma.entryText.upsert({ where: { entryId_lang: { entryId, lang } }, create: { entryId, lang, fields: JSON.stringify(fields), origin: "user-edited" }, update: { fields: JSON.stringify(fields), origin } });
    } else if (prev && prev.origin === "user-edited") {
      await prisma.entryText.delete({ where: { id: prev.id } });
    }
  }

  // 자동 번역 (키 없으면 조용히 건너뜀)
  if (fd.get("autoTranslate") === "on") {
    try { await translateEntry(entryId); } catch (e) { console.error("translate failed", e); }
  }
  revalidatePath("/", "layout");
  redirect(`/admin/entries/${entryId}?saved=1`);
}

async function uniqueSlug(base: string) {
  let s = base, n = 2;
  while (await prisma.entry.findUnique({ where: { slug: s } })) s = `${base}-${n++}`;
  return s;
}

export async function retranslateEntry(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const r = await translateEntry(id, true);
  revalidatePath("/", "layout");
  redirect(`/admin/entries/${id}?tr=${r.ok ? (r.translated?.length ?? 0) : "fail"}`);
}

export async function deleteEntry(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const hard = fd.get("hard") === "1";
  if (hard) await prisma.entry.delete({ where: { id } });
  else await prisma.entry.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/", "layout");
  redirect(`/admin/entries?group=${String(fd.get("group") ?? "project")}`);
}
export async function restoreEntry(fd: FormData) {
  await requireAdmin();
  await prisma.entry.update({ where: { id: Number(fd.get("id")) }, data: { deletedAt: null } });
  revalidatePath("/", "layout");
  redirect("/admin/trash");
}
export async function togglePublic(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const e = await prisma.entry.findUnique({ where: { id } });
  if (e) await prisma.entry.update({ where: { id }, data: { isPublic: !e.isPublic } });
  revalidatePath("/", "layout");
  redirect(`/admin/entries?group=${String(fd.get("group") ?? "project")}`);
}

// ---------- 설정 ----------
export async function saveProfile(fd: FormData) {
  await requireAdmin();
  const m = (key: string) => Object.fromEntries(LANGS.map((l) => [l, String(fd.get(`${key}__${l}`) ?? "").trim()]).filter(([, v]) => v));
  const links = String(fd.get("links") ?? "").split("\n").map((l) => l.trim()).filter(Boolean)
    .map((l) => { const [label, url] = l.includes("|") ? l.split("|").map((x) => x.trim()) : [l, l]; return { label, url }; });
  await setSetting("profile", {
    name: m("name"), tagline: m("tagline"), title: m("title"), affiliation: m("affiliation"),
    email: String(fd.get("email") ?? "").trim(), github: String(fd.get("github") ?? "").trim(),
    profileUrl: String(fd.get("profileUrl") ?? "").trim(), photo: String(fd.get("photo") ?? "").trim(), siteTitle: String(fd.get("siteTitle") ?? "").trim(), links,
  });
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

export async function changePassword(fd: FormData) {
  const s = await requireAdmin();
  const cur = String(fd.get("current") ?? ""), next = String(fd.get("next") ?? "");
  const u = await prisma.adminUser.findUnique({ where: { id: s.userId! } });
  if (!u || !(await bcrypt.compare(cur, u.passwordHash))) redirect("/admin/settings?e=" + encodeURIComponent("현재 비밀번호가 틀립니다"));
  if (next.length < 10) redirect("/admin/settings?e=" + encodeURIComponent("새 비밀번호는 10자 이상"));
  await prisma.adminUser.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  redirect("/admin/settings?saved=1");
}

export async function resetTotp(fd: FormData) {
  const s = await requireAdmin();
  const enable = fd.get("enable") === "1";
  await prisma.adminUser.update({ where: { id: s.userId! }, data: { totpSecret: enable ? authenticator.generateSecret() : null } });
  redirect("/admin/settings?totp=1");
}

// ---------- 고유명사 사전 ----------
export async function saveGlossary(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id") || 0);
  const data = { kind: String(fd.get("kind") ?? "org"), ko: String(fd.get("ko") ?? "").trim(),
    en: String(fd.get("en") ?? "").trim() || null, ja: String(fd.get("ja") ?? "").trim() || null,
    zhCN: String(fd.get("zhCN") ?? "").trim() || null, zhTW: String(fd.get("zhTW") ?? "").trim() || null };
  if (!data.ko) redirect("/admin/glossary");
  if (id) await prisma.glossary.update({ where: { id }, data }); else await prisma.glossary.create({ data });
  redirect("/admin/glossary");
}
export async function deleteGlossary(fd: FormData) {
  await requireAdmin();
  await prisma.glossary.delete({ where: { id: Number(fd.get("id")) } });
  redirect("/admin/glossary");
}

// ---------- 문서 보관함 ----------
const ALLOWED = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "image/png", "image/jpeg", "text/plain", "application/zip", "application/x-hwp", "application/haansofthwp", "application/octet-stream"]);
const MAX_SIZE = 20 * 1024 * 1024;

export async function uploadDocument(fd: FormData) {
  await requireAdmin();
  const file = fd.get("file") as File | null;
  const title = String(fd.get("title") ?? "").trim();
  const docId = Number(fd.get("documentId") || 0);
  if (!file || !file.size) redirect("/admin/documents?e=" + encodeURIComponent("파일이 없습니다"));
  if (file.size > MAX_SIZE) redirect("/admin/documents?e=" + encodeURIComponent("20MB 이하만"));
  const ext = path.extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, "");
  const okExt = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg", ".txt", ".zip", ".hwp", ".hwpx", ".md"].includes(ext);
  if (!okExt || (file.type && !ALLOWED.has(file.type))) redirect("/admin/documents?e=" + encodeURIComponent("허용되지 않는 파일 형식"));

  const stored = `${Date.now()}_${crypto.randomBytes(8).toString("hex")}${ext}`;
  await putFile(stored, Buffer.from(await file.arrayBuffer()), file.type || "application/octet-stream");

  let doc = docId ? await prisma.document.findUnique({ where: { id: docId }, include: { files: true } }) : null;
  if (!doc) {
    doc = await prisma.document.create({
      data: { title: title || file.name, kind: String(fd.get("kind") ?? "other"), tags: String(fd.get("tags") ?? "").trim(), isPublic: fd.get("isPublic") === "on" },
      include: { files: true },
    });
  }
  const version = (doc.files.reduce((m, f) => Math.max(m, f.version), 0) || 0) + 1;
  await prisma.documentFile.create({ data: { documentId: doc.id, version, filename: file.name, mime: file.type || "application/octet-stream", size: file.size, storagePath: stored } });
  redirect("/admin/documents?saved=1");
}

export async function updateDocument(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  await prisma.document.update({ where: { id }, data: { title: String(fd.get("title") ?? "").trim(), kind: String(fd.get("kind") ?? "other"), tags: String(fd.get("tags") ?? "").trim(), isPublic: fd.get("isPublic") === "on" } });
  redirect("/admin/documents?saved=1");
}
export async function deleteDocument(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const doc = await prisma.document.findUnique({ where: { id }, include: { files: true } });
  if (doc) {
    for (const f of doc.files) await deleteFile(f.storagePath);
    await prisma.document.delete({ where: { id } });
  }
  redirect("/admin/documents");
}
