// 초기 데이터:  npx tsx scripts/seed.ts   (이미 항목이 있으면 건너뜀)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const M = (y: number, m: number) => new Date(Date.UTC(y, m - 1, 1));

type Seed = { kind: string; slug?: string; featured?: boolean; inCv?: boolean; order?: number; dateStart?: Date; dateEnd?: Date; isCurrent?: boolean; link?: string; extra?: Record<string, unknown>; ko: Record<string, string> };
const seeds: Seed[] = [
  { kind: "project", slug: "kdi-insight-ai", featured: true, inCv: true, order: 1, dateStart: M(2026, 6), dateEnd: M(2026, 7), extra: { tech: ["Python", "FastAPI", "RAG", "Chroma", "Cloudflare Tunnel"] },
    ko: { title: "KDI Insight AI", summary: "정책 문서 2,000여 건을 RAG로 분석하고 민간 문서와 비교하는 웹 서비스", role: "설계·백엔드·배포 총괄", body: "공식 정책 문서와 민간 기여 문서를 분리된 코퍼스로 관리하고, 문서 분석 시 두 코퍼스를 비교해 레이더 차트와 요약을 제공합니다. 관리자 승인 큐, PII 마스킹, rate limit 등 공개 운영에 필요한 장치를 갖추고 Cloudflare Tunnel로 외부 공개했습니다." } },
  { kind: "project", slug: "quill-finance", featured: true, inCv: true, order: 2, dateStart: M(2026, 8), extra: { tech: ["Python", "Supabase", "Chroma", "Gemini", "Vite"] },
    ko: { title: "Quill 금융 리서치 검색", summary: "증권사 리서치 보고서를 수집·요약하고 벡터 검색으로 찾아주는 웹앱", role: "수집기·벡터DB·검색 API", body: "네이버 API로 리서치 보고서를 수집해 Supabase에 적재하고, 1,800여 청크를 Chroma 벡터DB로 구축해 의미 검색을 제공합니다." } },
  { kind: "project", slug: "hamster-boids", featured: true, inCv: true, order: 3, dateStart: M(2026, 7), dateEnd: M(2026, 8), extra: { tech: ["Python", "햄스터S", "Boids"] },
    ko: { title: "햄스터S 군집로봇 교육 프로그램", summary: "군집 로봇 4대의 boids 알고리즘 구현과 중학생용 교육 자료", role: "알고리즘 구현·교재 제작", body: "학생이 4개의 함수만 채우면 군집 주행이 완성되는 교육용 코드 구조를 설계하고, 활동지·정답지·교사용 지도안을 제작했습니다." } },
  { kind: "education", inCv: true, dateStart: M(2021, 3), isCurrent: true, ko: { org: "강원대학교", degree: "컴퓨터공학과 학사 과정", location: "춘천" } },
  { kind: "training", inCv: true, dateStart: M(2026, 3), dateEnd: M(2026, 8), ko: { title: "AI 부트캠프 중급(몰입형) · 고급 헬스케어(의료) AI 트랙", org: "강원대학교", summary: "RAG 아키텍처 설계, Qwen 모델 학습, 클라우드 배포까지 서비스 전 주기 수행" } },
  { kind: "training", inCv: true, dateStart: M(2026, 1), ko: { title: "AWS 교육 과정", org: "Amazon Web Services", summary: "클라우드 인프라 기초 및 배포 실습" } },
  { kind: "work", inCv: true, dateStart: M(2025, 9), isCurrent: true, ko: { org: "초·중등 사사과정", title: "멘토 · 해커톤 운영", location: "강원", body: "초·중등 학생 대상 AI·프로그래밍 사사과정 멘토링과 해커톤 운영에 참여" } },
  { kind: "paper", inCv: true, dateStart: M(2026, 7), ko: { title: "(KCC 교육 분야 논문 제목을 입력하세요)", venue: "한국컴퓨터종합학술대회(KCC)", authors: "김혁균 외" } },
  { kind: "award", inCv: true, dateStart: M(2026, 5), ko: { title: "외부 해커톤(Daytona) 참가", org: "Daytona", summary: "샌드박스 기반 문서 파싱 파이프라인 구현" } },
  { kind: "skill", inCv: true, order: 1, ko: { category: "언어", title: "Python, TypeScript, SQL" } },
  { kind: "skill", inCv: true, order: 2, ko: { category: "AI·데이터", title: "RAG, Chroma, LLM 연동(Claude·Gemini·Qwen), 딥러닝" } },
  { kind: "skill", inCv: true, order: 3, ko: { category: "백엔드·인프라", title: "FastAPI, Supabase, AWS, Docker, Cloudflare Tunnel" } },
  { kind: "skill", inCv: true, order: 4, ko: { category: "프론트엔드", title: "React, Vite, Next.js" } },
  { kind: "interest", inCv: true, ko: { title: "검색 증강 생성(RAG)과 안전성" } },
  { kind: "interest", inCv: true, ko: { title: "AI 에이전트 하네스 설계" } },
];

(async () => {
  if (await prisma.entry.count()) { console.log("이미 항목이 있어 시드를 건너뜁니다."); await prisma.$disconnect(); return; }
  for (const s of seeds) {
    await prisma.entry.create({ data: {
      kind: s.kind, slug: s.slug ?? null, featured: !!s.featured, inCv: s.inCv ?? true, order: s.order ?? 0,
      dateStart: s.dateStart ?? null, dateEnd: s.dateEnd ?? null, isCurrent: !!s.isCurrent, link: s.link ?? null,
      extra: JSON.stringify(s.extra ?? {}), sourceLang: "ko",
      texts: { create: { lang: "ko", fields: JSON.stringify(s.ko), origin: "user" } },
    } });
  }
  await prisma.setting.upsert({ where: { key: "profile" }, create: { key: "profile", value: JSON.stringify({
    name: { ko: "김혁균", en: "Hyukgyun Kim", ja: "キム・ヒョッキュン", "zh-CN": "金赫均", "zh-TW": "金赫均" },
    tagline: { ko: "RAG와 AI 에이전트로 실생활의 문제를 푸는 컴퓨터공학도", en: "Computer science student building practical RAG and AI-agent systems" },
    title: { ko: "학부생", en: "Undergraduate Student" },
    affiliation: { ko: "강원대학교 컴퓨터공학과", en: "Dept. of Computer Engineering, Kangwon National University" },
    email: "kimchh6@gmail.com", github: "", profileUrl: "", links: [],
  }) }, update: {} });
  await prisma.glossary.createMany({ data: [
    { kind: "org", ko: "강원대학교", en: "Kangwon National University", ja: "江原大学校", zhCN: "江原大学", zhTW: "江原大學" },
    { kind: "org", ko: "한국컴퓨터종합학술대회(KCC)", en: "Korea Computer Congress (KCC)", ja: "韓国コンピュータ総合学術大会(KCC)", zhCN: "韩国计算机综合学术大会(KCC)", zhTW: "韓國電腦綜合學術大會(KCC)" },
    { kind: "person", ko: "김혁균", en: "Hyukgyun Kim", ja: "キム・ヒョッキュン", zhCN: "金赫均", zhTW: "金赫均" },
  ] });
  console.log(`시드 완료: 항목 ${seeds.length}건, 프로필, 고유명사 3건`);
  await prisma.$disconnect();
})();
