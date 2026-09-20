import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "./actions";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

const MENU = [
  ["/admin", "대시보드"], ["/admin/entries?group=project", "프로젝트"], ["/admin/entries?group=research", "논문·수상"],
  ["/admin/entries?group=experience", "경력·교육"], ["/admin/entries?group=skill", "기술"], ["/admin/documents", "문서 보관함"],
  ["/admin/cv", "CV 편집기"], ["/admin/glossary", "고유명사 사전"], ["/admin/trash", "휴지통"], ["/admin/settings", "설정"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s.userId) return <>{children}</>;
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="admin-bar"><div className="container flex items-center gap-4 py-1.5">
        <span className="font-semibold tracking-wide">관리자</span>
        <Link href="/ko" className="underline opacity-80" target="_blank">공개 사이트 보기</Link>
        <form action={logout} className="ml-auto"><button className="underline opacity-80">로그아웃</button></form>
      </div></div>
      <div className="container grid gap-6 py-6 md:grid-cols-[180px_1fr]">
        <nav className="flex md:flex-col flex-wrap gap-1 text-sm">
          {MENU.map(([href, label]) => <Link key={href} href={href} className="px-3 py-1.5 rounded-md hover:bg-gold-soft">{label}</Link>)}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
