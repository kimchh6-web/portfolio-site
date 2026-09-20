import crypto from "node:crypto";

const secret = () => process.env.SESSION_SECRET || "dev-secret";

/** 서명된 임시 다운로드 URL (기본 10분) */
export function signDownload(fileId: number, ttlSec = 600) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const sig = crypto.createHmac("sha256", secret()).update(`${fileId}.${exp}`).digest("hex");
  return `/api/documents/${fileId}?exp=${exp}&sig=${sig}`;
}

export function verifyDownload(fileId: number, exp: number, sig: string) {
  if (!exp || exp < Date.now() / 1000) return false;
  const expect = crypto.createHmac("sha256", secret()).update(`${fileId}.${exp}`).digest("hex");
  return sig.length === expect.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect));
}
