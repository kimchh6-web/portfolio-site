import { prisma } from "./db";
import { DEFAULT_LANG, type Lang } from "./i18n";
import type { Entry, EntryText } from "@prisma/client";

export type EntryView = Entry & {
  f: Record<string, string>;   // 선택 언어의 필드 (없으면 원문 대체)
  hasTranslation: boolean;
  extraObj: Record<string, unknown>;
};

export function pickText(entry: Entry & { texts: EntryText[] }, lang: Lang): EntryView {
  const want = entry.texts.find((t) => t.lang === lang);
  const src = entry.texts.find((t) => t.lang === entry.sourceLang) ?? entry.texts.find((t) => t.lang === DEFAULT_LANG);
  const chosen = want ?? src;
  let f: Record<string, string> = {};
  try { f = chosen ? JSON.parse(chosen.fields) : {}; } catch { f = {}; }
  let extraObj: Record<string, unknown> = {};
  try { extraObj = JSON.parse(entry.extra || "{}"); } catch { extraObj = {}; }
  return { ...entry, f, hasTranslation: !!want, extraObj };
}

export async function listPublic(kinds: string[], lang: Lang, opts: { featured?: boolean; inCv?: boolean } = {}) {
  const rows = await prisma.entry.findMany({
    where: { kind: { in: kinds }, isPublic: true, deletedAt: null, ...(opts.featured ? { featured: true } : {}), ...(opts.inCv ? { inCv: true } : {}) },
    include: { texts: true },
    orderBy: [{ order: "asc" }, { dateStart: "desc" }, { id: "desc" }],
  });
  return rows.map((r) => pickText(r, lang));
}

export async function getPublicBySlug(slug: string, lang: Lang) {
  const row = await prisma.entry.findFirst({ where: { slug, isPublic: true, deletedAt: null }, include: { texts: true } });
  return row ? pickText(row, lang) : null;
}

export async function getSetting<T = unknown>(key: string, fallback: T): Promise<T> {
  const s = await prisma.setting.findUnique({ where: { key } });
  if (!s) return fallback;
  try { return JSON.parse(s.value) as T; } catch { return fallback; }
}
export async function setSetting(key: string, value: unknown) {
  await prisma.setting.upsert({ where: { key }, create: { key, value: JSON.stringify(value) }, update: { value: JSON.stringify(value) } });
}

export type SiteProfile = {
  name: Record<string, string>;     // 언어별 이름
  tagline: Record<string, string>;  // 한 줄 소개
  title: Record<string, string>;    // 직위
  affiliation: Record<string, string>;
  email: string;
  github: string;
  profileUrl: string;               // 연구자 프로필(ORCID 등)
  photo?: string;                   // 사진 URL (기본 /profile.jpg)
  siteTitle?: string;               // 상단 로고 자리·탭 제목 (기본 Portfolio)
  links: { label: string; url: string }[];
};
export const EMPTY_PROFILE: SiteProfile = {
  name: { ko: "" }, tagline: { ko: "" }, title: { ko: "" }, affiliation: { ko: "" },
  email: "", github: "", profileUrl: "", links: [],
};
export function pickLang(m: Record<string, string> | undefined, lang: Lang) {
  if (!m) return "";
  return m[lang] || m.ko || Object.values(m).find(Boolean) || "";
}
