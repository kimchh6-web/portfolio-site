// 시드 항목의 영어·일본어·중국어(간체·번체) 번역을 직접 채움. 이미 user-edited 인 언어는 건드리지 않음.
// 실행: npx tsx scripts/fill-translations.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type T = Record<string, Record<string, string>>; // lang -> fields
const byId: Record<number, T> = {
  1: {
    en: { title: "KDI Insight AI", summary: "Web service that analyzes 2,000+ policy documents with RAG and compares them with private-sector documents", role: "Lead: architecture, backend, deployment", body: "Manages official policy documents and privately contributed documents as separate corpora, and compares the two during analysis with a radar chart and summary. Built the safeguards needed for public operation, including an admin approval queue, PII masking, and rate limiting, and exposed the service externally via Cloudflare Tunnel." },
    ja: { title: "KDI Insight AI", summary: "2,000件超の政策文書をRAGで分析し、民間文書と比較するWebサービス", role: "設計・バックエンド・デプロイ統括", body: "公式政策文書と民間投稿文書を別々のコーパスとして管理し、文書分析時に両コーパスを比較してレーダーチャートと要約を提供します。管理者承認キュー、PIIマスキング、レート制限など公開運用に必要な仕組みを備え、Cloudflare Tunnelで外部公開しました。" },
    "zh-CN": { title: "KDI Insight AI", summary: "基于RAG分析2,000余份政策文件并与民间文件进行比较的Web服务", role: "架构、后端与部署负责人", body: "将官方政策文件与民间贡献文件作为独立语料库管理，在文档分析时比较两个语料库并提供雷达图与摘要。具备管理员审批队列、PII脱敏、速率限制等公开运营所需机制，并通过Cloudflare Tunnel对外发布。" },
    "zh-TW": { title: "KDI Insight AI", summary: "以RAG分析2,000餘份政策文件並與民間文件進行比較的Web服務", role: "架構、後端與部署負責人", body: "將官方政策文件與民間貢獻文件作為獨立語料庫管理，在文件分析時比較兩個語料庫並提供雷達圖與摘要。具備管理員審核佇列、PII遮罩、速率限制等公開營運所需機制，並透過Cloudflare Tunnel對外發布。" },
  },
  2: {
    en: { title: "Quill: Financial Research Search", summary: "Web app that collects and summarizes brokerage research reports and finds them with vector search", role: "Collector, vector DB, search API", body: "Collects research reports through the Naver API into Supabase and builds a Chroma vector database of about 1,800 chunks to provide semantic search." },
    ja: { title: "Quill 金融リサーチ検索", summary: "証券会社のリサーチレポートを収集・要約し、ベクトル検索で探せるWebアプリ", role: "収集器・ベクトルDB・検索API", body: "Naver APIでリサーチレポートを収集してSupabaseに格納し、約1,800チャンクをChromaベクトルDBとして構築して意味検索を提供します。" },
    "zh-CN": { title: "Quill 金融研究报告检索", summary: "收集并摘要券商研究报告，并通过向量检索查找的Web应用", role: "采集器、向量数据库、检索API", body: "通过Naver API收集研究报告并存入Supabase，将约1,800个文本块构建为Chroma向量数据库以提供语义检索。" },
    "zh-TW": { title: "Quill 金融研究報告檢索", summary: "蒐集並摘要券商研究報告，並透過向量檢索查找的Web應用", role: "蒐集器、向量資料庫、檢索API", body: "透過Naver API蒐集研究報告並存入Supabase，將約1,800個文字區塊建構為Chroma向量資料庫以提供語意檢索。" },
  },
  3: {
    en: { title: "Hamster-S Swarm Robot Education Program", summary: "Boids algorithm on four swarm robots plus teaching materials for middle school students", role: "Algorithm implementation, course materials", body: "Designed an educational code structure in which students complete only four functions to achieve swarm driving, and produced worksheets, answer keys, and a teacher's guide." },
    ja: { title: "ハムスターS 群ロボット教育プログラム", summary: "群ロボット4台によるboidsアルゴリズムの実装と中学生向け教材", role: "アルゴリズム実装・教材制作", body: "学生が4つの関数を埋めるだけで群走行が完成する教育用コード構造を設計し、ワークシート・解答・教師用指導案を制作しました。" },
    "zh-CN": { title: "Hamster-S 集群机器人教育项目", summary: "四台集群机器人的boids算法实现及面向初中生的教学材料", role: "算法实现、教材制作", body: "设计了学生只需完成四个函数即可实现集群行驶的教学代码结构，并制作了活动单、答案及教师指导方案。" },
    "zh-TW": { title: "Hamster-S 群體機器人教育專案", summary: "四台群體機器人的boids演算法實作及面向國中生的教學材料", role: "演算法實作、教材製作", body: "設計了學生只需完成四個函式即可實現群體行駛的教學程式結構，並製作了活動單、解答及教師指導方案。" },
  },
  4: {
    en: { org: "Kangwon National University", degree: "B.S. candidate, Computer Engineering", location: "Chuncheon, Korea" },
    ja: { org: "江原大学校", degree: "コンピュータ工学科 学士課程", location: "春川" },
    "zh-CN": { org: "江原大学", degree: "计算机工程系 本科在读", location: "春川" },
    "zh-TW": { org: "江原大學", degree: "電腦工程系 學士在讀", location: "春川" },
  },
  5: {
    en: { title: "AI Bootcamp: Intermediate (Immersive) and Advanced Healthcare AI Track", org: "Kangwon National University", summary: "Completed the full service lifecycle: RAG architecture design, Qwen model training, and cloud deployment" },
    ja: { title: "AIブートキャンプ 中級（集中型）・上級ヘルスケア（医療）AIトラック", org: "江原大学校", summary: "RAGアーキテクチャ設計、Qwenモデル学習、クラウドデプロイまでサービス全工程を遂行" },
    "zh-CN": { title: "AI训练营 中级（沉浸式）·高级医疗AI方向", org: "江原大学", summary: "完成从RAG架构设计、Qwen模型训练到云端部署的服务全流程" },
    "zh-TW": { title: "AI訓練營 中級（沉浸式）·高級醫療AI方向", org: "江原大學", summary: "完成從RAG架構設計、Qwen模型訓練到雲端部署的服務全流程" },
  },
  6: {
    en: { title: "AWS Training Course", org: "Amazon Web Services", summary: "Cloud infrastructure fundamentals and hands-on deployment" },
    ja: { title: "AWS教育課程", org: "Amazon Web Services", summary: "クラウドインフラの基礎とデプロイ実習" },
    "zh-CN": { title: "AWS 培训课程", org: "Amazon Web Services", summary: "云基础设施基础与部署实践" },
    "zh-TW": { title: "AWS 培訓課程", org: "Amazon Web Services", summary: "雲端基礎設施基礎與部署實作" },
  },
  7: {
    en: { org: "K-12 Research Mentoring Program", title: "Mentor and Hackathon Organizer", location: "Gangwon, Korea", body: "Mentored elementary and middle school students in AI and programming research projects and helped run hackathons" },
    ja: { org: "小・中学生 研究メンタリングプログラム", title: "メンター・ハッカソン運営", location: "江原", body: "小・中学生を対象としたAI・プログラミング研究メンタリングとハッカソン運営に参加" },
    "zh-CN": { org: "中小学生科研导师计划", title: "导师、黑客松组织", location: "江原", body: "参与面向中小学生的AI与编程科研辅导及黑客松运营" },
    "zh-TW": { org: "中小學生科研導師計畫", title: "導師、黑客松籌辦", location: "江原", body: "參與面向中小學生的AI與程式設計科研輔導及黑客松營運" },
  },
  10: { en: { category: "Languages", title: "Python, TypeScript, SQL" }, ja: { category: "言語", title: "Python, TypeScript, SQL" }, "zh-CN": { category: "编程语言", title: "Python, TypeScript, SQL" }, "zh-TW": { category: "程式語言", title: "Python, TypeScript, SQL" } },
  11: { en: { category: "AI & Data", title: "RAG, Chroma, LLM integration (Claude, Gemini, Qwen), Deep Learning" }, ja: { category: "AI・データ", title: "RAG, Chroma, LLM連携（Claude・Gemini・Qwen）, ディープラーニング" }, "zh-CN": { category: "AI·数据", title: "RAG, Chroma, LLM集成（Claude·Gemini·Qwen）, 深度学习" }, "zh-TW": { category: "AI·資料", title: "RAG, Chroma, LLM整合（Claude·Gemini·Qwen）, 深度學習" } },
  12: { en: { category: "Backend & Infra", title: "FastAPI, Supabase, AWS, Docker, Cloudflare Tunnel" }, ja: { category: "バックエンド・インフラ", title: "FastAPI, Supabase, AWS, Docker, Cloudflare Tunnel" }, "zh-CN": { category: "后端·基础设施", title: "FastAPI, Supabase, AWS, Docker, Cloudflare Tunnel" }, "zh-TW": { category: "後端·基礎設施", title: "FastAPI, Supabase, AWS, Docker, Cloudflare Tunnel" } },
  13: { en: { category: "Frontend", title: "React, Vite, Next.js" }, ja: { category: "フロントエンド", title: "React, Vite, Next.js" }, "zh-CN": { category: "前端", title: "React, Vite, Next.js" }, "zh-TW": { category: "前端", title: "React, Vite, Next.js" } },
  14: { en: { title: "Retrieval-Augmented Generation (RAG) and its safety" }, ja: { title: "検索拡張生成（RAG）と安全性" }, "zh-CN": { title: "检索增强生成（RAG）与安全性" }, "zh-TW": { title: "檢索增強生成（RAG）與安全性" } },
  15: { en: { title: "Harness design for AI agents" }, ja: { title: "AIエージェントのハーネス設計" }, "zh-CN": { title: "AI智能体的Harness设计" }, "zh-TW": { title: "AI代理的Harness設計" } },
};

