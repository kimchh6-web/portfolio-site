import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./db";
import { LANGS, LANG_LABEL, type Lang } from "./i18n";
import { KIND_MAP } from "./kinds";

export function translationEnabled() {
  return !!process.env.ANTHROPIC_API_KEY;
}

// 이메일·URL·DOI·숫자 토막은 번역하지 않도록 마스킹
const PROTECT = /(https?:\/\/\S+|[\w.+-]+@[\w-]+\.[\w.]+|\b10\.\d{4,}\/\S+|\b\d[\d,.:%~\-–]*\b)/g;
function mask(s: string) {
  const bag: string[] = [];
  const out = s.replace(PROTECT, (m) => { bag.push(m); return `⟦${bag.length - 1}⟧`; });
  return { out, bag };
}
function unmask(s: string, bag: string[]) {
  return s.replace(/⟦(\d+)⟧/g, (_, i) => bag[+i] ?? "");
}

async function glossaryLines(): Promise<string> {
  const g = await prisma.glossary.findMany();
  if (!g.length) return "";
  const lines = g.map((x) => `- ${x.ko} → en: ${x.en ?? "(원문 유지)"} / ja: ${x.ja ?? "(원문 유지)"} / zh-CN: ${x.zhCN ?? "(원문 유지)"} / zh-TW: ${x.zhTW ?? "(원문 유지)"}`);
  return `\n고유명사는 아래 공식 표기를 반드시 우선 사용하고, 없으면 원문 그대로 둔다:\n${lines.join("\n")}\n`;
}

/**
 * fields(원문)을 targets 언어들로 번역해 { lang: fields } 반환.
 * 실패한 언어는 결과에서 빠진다 (호출측이 기존 값을 유지).
 */
export async function translateFields(
  kind: string, fields: Record<string, string>, source: Lang, targets: Lang[],
): Promise<Partial<Record<Lang, Record<string, string>>>> {
  if (!translationEnabled() || !targets.length) return {};
  const def = KIND_MAP[kind];
  const translatable = Object.fromEntries(
    Object.entries(fields).filter(([k, v]) => v && !def?.fields.find((f) => f.key === k)?.noTranslate),
  );
  if (!Object.keys(translatable).length) return {};

  const masked: Record<string, { out: string; bag: string[] }> = {};
  for (const [k, v] of Object.entries(translatable)) masked[k] = mask(v);
  const payload = Object.fromEntries(Object.entries(masked).map(([k, m]) => [k, m.out]));

  const client = new Anthropic();
  const glossary = await glossaryLines();
  const system = `당신은 학술 CV와 포트폴리오 문장을 번역하는 전문 번역가다.
규칙:
- 자연스럽고 간결한 학술 문체. 없는 경력·성과를 추가하거나 과장하지 않는다.
- ⟦숫자⟧ 형태의 토큰은 그대로 보존한다. 프로그래밍 언어명·제품명·수치·연구 실적은 바꾸지 않는다.
- 인명·기관명·학위명은 공식 표기를 우선한다.${glossary}
- 출력은 JSON 하나만. 마크다운 펜스 없이. 형식: {"<lang>": {"<field>": "<번역>"}}
- zh-TW는 반드시 번체자로 쓴다.`;
  const user = `원문 언어: ${LANG_LABEL[source]} (${source})
대상 언어: ${targets.join(", ")}
원문(JSON): ${JSON.stringify(payload)}`;

  const res = await client.messages.create({
    model: process.env.TRANSLATE_MODEL || "claude-sonnet-5",
    max_tokens: 4000,
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = res.content.map((c) => (c.type === "text" ? c.text : "")).join("").trim()
    .replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let parsed: Record<string, Record<string, string>>;
  try { parsed = JSON.parse(text); } catch { return {}; }

  const out: Partial<Record<Lang, Record<string, string>>> = {};
  for (const lang of targets) {
    const f = parsed[lang];
    if (!f || typeof f !== "object") continue;
    const merged: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) {
      const isNoTr = def?.fields.find((x) => x.key === k)?.noTranslate;
      if (isNoTr || !translatable[k]) { merged[k] = v; continue; }
      merged[k] = typeof f[k] === "string" && f[k].trim() ? unmask(f[k], masked[k].bag) : v;
    }
    out[lang] = merged;
  }
  return out;
}

/** 항목 하나를 원문 기준으로 번역해 EntryText에 저장. user-edited 는 건드리지 않음. */
export async function translateEntry(entryId: number, force = false) {
  const entry = await prisma.entry.findUnique({ where: { id: entryId }, include: { texts: true } });
  if (!entry) return { ok: false, reason: "not found" };
  const src = entry.texts.find((x) => x.lang === entry.sourceLang);
  if (!src) return { ok: false, reason: "no source text" };
  const fields = JSON.parse(src.fields) as Record<string, string>;
  const targets = LANGS.filter((l) => {
    if (l === entry.sourceLang) return false;
    const ex = entry.texts.find((x) => x.lang === l);
    if (!ex) return true;
    if (ex.origin === "user-edited") return false;
    return force || ex.origin === "machine" && ex.updatedAt < src.updatedAt || ex.origin !== "machine";
  });
  if (!targets.length) return { ok: true, translated: [] as string[] };
  const result = await translateFields(entry.kind, fields, entry.sourceLang as Lang, targets);
  const done: string[] = [];
  for (const [lang, f] of Object.entries(result)) {
    await prisma.entryText.upsert({
      where: { entryId_lang: { entryId, lang } },
      create: { entryId, lang, fields: JSON.stringify(f), origin: "machine" },
      update: { fields: JSON.stringify(f), origin: "machine" },
    });
    done.push(lang);
  }
  return { ok: true, translated: done };
}
