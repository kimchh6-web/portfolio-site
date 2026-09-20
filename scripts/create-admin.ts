// 관리자 계정 생성/재설정:  npx tsx scripts/create-admin.ts <id> <password>
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const [username, password] = process.argv.slice(2);
if (!username || !password || password.length < 10) {
  console.error("사용법: npx tsx scripts/create-admin.ts <id> <password 10자 이상>");
  process.exit(1);
}
(async () => {
  const hash = await bcrypt.hash(password, 12);
  const existing = await prisma.adminUser.findFirst();
  if (existing) {
    await prisma.adminUser.update({ where: { id: existing.id }, data: { username, passwordHash: hash, failedCount: 0, lockedUntil: null } });
    console.log(`관리자 계정을 갱신했습니다: ${username}`);
  } else {
    await prisma.adminUser.create({ data: { username, passwordHash: hash } });
    console.log(`관리자 계정을 만들었습니다: ${username}`);
  }
  console.log("OTP는 로그인 후 /admin/settings 에서 켤 수 있습니다.");
  await prisma.$disconnect();
})();
