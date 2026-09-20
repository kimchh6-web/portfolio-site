import { prisma } from "./db";
import { fmtRange } from "./dates";
import { type Lang, SERIF_FONT } from "./i18n";
import { CV_SECTIONS, KIND_MAP } from "./kinds";
import { EMPTY_PROFILE, getSetting, pickLang, pickText, type EntryView, type SiteProfile } from "./content";

const esc = (s: string) => (s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

const FONT_CSS = "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&family=Noto+Serif+JP:wght@400;700&family=Noto+Serif+SC:wght@400;700&family=Noto+Serif+TC:wght@400;700&family=Noto+Serif:wght@400;700&display=swap";

function fallbackChain(lang: Lang) {
  // 한 문서에 여러 문자가 섞여도 깨지지 않도록 대체 글꼴 체인
  const primary = SERIF_FONT[lang];
  return `${primary}, 'Noto Serif KR', 'Noto Serif JP', 'Noto Serif SC', 'Noto Serif TC', 'Noto Serif', 'Times New Roman', serif`;
}

/** 관리자(includePrivate=true)는 비공개 항목도 포함. 공개 /cv 는 공개 항목만. */
export async function buildCvHtml(lang: Lang, includePrivate = false): Promise<{ html: string; filename: string }> {
  const p = await getSetting<SiteProfile>("profile", EMPTY_PROFILE);
  const rows = await prisma.entry.findMany({
    where: { inCv: true, deletedAt: null, ...(includePrivate ? {} : { isPublic: true }) },
    include: { texts: true },
    orderBy: [{ order: "asc" }, { dateStart: "desc" }, { id: "desc" }],
  });
  const views = rows.map((r) => pickText(r, lang));
  const bySection = new Map<string, EntryView[]>();
  for (const v of views) {
    const sec = KIND_MAP[v.kind]?.cvSection;
    if (!sec) continue;
    if (!bySection.has(sec)) bySection.set(sec, []);
    bySection.get(sec)!.push(v);
  }

  const name = pickLang(p.name, lang);
  const headerLines = [pickLang(p.title, lang), pickLang(p.affiliation, lang), p.email, p.profileUrl].filter(Boolean);
  const smallCaps = lang === "en" ? "font-variant: small-caps;" : "";

  const sectionsHtml = CV_SECTIONS.map((sec) => {
    const items = bySection.get(sec.key);
    if (!items?.length) return "";
    const kindDef = KIND_MAP[items[0].kind];
    const style = kindDef?.listStyle ?? "bullet";
    let body = "";
    if (style === "table3") {
      body = `<table class="edu">${items.map((e) => `<tr><td class="c1">${esc(fmtRange(e.dateStart, e.dateEnd, e.isCurrent, lang))}</td><td class="c2"><b>${esc(e.f.org)}</b>${e.f.degree ? `<br>${esc(e.f.degree)}` : ""}${e.f.summary ? `<br><span class="sub">${esc(e.f.summary)}</span>` : ""}</td><td class="c3">${esc(e.f.location ?? "")}</td></tr>`).join("")}</table>`;
    } else if (style === "inline") {
      if (sec.key === "skills") {
        body = `<table class="skills">${items.map((e) => `<tr><td class="k">${esc(e.f.category ?? "")}</td><td>${esc(e.f.title ?? "")}</td></tr>`).join("")}</table>`;
      } else {
        body = `<p>${items.map((e) => esc(e.f.title)).filter(Boolean).join(", ")}</p>`;
      }
    } else {
      const tag = style === "number" ? "ol" : "ul";
      body = `<${tag}>${items.map((e) => {
        const date = fmtRange(e.dateStart, e.dateEnd, e.isCurrent, lang);
        const parts: string[] = [];
        if (e.kind === "work") {
          parts.push(`<b>${esc(e.f.org)}</b>${e.f.title ? `, ${esc(e.f.title)}` : ""}${e.f.location ? ` (${esc(e.f.location)})` : ""}`);
          if (date) parts.push(`<span class="date">${esc(date)}</span>`);
          if (e.f.body) parts.push(`<div class="desc">${esc(e.f.body).replace(/\n/g, "<br>")}</div>`);
        } else if (["paper", "intl_workshop", "under_review", "preprint", "talk"].includes(e.kind)) {
          const authors = e.f.authors ? `${esc(e.f.authors.replace(/\.\s*$/, ""))}. ` : "";
          const tr = e.f.title_tr ? ` <span class="sub">(${esc(e.f.title_tr)})</span>` : "";
          parts.push(`${authors}“${esc(e.f.title)}”${tr}${e.f.venue ? `, <i>${esc(e.f.venue)}</i>` : ""}${date ? `, ${esc(date)}` : ""}${e.link ? ` <a href="${esc(e.link)}">${esc(e.link)}</a>` : ""}`);
        } else {
          parts.push(`<b>${esc(e.f.title ?? "")}</b>${e.f.org ? `, ${esc(e.f.org)}` : ""}${e.f.role ? ` — ${esc(e.f.role)}` : ""}`);
          if (date) parts.push(`<span class="date">${esc(date)}</span>`);
          const d = e.f.summary || e.f.body;
          if (d) parts.push(`<div class="desc">${esc(d).replace(/\n/g, "<br>")}</div>`);
        }
        return `<li>${parts.join(" ")}</li>`;
      }).join("")}</${tag}>`;
    }
    return `<section class="sec"><h2>${esc(sec.title[lang])}</h2>${body}</section>`;
  }).join("");

  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<title>CV - ${esc(name)}</title>
<link rel="stylesheet" href="${FONT_CSS}">
<style>
  @page { size: A4 portrait; margin: 24mm; }
  html, body { background: #fff; color: #000; }
  body { font-family: ${fallbackChain(lang)}; font-size: 10.5pt; line-height: 1.45; margin: 0; }
  .page { max-width: 162mm; margin: 0 auto; padding: 0; }
  @media screen { .page { padding: 24mm; background: #fff; box-shadow: 0 0 0 1px #ddd; margin: 16px auto; } }
  h1 { font-size: 21pt; font-weight: 700; text-align: center; margin: 0 0 4pt; }
  .hdr { text-align: center; font-size: 10pt; margin-bottom: 14pt; }
  .hdr div { margin: 1pt 0; }
  h2 { font-size: 12.5pt; font-weight: 700; margin: 14pt 0 4pt; padding-bottom: 2pt; border-bottom: 0.6pt solid #000; ${smallCaps} break-after: avoid; page-break-after: avoid; }
  .sec { break-inside: auto; }
  .sec > h2 + * { break-before: avoid; page-break-before: avoid; }
  ul, ol { margin: 0; padding-left: 16pt; }
  li { margin: 2pt 0; break-inside: avoid; page-break-inside: avoid; }
  .date { color: #333; font-size: 9.5pt; white-space: nowrap; }
  .desc { margin-top: 1pt; }
  .sub { color: #444; font-size: 9.5pt; }
  table.edu { width: 100%; border-collapse: collapse; }
  table.edu td { vertical-align: top; padding: 2pt 4pt 2pt 0; }
  table.edu .c1 { width: 30%; white-space: nowrap; }
  table.edu .c3 { width: 18%; text-align: right; }
  table.skills td { vertical-align: top; padding: 1pt 8pt 1pt 0; }
  table.skills .k { font-weight: 700; white-space: nowrap; }
  a { color: #000; text-decoration: none; word-break: break-all; }
  p { margin: 0; }
  :lang(ja), :lang(zh-CN), :lang(zh-TW) { word-break: normal; line-break: strict; }
  :lang(ko) { word-break: keep-all; }
</style></head><body><div class="page">
<h1>${esc(name)}</h1>
<div class="hdr">${headerLines.map((x) => `<div>${esc(x)}</div>`).join("")}</div>
${sectionsHtml}
</div></body></html>`;

  const safeName = (name || "CV").replace(/[\\/:*?"<>|\s]+/g, "_");
  return { html, filename: `CV_${safeName}_${lang}.pdf` };
}
