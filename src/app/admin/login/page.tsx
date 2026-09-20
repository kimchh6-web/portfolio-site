import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loginPassword, loginTotp } from "../actions";

export const metadata = { robots: { index: false, follow: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const s = await getSession();
  if (s.userId) redirect("/admin");
  const { e } = await searchParams;
  const step2 = !!s.pwOk;
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <form action={step2 ? loginTotp : loginPassword} className="w-full max-w-xs space-y-4">
        {e && <p className="text-sm" style={{ color: "#b3261e" }}>{decodeURIComponent(e)}</p>}
        {!step2 ? (
          <>
            <input className="input" name="username" placeholder="ID" autoComplete="username" required />
            <input className="input" name="password" type="password" placeholder="Password" autoComplete="current-password" required />
          </>
        ) : (
          <input className="input" name="code" inputMode="numeric" pattern="[0-9]{6}" placeholder="OTP 6자리" autoFocus required />
        )}
        <button className="btn btn-primary w-full justify-center">확인</button>
      </form>
    </div>
  );
}