const profile = {
  name: { ko: "김혁균", en: "Hyukgyun Kim", ja: "キム・ヒョッキュン", "zh-CN": "金赫均", "zh-TW": "金赫均" },
  tagline: {
    ko: "RAG와 AI 에이전트로 실생활의 문제를 푸는 컴퓨터공학도",
    en: "Computer engineering student solving everyday problems with RAG and AI agents",
    ja: "RAGとAIエージェントで実生活の課題を解くコンピュータ工学の学生",
    "zh-CN": "用RAG与AI智能体解决现实问题的计算机工程专业学生",
    "zh-TW": "以RAG與AI代理解決現實問題的電腦工程系學生",
  },
  title: { ko: "학부생", en: "Undergraduate Student", ja: "学部生", "zh-CN": "本科生", "zh-TW": "大學部學生" },
  affiliation: {
    ko: "강원대학교 컴퓨터공학과", en: "Dept. of Computer Engineering, Kangwon National University",
    ja: "江原大学校 コンピュータ工学科", "zh-CN": "江原大学 计算机工程系", "zh-TW": "江原大學 電腦工程系",
  },
};

(async () => {
  let n = 0;
  for (const [idStr, langs] of Object.entries(byId)) {
    const entryId = Number(idStr);
    const entry = await prisma.entry.findUnique({ where: { id: entryId }, include: { texts: true } });
    if (!entry || entry.deletedAt) continue;
    for (const [lang, fields] of Object.entries(langs)) {
      const prev = entry.texts.find((t) => t.lang === lang);
      if (prev?.origin === "user-edited") continue;
      await prisma.entryText.upsert({
        where: { entryId_lang: { entryId, lang } },
        create: { entryId, lang, fields: JSON.stringify(fields), origin: "user-edited" },
        update: { fields: JSON.stringify(fields), origin: "user-edited" },
      });
      n++;
    }
  }
  const s = await prisma.setting.findUnique({ where: { key: "profile" } });
  const cur = s ? JSON.parse(s.value) : {};
  await prisma.setting.upsert({ where: { key: "profile" }, create: { key: "profile", value: JSON.stringify({ ...cur, ...profile }) }, update: { value: JSON.stringify({ ...cur, ...profile }) } });
  console.log(`번역 ${n}건 저장, 프로필 5개 언어 갱신`);
  await prisma.$disconnect();
})();
