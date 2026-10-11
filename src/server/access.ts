import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import type { Actor } from "@/server/types";

export async function deny(actor: Actor | null, detail: string): Promise<never> {
  await prisma.securityLog.create({
    data: {
      actorUserId: actor?.id ?? null,
      action: "forbidden",
      detail,
    },
  });
  throw new AppError("无权访问", "FORBIDDEN");
}

export async function assertOps(actor: Actor, detail: string) {
  if (actor.role !== "ops") await deny(actor, detail);
}

export function canReadEnterprise(actor: Actor, enterpriseId: string) {
  if (actor.role === "ops") return true;
  if (actor.role === "enterprise") return actor.enterpriseId === enterpriseId;
  return false;
}

export function canReadTask(
  actor: Actor,
  task: { enterpriseId: string; assigneeTalentId: string },
) {
  if (actor.role === "ops") return true;
  if (actor.role === "enterprise") return actor.enterpriseId === task.enterpriseId;
  if (actor.role === "worker") return Boolean(actor.talentId) && actor.talentId === task.assigneeTalentId;
  return false;
}
