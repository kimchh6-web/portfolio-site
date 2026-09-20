// 문서 파일 저장소: Supabase Storage(비공개 버킷) 또는 로컬 폴더
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_BUCKET || "documents";

function supa() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
function localDir() { return path.resolve(process.env.STORAGE_DIR || "./storage"); }

export function storageKind() { return supa() ? "supabase" : "local"; }

export async function putFile(storedName: string, data: Buffer, mime: string) {
  const s = supa();
  if (s) {
    // 버킷이 없으면 만든다 (비공개)
    const { data: buckets } = await s.storage.listBuckets();
    if (!buckets?.some((b) => b.name === BUCKET)) await s.storage.createBucket(BUCKET, { public: false });
    const { error } = await s.storage.from(BUCKET).upload(storedName, data, { contentType: mime, upsert: false });
    if (error) throw new Error(error.message);
    return;
  }
  await fs.mkdir(localDir(), { recursive: true });
  await fs.writeFile(path.join(localDir(), storedName), data);
}

export async function getFile(storedName: string): Promise<Buffer> {
  const s = supa();
  if (s) {
    const { data, error } = await s.storage.from(BUCKET).download(storedName);
    if (error || !data) throw new Error(error?.message || "download failed");
    return Buffer.from(await data.arrayBuffer());
  }
  return fs.readFile(path.join(localDir(), storedName));
}

export async function deleteFile(storedName: string) {
  const s = supa();
  if (s) { await s.storage.from(BUCKET).remove([storedName]); return; }
  await fs.rm(path.join(localDir(), storedName), { force: true });
}
