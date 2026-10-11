import { prisma } from "@/server/db";
import type { Actor, ChangedField } from "@/server/types";

export async function writeAudit(
  actor: Actor,
  entityType: string,
  entityId: string,
  action: string,
  changedFields?: ChangedField[] | null,
  comment?: string | null,
) {
  await prisma.auditLog.create({
    data: {
      entityType,
      entityId,
      action,
      actorUserId: actor.id,
      actorRole: actor.role,
      changedFields: changedFields && changedFields.length > 0 ? JSON.stringify(changedFields) : null,
      comment: comment ?? null,
    },
  });
}

export function fieldChanges(rows: ChangedField[]) {
  return rows.filter((row) => row.old !== row.new);
}
