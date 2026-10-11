import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/server/db";
import type { Actor, Role } from "@/server/types";

export const SESSION_COOKIE = "zhiyi_session";
const MAX_AGE = 60 * 60 * 12;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error("SESSION_SECRET 缺失或过短。请复制 .env.example 为 .env。");
  }
  return new TextEncoder().encode(value);
}

export async function signSession(actor: Actor) {
  return new SignJWT({
    role: actor.role,
    loginName: actor.loginName,
    displayName: actor.displayName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(actor.id)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
}

export async function readSessionToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || typeof payload.role !== "string") return null;
    return { sub: payload.sub, role: payload.role as Role };
  } catch {
    return null;
  }
}

export async function getActor(): Promise<Actor | null> {
  const jar = await cookies();
  const session = await readSessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user || user.status !== "active") return null;
  return {
    id: user.id,
    loginName: user.loginName,
    displayName: user.displayName,
    role: user.role as Role,
    enterpriseId: user.enterpriseId,
    talentId: user.talentId,
  };
}

export async function requireActor() {
  const actor = await getActor();
  if (!actor) redirect("/login");
  return actor;
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
