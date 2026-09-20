import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LANGS, LANG_LABEL } from "@/lib/i18n";
import { EMPTY_PROFILE, getSetting, type SiteProfile } from "@/lib/content";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { changePassword, resetTotp, saveProfile } from "../actions";

export default async function Settings({ searchParams }: { searchParams: Promise<{ saved?: string; e?: string; totp?: string }> }) {
  const s = await requireAdmin();
  const sp = await searchParams;
  const p = await getSetting<SiteProfile>("profile", EMPTY_PROFILE);
  const u = await prisma.adminUser.findUnique({ where: { id: s.userId! } });
  let qr = "";
  if (sp.totp && u?.totpSecret) {
    qr = await QRCode.toDataURL(authenticator.keyuri(u.username, "Portfolio Admin", u.totpSecret));
  }
  const ML = ({ name, label, value }: { name: string; label: string; value: Record<string, string> }) => (
    <div className="grid gap-2 sm:grid-cols-5">{LANGS.map((l) => <label key={l} className="block"><span className="label">{label} · {LANG_LABEL[l]}</span><input className="input" name={`${name}__${l}`} defaultValue={value?.[l] ?? ""} /></label>)}</div>
  );
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">설정 {sp.saved && <span className="badge">저장됨</span>}</h1>
      {sp.e && <p className="text-sm" style={{ color: "#b3261e" }}>{decodeURIComponent(sp.e)}</p>}

      <form action={saveProfile} className="space-y-4">
        <h2 className="font-semibold">사이트·CV 프로필</h2>
        <ML name="name" label="이름" value={p.name} />
        <ML name="tagline" label="한 줄 소개" value={p.tagline} />
        <ML name="title" label="직위" value={p.title} />
        <ML name="affiliation" label="소속" value={p.affiliation} />
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="block"><span className="label">이메일</span><input className="input" name="email" defaultValue={p.email} /></label>
          <label className="block"><span className="label">GitHub URL</span><input className="input" name="github" defaultValue={p.github} /></label>
          <label className="block"><span className="label">연구자 프로필 URL (ORCID 등)</span><input className="input" name="profileUrl" defaultValue={p.profileUrl} /></label>
          <label className="block"><span className="label">사이트 제목 (상단 로고·탭, 비우면 Portfolio)</span><input className="input" name="siteTitle" defaultValue={p.siteTitle ?? ""} placeholder="Portfolio" /></label>
          <label className="block"><span className="label">사진 URL (비우면 /profile.jpg)</span><input className="input" name="photo" defaultValue={p.photo ?? ""} placeholder="/profile.jpg" /></label>
        </div>
        <label className="block"><span className="label">기타 링크 (한 줄에 하나, ‘이름 | URL’)</span><textarea className="textarea" rows={2} name="links" defaultValue={(p.links ?? []).map((l) => `${l.label} | ${l.url}`).join("\n")} /></label>
        <button className="btn btn-primary">저장</button>
      </form>

      <form action={changePassword} className="space-y-3 max-w-md rule pt-5">
        <h2 className="font-semibold">비밀번호 변경</h2>
        <input className="input" type="password" name="current" placeholder="현재 비밀번호" required />
        <input className="input" type="password" name="next" placeholder="새 비밀번호 (10자 이상)" required minLength={10} />
        <button className="btn">변경</button>
      </form>

      <div className="space-y-3 max-w-md rule pt-5">
        <h2 className="font-semibold">2단계 인증 (OTP)</h2>
        <p className="text-sm muted">현재: {u?.totpSecret ? "켜짐" : "꺼짐 (비밀번호만으로 로그인됨)"}</p>
        {qr && <div><img src={qr} alt="OTP QR" className="rounded" /><p className="text-xs muted mt-1">Google Authenticator 등으로 스캔하세요. 비밀키: <code>{u?.totpSecret}</code></p></div>}
        <div className="flex gap-2">
          <form action={resetTotp}><input type="hidden" name="enable" value="1" /><button className="btn btn-primary">{u?.totpSecret ? "새 키 발급" : "켜기"}</button></form>
          {u?.totpSecret && <form action={resetTotp}><input type="hidden" name="enable" value="0" /><button className="btn btn-danger">끄기</button></form>}
        </div>
      </div>
    </div>
  );
}
