# 포트폴리오 사이트

공개 페이지(한/영/일/중 전환) + 폐쇄형 관리자 페이지 + 문서 보관함 + 학술 CV PDF(5개 언어) 생성.
기획서: `Desktop\포트폴리오-사이트-기획서.md`

## 처음 한 번

```bash
npm install
cp .env.example .env          # SESSION_SECRET 을 32자 이상 임의 문자열로 바꾸기
npm run db:push               # SQLite DB 생성 (prisma/dev.db)
npm run admin -- <아이디> <비밀번호10자이상>   # 관리자 계정
npm run seed                  # 초기 데이터 (선택)
```

## 실행

```bash
npm run dev      # http://localhost:3000
npm run build && npm start
```

- 공개 사이트: `/` → 브라우저 언어에 따라 `/ko`, `/en`, `/ja`, `/zh-CN`, `/zh-TW` 로 이동. 우측 상단에서 언어 전환.
- 관리자: `/admin` (링크 없음, 주소 직접 입력). 5회 실패 시 15분 잠금. OTP는 로그인 후 설정에서 켠다.

## 번역

`.env` 의 `ANTHROPIC_API_KEY` 를 넣으면 항목 저장 시 나머지 4개 언어로 자동 번역된다.
키가 없으면 "번역 없음"으로 표시되고 원문(한국어)으로 대체 표시된다. 각 언어 탭에서 직접 입력한 번역은 재번역해도 덮어쓰지 않는다.

## CV PDF

- 관리자 → CV 편집기에서 문서 언어를 고르고 미리보기·PDF 다운로드.
- 공개 `/cv` 는 공개 항목만, 관리자 PDF(`?all=1`)는 비공개 항목도 포함.
- PDF 렌더는 로컬 Edge/Chrome 을 사용 (`.env` 의 `BROWSER_PATH`).
- 파일명: `CV_이름_ko.pdf`, `CV_Name_en.pdf`, `CV_Name_ja.pdf`, `CV_Name_zh-CN.pdf`, `CV_Name_zh-TW.pdf`

## 구조

```
prisma/schema.prisma      DB (Entry + EntryText 언어별 텍스트, Document, Glossary, Setting)
src/lib/                  i18n 사전, 날짜 표기, 항목 종류/CV 섹션 정의, 번역, CV HTML, PDF
src/app/[lang]/           공개 페이지
src/app/admin/            관리자 페이지 (actions.ts 에 모든 서버 액션)
src/app/api/cv/pdf        CV 미리보기(HTML)·PDF
src/app/api/documents/:id 문서 다운로드 (관리자 세션 또는 서명 URL)
scripts/                  create-admin.ts, seed.ts
storage/                  업로드 파일 (git 제외)
```
