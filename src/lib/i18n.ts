export const LANGS = ["ko", "en", "ja", "zh-CN", "zh-TW"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "ko";
export const LANG_LABEL: Record<Lang, string> = {
  ko: "한국어", en: "English", ja: "日本語", "zh-CN": "中文（简体）", "zh-TW": "中文（繁體）",
};
export function isLang(x: string | undefined | null): x is Lang {
  return !!x && (LANGS as readonly string[]).includes(x);
}

// 고정 문구 사전 (메뉴·버튼·안내문)
const dict = {
  ko: {
    nav_home: "홈", nav_projects: "프로젝트", nav_research: "논문·수상", nav_experience: "경력·교육",
    nav_skills: "기술", nav_cv: "CV", nav_contact: "연락",
    featured: "대표 프로젝트", recent: "최근 소식", all_projects: "모든 프로젝트", role: "역할", tech: "기술",
    links: "링크", papers: "논문", awards: "수상", talks: "발표", work: "경력", education: "학력", training: "교육·연수",
    download_pdf: "PDF 다운로드", cv_lang: "문서 언어", email: "이메일", contact_title: "연락처",
    no_content: "아직 등록된 내용이 없습니다.", present: "현재", view: "보기", back: "목록으로",
    lang_switch: "언어",
  },
  en: {
    nav_home: "Home", nav_projects: "Projects", nav_research: "Research", nav_experience: "Experience",
    nav_skills: "Skills", nav_cv: "CV", nav_contact: "Contact",
    featured: "Featured Projects", recent: "Recent", all_projects: "All Projects", role: "Role", tech: "Tech",
    links: "Links", papers: "Papers", awards: "Awards", talks: "Talks", work: "Work", education: "Education", training: "Training",
    download_pdf: "Download PDF", cv_lang: "Document language", email: "Email", contact_title: "Contact",
    no_content: "Nothing here yet.", present: "Present", view: "View", back: "Back to list",
    lang_switch: "Language",
  },
  ja: {
    nav_home: "ホーム", nav_projects: "プロジェクト", nav_research: "研究・受賞", nav_experience: "経歴・教育",
    nav_skills: "スキル", nav_cv: "CV", nav_contact: "連絡先",
    featured: "主要プロジェクト", recent: "最近の動き", all_projects: "すべてのプロジェクト", role: "役割", tech: "技術",
    links: "リンク", papers: "論文", awards: "受賞", talks: "発表", work: "職歴", education: "学歴", training: "研修",
    download_pdf: "PDFをダウンロード", cv_lang: "文書の言語", email: "メール", contact_title: "連絡先",
    no_content: "まだ内容がありません。", present: "現在", view: "見る", back: "一覧へ",
    lang_switch: "言語",
  },
  "zh-CN": {
    nav_home: "首页", nav_projects: "项目", nav_research: "论文·荣誉", nav_experience: "经历·教育",
    nav_skills: "技能", nav_cv: "简历", nav_contact: "联系",
    featured: "代表项目", recent: "最新动态", all_projects: "全部项目", role: "职责", tech: "技术",
    links: "链接", papers: "论文", awards: "荣誉", talks: "报告", work: "工作经历", education: "教育背景", training: "培训",
    download_pdf: "下载 PDF", cv_lang: "文档语言", email: "邮箱", contact_title: "联系方式",
    no_content: "暂无内容。", present: "至今", view: "查看", back: "返回列表",
    lang_switch: "语言",
  },
  "zh-TW": {
    nav_home: "首頁", nav_projects: "專案", nav_research: "論文·榮譽", nav_experience: "經歷·教育",
    nav_skills: "技能", nav_cv: "履歷", nav_contact: "聯絡",
    featured: "代表專案", recent: "最新動態", all_projects: "全部專案", role: "職責", tech: "技術",
    links: "連結", papers: "論文", awards: "榮譽", talks: "報告", work: "工作經歷", education: "教育背景", training: "培訓",
    download_pdf: "下載 PDF", cv_lang: "文件語言", email: "電子郵件", contact_title: "聯絡方式",
    no_content: "尚無內容。", present: "至今", view: "查看", back: "返回列表",
    lang_switch: "語言",
  },
} as const;

export type DictKey = keyof (typeof dict)["ko"];
export function t(lang: Lang, key: DictKey): string {
  return (dict[lang] as Record<string, string>)[key] ?? dict.ko[key];
}

// 사이트 본문 서체 (언어별)
export const BODY_FONT: Record<Lang, string> = {
  ko: "'Pretendard Variable', Pretendard, 'Noto Sans KR', sans-serif",
  en: "Inter, 'Pretendard Variable', sans-serif",
  ja: "'Noto Sans JP', 'Pretendard Variable', sans-serif",
  "zh-CN": "'Noto Sans SC', 'Pretendard Variable', sans-serif",
  "zh-TW": "'Noto Sans TC', 'Pretendard Variable', sans-serif",
};
export const SERIF_FONT: Record<Lang, string> = {
  ko: "'Noto Serif KR', serif",
  en: "'Times New Roman', 'Noto Serif', serif",
  ja: "'Noto Serif JP', serif",
  "zh-CN": "'Noto Serif SC', serif",
  "zh-TW": "'Noto Serif TC', serif",
};
