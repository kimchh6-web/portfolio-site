import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type SessionData = { userId?: number; pwOk?: boolean; loginAt?: number };

const secret = process.env.SESSION_SECRET ?? "";
if (secret.length < 32 && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET must be at least 32 characters");
}

export const sessionOptions: SessionOptions = {
  password: secret.length >= 32 ? secret : secret.padEnd(32, "0"),
  cookieName: "ps_admin",
  ttl: 60 * 60 * 24 * 7,
  cookieOptions: {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};

export async function getSession() {
  const store = await cookies();
  return getIronSession<SessionData>(store, sessionOptions);
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s.userId) redirect("/admin/login");
  return s;
}

export async function isAdmin() {
  const s = await getSession();
  return !!s.userId;
}
