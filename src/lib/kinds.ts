import type { Lang } from "./i18n";

// 항목 종류 정의: 어떤 텍스트 필드를 가지는지, CV 어느 섹션에 들어가는지
export type FieldDef = { key: string; label: string; multiline?: boolean; noTranslate?: boolean };

export type KindDef = {
  kind: string;
  label: string;            // 관리자 화면 라벨 (한국어)
  group: "project" | "research" | "experience" | "skill" | "cv";
  fields: FieldDef[];       // 언어별 텍스트 필드
  hasDate: boolean;
  cvSection?: string;       // CV 섹션 키
  listStyle?: "bullet" | "number" | "table3" | "inline";
};

export const KINDS: KindDef[] = [
  { kind: "project", label: "프로젝트", group: "project", hasDate: true, cvSection: "projects", listStyle: "bullet",
    fields: [{ key: "title", label: "제목" }, { key: "summary", label: "한 줄 요약" }, { key: "role", label: "역할" }, { key: "body", label: "상세 설명", multiline: true }] },
  { kind: "paper", label: "논문", group: "research", hasDate: true, cvSection: "domestic_conf", listStyle: "number",
    fields: [{ key: "title", label: "논문 제목", noTranslate: true }, { key: "title_tr", label: "번역 제목(선택)" }, { key: "venue", label: "학회·저널" }, { key: "authors", label: "저자", noTranslate: true }] },
  { kind: "intl_workshop", label: "국제 워크숍 논문", group: "research", hasDate: true, cvSection: "intl_workshop", listStyle: "number",
    fields: [{ key: "title", label: "논문 제목", noTranslate: true }, { key: "title_tr", label: "번역 제목(선택)" }, { key: "venue", label: "워크숍" }, { key: "authors", label: "저자", noTranslate: true }] },
  { kind: "under_review", label: "심사 중인 논문", group: "research", hasDate: true, cvSection: "under_review", listStyle: "number",
    fields: [{ key: "title", label: "논문 제목", noTranslate: true }, { key: "title_tr", label: "번역 제목(선택)" }, { key: "venue", label: "투고처" }, { key: "authors", label: "저자", noTranslate: true }] },
  { kind: "preprint", label: "프리프린트", group: "research", hasDate: true, cvSection: "preprint", listStyle: "number",
    fields: [{ key: "title", label: "제목", noTranslate: true }, { key: "title_tr", label: "번역 제목(선택)" }, { key: "venue", label: "서버(arXiv 등)" }, { key: "authors", label: "저자", noTranslate: true }] },
  { kind: "award", label: "수상", group: "research", hasDate: true, cvSection: "awards", listStyle: "bullet",
    fields: [{ key: "title", label: "수상명" }, { key: "org", label: "수여 기관" }, { key: "summary", label: "설명" }] },
  { kind: "talk", label: "발표", group: "research", hasDate: true, cvSection: "domestic_conf", listStyle: "number",
    fields: [{ key: "title", label: "발표 제목" }, { key: "venue", label: "행사" }] },
  { kind: "work", label: "경력", group: "experience", hasDate: true, cvSection: "research_experience", listStyle: "bullet",
    fields: [{ key: "org", label: "기관·회사" }, { key: "title", label: "직책" }, { key: "location", label: "지역" }, { key: "body", label: "업무 내용", multiline: true }] },
  { kind: "education", label: "학력", group: "experience", hasDate: true, cvSection: "education", listStyle: "table3",
    fields: [{ key: "org", label: "학교" }, { key: "degree", label: "학위·전공" }, { key: "location", label: "지역" }, { key: "summary", label: "비고" }] },
  { kind: "training", label: "교육·연수", group: "experience", hasDate: true, cvSection: "training", listStyle: "bullet",
    fields: [{ key: "title", label: "과정명" }, { key: "org", label: "주관" }, { key: "summary", label: "설명" }] },
  { kind: "skill", label: "기술", group: "skill", hasDate: false, cvSection: "skills", listStyle: "inline",
    fields: [{ key: "category", label: "분류" }, { key: "title", label: "기술 이름(쉼표로 구분)", noTranslate: true }] },
  { kind: "interest", label: "연구 관심 분야", group: "cv", hasDate: false, cvSection: "interests", listStyle: "inline",
    fields: [{ key: "title", label: "분야" }] },
];
export const KIND_MAP = Object.fromEntries(KINDS.map((k) => [k.kind, k]));

// CV 섹션 순서와 언어별 제목
export const CV_SECTIONS: { key: string; title: Record<Lang, string> }[] = [
  { key: "interests", title: { ko: "연구 관심 분야", en: "Research Interests", ja: "研究関心", "zh-CN": "研究兴趣", "zh-TW": "研究興趣" } },
  { key: "education", title: { ko: "학력", en: "Education", ja: "学歴", "zh-CN": "教育背景", "zh-TW": "教育背景" } },
  { key: "research_experience", title: { ko: "연구 경력", en: "Research Experience", ja: "研究経歴", "zh-CN": "研究经历", "zh-TW": "研究經歷" } },
  { key: "intl_workshop", title: { ko: "국제 워크숍 논문", en: "International Workshop Papers", ja: "国際ワークショップ論文", "zh-CN": "国际研讨会论文", "zh-TW": "國際研討會論文" } },
  { key: "under_review", title: { ko: "심사 중인 논문", en: "Manuscripts Under Review", ja: "査読中の論文", "zh-CN": "在审论文", "zh-TW": "在審論文" } },
  { key: "preprint", title: { ko: "프리프린트", en: "Preprints", ja: "プレプリント", "zh-CN": "预印本", "zh-TW": "預印本" } },
  { key: "domestic_conf", title: { ko: "국내 학술대회 논문", en: "Domestic Conference Papers", ja: "国内学会発表論文", "zh-CN": "国内会议论文", "zh-TW": "國內會議論文" } },
  { key: "awards", title: { ko: "수상 경력", en: "Awards and Honors", ja: "受賞歴", "zh-CN": "荣誉与奖励", "zh-TW": "榮譽與獎勵" } },
  { key: "projects", title: { ko: "프로젝트", en: "Projects", ja: "研究プロジェクト", "zh-CN": "项目经历", "zh-TW": "專案經歷" } },
  { key: "training", title: { ko: "교육 및 연수", en: "Training & Professional Development", ja: "研修・講習", "zh-CN": "培训与进修", "zh-TW": "培訓與進修" } },
  { key: "skills", title: { ko: "기술 역량", en: "Technical Skills", ja: "技術スキル", "zh-CN": "专业技能", "zh-TW": "專業技能" } },
];
