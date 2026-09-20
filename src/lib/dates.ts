import type { Lang } from "./i18n";

const EN_MON = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];

export function fmtMonth(d: Date | null | undefined, lang: Lang): string {
  if (!d) return "";
  const y = d.getUTCFullYear(), m = d.getUTCMonth();
  switch (lang) {
    case "ko": return `${y}년 ${m + 1}월`;
    case "en": return `${EN_MON[m]} ${y}`;
    default: return `${y}年${m + 1}月`;
  }
}

export function fmtRange(start: Date | null | undefined, end: Date | null | undefined, isCurrent: boolean, lang: Lang): string {
  const present: Record<Lang, string> = { ko: "현재", en: "Present", ja: "現在", "zh-CN": "至今", "zh-TW": "至今" };
  const s = fmtMonth(start, lang);
  if (!start) return "";
  if (isCurrent) return `${s}–${present[lang]}`;
  if (!end) return s;
  return `${s}–${fmtMonth(end, lang)}`;
}

export function toInputMonth(d: Date | null | undefined): string {
  if (!d) return "";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
export function fromInputMonth(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})/.exec(s);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, 1));
}
