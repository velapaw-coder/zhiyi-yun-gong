import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/server/db";
import { setSessionCookie, signSession } from "@/server/session";
import type { Role } from "@/server/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { loginName?: string; password?: string } | null;
  const loginName = String(body?.loginName ?? "").trim();
  const password = String(body?.password ?? "");
  const user = loginName ? await prisma.user.findUnique({ where: { loginName } }) : null;
  const ok = Boolean(user && user.status === "active" && (await compare(password, user.passwordHash)));
  await prisma.loginLog.create({
    data: {
      userId: user?.id,
      loginName: loginName || "(empty)",
      success: ok,
      detail: ok ? null : "账号或密码错误，或账号已停用",
    },
  });
  if (!ok || !user) {
    return NextResponse.json({ error: "账号或密码错误，或账号已停用" }, { status: 401 });
  }
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const token = await signSession({
    id: user.id,
    loginName: user.loginName,
    displayName: user.displayName,
    role: user.role as Role,
    enterpriseId: user.enterpriseId,
    talentId: user.talentId,
  });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true, role: user.role });
}
