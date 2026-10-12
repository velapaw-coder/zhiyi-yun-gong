import { Prisma } from "@prisma/client";
import { prisma, runWrite } from "@/server/db";
import { AppError } from "@/server/errors";
import { assertOps, canReadTask, deny } from "@/server/access";
import { writeAudit, fieldChanges } from "@/server/audit";
import { assertFilesAttachable } from "@/server/files";
import type { Actor, ChangedField } from "@/server/types";
import {
  MAX_LINKS,
  SUMMARY_MAX,
  SUMMARY_MIN,
  fromDatetimeLocalValue,
  makeCode,
  parseStringArray,
  qaItems,
} from "@/lib/format";
import { OPEN_TASK_STATUSES, TASK_STATUS } from "@/lib/labels";

const taskInclude = {
  enterprise: { select: { id: true, name: true, code: true } },
  position: {
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      status: true,
      deliveryStandard: true,
      qaRules: true,
      enterpriseId: true,
    },
  },
  assignee: {
    select: {
      id: true,
      name: true,
      code: true,
      disabilityCertNo: true,
      phone: true,
      status: true,
      trainingProgress: true,
      currentPositionId: true,
      eligiblePositionTypes: true,
    },
  },
  deliveries: {
    orderBy: { versionNo: "asc" as const },
    include: {
      files: { where: { deletedAt: null }, orderBy: { createdAt: "asc" as const } },
      submittedBy: { select: { displayName: true, role: true } },
      qaBy: { select: { displayName: true } },
    },
  },
  logs: {
    orderBy: { createdAt: "asc" as const },
    include: {
      actor: { select: { displayName: true } },
      relatedDelivery: { select: { id: true, versionNo: true } },
    },
  },
} satisfies Prisma.TaskInclude;

type TaskRow = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

function terminal(status: string) {
  return status === "accepted" || status === "cancelled";
}

async function nextTaskCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = makeCode("RW");
    const exists = await prisma.task.findUnique({ where: { code } });
    if (!exists) return code;
  }
  return `RW-${Date.now().toString(36).toUpperCase()}`;
}

export function assignmentBlockers(
  talent: {
    status: string;
    currentPositionId: string | null;
    trainingProgress: string;
    eligiblePositionTypes: string;
  },
  position: { id: string; type: string },
) {
  const reasons: string[] = [];
  if (talent.status === "inactive") reasons.push("人才已停用");
  if (talent.status !== "on_duty" || talent.currentPositionId !== position.id) {
    reasons.push("执行人不是该岗位的在岗人员");
  }
  if (talent.trainingProgress !== "graduated") reasons.push("培训未结业");
  const eligible = parseStringArray(talent.eligiblePositionTypes);
  if (!eligible.includes(position.type)) reasons.push("可上岗位类型不包含内容编排");
  return reasons;
}

async function loadRaw(id: string) {
  const task = await prisma.task.findUnique({ where: { id }, include: taskInclude });
  if (!task) throw new AppError("任务不存在", "NOT_FOUND");
  return task;
}

function present(actor: Actor, task: TaskRow) {
  const ops = actor.role === "ops";
  return {
    id: task.id,
    code: task.code,
    title: task.title,
    description: task.description,
    status: task.status,
    enterprise: task.enterprise,
    position: {
      id: task.position.id,
      name: task.position.name,
      code: task.position.code,
      type: task.position.type,
      status: task.position.status,
      deliveryStandard: task.position.deliveryStandard,
      qaRules: task.position.qaRules,
    },
    assignee: {
      id: task.assignee.id,
      name: task.assignee.name,
      code: task.assignee.code,
      cert: ops ? task.assignee.disabilityCertNo : null,
      phone: ops ? task.assignee.phone : null,
    },
    planStartAt: task.planStartAt.toISOString(),
    planEndAt: task.planEndAt.toISOString(),
    actualStartAt: task.actualStartAt?.toISOString() ?? null,
    actualEndAt: task.actualEndAt?.toISOString() ?? null,
    forceAssigned: ops ? task.forceAssigned : false,
    currentDeliveryId: task.currentDeliveryId,
    deliveries: task.deliveries.map((delivery) => ({
      id: delivery.id,
      versionNo: delivery.versionNo,
      summary: delivery.summary,
      links: parseStringArray(delivery.links),
      submittedAt: delivery.submittedAt.toISOString(),
      submittedBy: delivery.submittedBy.displayName,
      proxySubmit: delivery.proxySubmit,
      qaResult: delivery.qaResult,
      qaComment: delivery.qaComment,
      qaChecklist: delivery.qaChecklist ? parseStringArray(delivery.qaChecklist) : [],
      qaBy: delivery.qaBy?.displayName ?? null,
      qaAt: delivery.qaAt?.toISOString() ?? null,
      files: delivery.files.map((file) => ({
        id: file.id,
        name: file.originalName,
        size: file.size,
        mime: file.mime,
      })),
    })),
    logs: task.logs
      .filter((log) => ops || !log.internal)
      .map((log) => ({
        id: log.id,
        action: log.action,
        actorName: log.actor.displayName,
        actorRole: log.actorRole,
        fromStatus: log.fromStatus,
        toStatus: log.toStatus,
        comment: log.comment,
        internal: log.internal,
        createdAt: log.createdAt.toISOString(),
        deliveryVersion: log.relatedDelivery?.versionNo ?? null,
        changedFields: log.changedFields
          ? (JSON.parse(log.changedFields) as ChangedField[])
          : [],
      })),
  };
}

export async function getTask(actor: Actor, id: string) {
  const task = await loadRaw(id);
  if (!canReadTask(actor, task)) await deny(actor, `越权查看任务 ${task.code}`);
  return present(actor, task);
}

export async function listTasks(
  actor: Actor,
  filters: {
    q?: string;
    status?: string;
    enterpriseId?: string;
    overdue?: boolean;
    view?: string;
    skip: number;
    pageSize: number;
  },
) {
  const where: Prisma.TaskWhereInput = {};
  if (actor.role === "enterprise") {
    if (!actor.enterpriseId) return { rows: [], total: 0 };
    where.enterpriseId = actor.enterpriseId;
  } else if (actor.role === "worker") {
    if (!actor.talentId) return { rows: [], total: 0 };
    where.assigneeTalentId = actor.talentId;
  } else if (filters.enterpriseId) {
    where.enterpriseId = filters.enterpriseId;
  }
  if (filters.status && filters.status in TASK_STATUS) where.status = filters.status;
  if (filters.overdue) {
    where.planEndAt = { lt: new Date() };
    where.status = filters.status && filters.status in TASK_STATUS
      ? filters.status
      : { in: [...OPEN_TASK_STATUSES] };
  }
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q } },
      { code: { contains: filters.q } },
      { assignee: { name: { contains: filters.q } } },
    ];
  }
  const board = filters.view !== "list";
  const [rows, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        enterprise: { select: { name: true, code: true } },
        position: { select: { name: true } },
        assignee: { select: { name: true } },
      },
      orderBy: [{ planEndAt: "asc" }, { createdAt: "desc" }],
      skip: board ? 0 : filters.skip,
      take: board ? 200 : filters.pageSize,
    }),
    prisma.task.count({ where }),
  ]);
  return {
    rows: rows.map((task) => ({
      id: task.id,
      code: task.code,
      title: task.title,
      status: task.status,
      enterpriseName: task.enterprise.name,
      positionName: task.position.name,
      assigneeName: task.assignee.name,
      planEndAt: task.planEndAt.toISOString(),
      overdue: OPEN_TASK_STATUSES.includes(task.status as (typeof OPEN_TASK_STATUSES)[number]) && task.planEndAt < new Date(),
    })),
    total,
    truncated: board && total > rows.length,
  };
}

async function writeTaskLog(
  tx: Prisma.TransactionClient,
  input: {
    taskId: string;
    action: string;
    actor: Actor;
    fromStatus?: string | null;
    toStatus?: string | null;
    comment?: string | null;
    relatedDeliveryId?: string | null;
    changedFields?: ChangedField[];
    internal?: boolean;
    createdAt?: Date;
  },
) {
  await tx.taskAuditLog.create({
    data: {
      taskId: input.taskId,
      action: input.action,
      actorUserId: input.actor.id,
      actorRole: input.actor.role,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
      comment: input.comment ?? null,
      relatedDeliveryId: input.relatedDeliveryId ?? null,
      changedFields: input.changedFields && input.changedFields.length > 0 ? JSON.stringify(input.changedFields) : null,
      internal: input.internal ?? false,
      createdAt: input.createdAt,
    },
  });
}

export async function createTask(
  actor: Actor,
  input: {
    positionId: string;
    talentId: string;
    title: string;
    description: string;
    planStartAt: string;
    planEndAt: string;
    force: boolean;
  },
) {
  await assertOps(actor, "创建任务");
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title) throw new AppError("请填写任务标题");
  if (description.length < 10) throw new AppError("请填写任务要求（至少 10 字）");
  const planStartAt = fromDatetimeLocalValue(input.planStartAt);
  const planEndAt = fromDatetimeLocalValue(input.planEndAt);
  if (planEndAt < planStartAt) throw new AppError("计划截止不能早于计划开始");

  const position = await prisma.position.findUnique({ where: { id: input.positionId } });
  if (!position) throw new AppError("岗位不存在", "NOT_FOUND");
  if (position.status !== "active") throw new AppError("停用或草稿岗位不能新建任务");
  const talent = await prisma.talent.findUnique({ where: { id: input.talentId } });
  if (!talent) throw new AppError("执行人不存在", "NOT_FOUND");

  const blockers = assignmentBlockers(talent, position);
  const hard = blockers.filter((item) => item === "人才已停用");
  if (hard.length > 0) throw new AppError(hard.join("；"));
  if (blockers.length > 0 && !input.force) {
    throw new AppError(`${blockers.join("；")}。如需例外派发，请勾选强制派发。`);
  }
  if (blockers.length > 0 && actor.role !== "ops") await deny(actor, "非运营强制派发");

  const code = await nextTaskCode();
  const task = await runWrite(async (tx) => {
    const created = await tx.task.create({
      data: {
        code,
        enterpriseId: position.enterpriseId,
        positionId: position.id,
        assigneeTalentId: talent.id,
        title,
        description,
        planStartAt,
        planEndAt,
        status: "assigned",
        createdById: actor.id,
        forceAssigned: blockers.length > 0,
      },
    });
    await writeTaskLog(tx, {
      taskId: created.id,
      action: "create",
      actor,
      toStatus: "assigned",
      comment: "创建任务",
    });
    await writeTaskLog(tx, {
      taskId: created.id,
      action: "dispatch",
      actor,
      fromStatus: "assigned",
      toStatus: "assigned",
      comment: `派发给 ${talent.name}`,
      createdAt: new Date(Date.now() + 1),
    });
    if (blockers.length > 0) {
      await writeTaskLog(tx, {
        taskId: created.id,
        action: "internal_note",
        actor,
        comment: `强制派发：${blockers.join("；")}`,
        internal: true,
        createdAt: new Date(Date.now() + 2),
      });
    }
    return created;
  });
  await writeAudit(actor, "task", task.id, "create", null, task.code);
  return task;
}

async function assertWorkerOrOps(actor: Actor, task: { enterpriseId: string; assigneeTalentId: string }, detail: string) {
  if (actor.role === "ops") return;
  if (actor.role === "worker" && actor.talentId === task.assigneeTalentId) return;
  await deny(actor, detail);
}

export async function claimTask(actor: Actor, id: string) {
  const task = await loadRaw(id);
  await assertWorkerOrOps(actor, task, `领取任务 ${task.code}`);
  if (task.status !== "assigned") throw new AppError("只有已派发的任务可以领取");
  const proxy = actor.role === "ops";
  await runWrite(async (tx) => {
    await tx.task.update({
      where: { id },
      data: { status: "in_progress", actualStartAt: new Date() },
    });
    await writeTaskLog(tx, {
      taskId: id,
      action: "claim",
      actor,
      fromStatus: "assigned",
      toStatus: "in_progress",
      comment: proxy ? "【代领取】运营代执行人领取" : "领取任务",
    });
  });
}

function parseLinks(raw: string) {
  const links = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (links.length > MAX_LINKS) throw new AppError("链接最多 20 条");
  for (const link of links) {
    if (!/^https?:\/\//i.test(link)) throw new AppError(`链接需以 http:// 或 https:// 开头：${link}`);
    if (link.length > 500) throw new AppError("单条链接过长");
  }
  return links;
}

export async function submitTask(
  actor: Actor,
  id: string,
  input: { summary: string; links: string; fileIds: string[] },
) {
  const task = await loadRaw(id);
  await assertWorkerOrOps(actor, task, `提交任务 ${task.code}`);
  if (task.status !== "in_progress" && task.status !== "rework") {
    throw new AppError("当前状态不能提交交付");
  }
  const summary = input.summary.trim();
  if (summary.length < SUMMARY_MIN || summary.length > SUMMARY_MAX) {
    throw new AppError(`交付说明需在 ${SUMMARY_MIN} 到 ${SUMMARY_MAX} 字之间`);
  }
  const links = parseLinks(input.links);
  if (links.length === 0 && input.fileIds.length === 0) {
    throw new AppError("请至少上传一个附件，或填写一个链接");
  }
  await assertFilesAttachable(actor, input.fileIds);
  const proxy = actor.role === "ops";
  const versionNo = (task.deliveries.at(-1)?.versionNo ?? 0) + 1;

  await runWrite(async (tx) => {
    const delivery = await tx.deliveryVersion.create({
      data: {
        taskId: id,
        versionNo,
        summary,
        links: JSON.stringify(links),
        submittedById: actor.id,
        proxySubmit: proxy,
        qaResult: "pending",
      },
    });
    if (input.fileIds.length > 0) {
      await tx.fileAsset.updateMany({
        where: { id: { in: input.fileIds } },
        data: { deliveryId: delivery.id, taskId: id, enterpriseId: task.enterpriseId },
      });
    }
    await tx.task.update({
      where: { id },
      data: { status: "submitted", currentDeliveryId: delivery.id },
    });
    await writeTaskLog(tx, {
      taskId: id,
      action: "submit",
      actor,
      fromStatus: task.status,
      toStatus: "submitted",
      relatedDeliveryId: delivery.id,
      comment: proxy ? `【代提交】运营代执行人提交交付 v${versionNo}` : `提交交付 v${versionNo}`,
    });
  });
}

export async function rejectTask(
  actor: Actor,
  id: string,
  input: { comment: string; checked: string[] },
) {
  await assertOps(actor, `质检退回 ${id}`);
  const task = await loadRaw(id);
  if (task.status !== "submitted") throw new AppError("只有已提交的任务可以质检");
  const comment = input.comment.trim();
  if (comment.length < 2) throw new AppError("质检不通过时，意见必填");
  const delivery = task.deliveries.at(-1);
  if (!delivery) throw new AppError("没有可质检的交付版本");
  await runWrite(async (tx) => {
    await tx.deliveryVersion.update({
      where: { id: delivery.id },
      data: {
        qaResult: "failed",
        qaComment: comment,
        qaChecklist: JSON.stringify(input.checked),
        qaById: actor.id,
        qaAt: new Date(),
      },
    });
    await tx.task.update({ where: { id }, data: { status: "rework" } });
    await writeTaskLog(tx, {
      taskId: id,
      action: "qa_fail",
      actor,
      fromStatus: "submitted",
      toStatus: "rework",
      relatedDeliveryId: delivery.id,
      comment,
    });
  });
}

export async function acceptTask(
  actor: Actor,
  id: string,
  input: { comment: string; checked: string[] },
) {
  await assertOps(actor, `质检验收 ${id}`);
  const task = await loadRaw(id);
  if (task.status !== "submitted") throw new AppError("只有已提交的任务可以质检并验收");
  const delivery = task.deliveries.at(-1);
  if (!delivery) throw new AppError("没有可验收的交付版本");
  const comment = input.comment.trim();
  const now = new Date();
  await runWrite(async (tx) => {
    await tx.deliveryVersion.update({
      where: { id: delivery.id },
      data: {
        qaResult: "passed",
        qaComment: comment || null,
        qaChecklist: JSON.stringify(input.checked),
        qaById: actor.id,
        qaAt: now,
      },
    });
    await tx.task.update({
      where: { id },
      data: { status: "accepted", actualEndAt: new Date(now.getTime() + 1000) },
    });
    // Q2：质检与验收合并为一步操作，日志拆成两条。
    await writeTaskLog(tx, {
      taskId: id,
      action: "qa_pass",
      actor,
      fromStatus: "submitted",
      toStatus: "submitted",
      relatedDeliveryId: delivery.id,
      comment: comment ? `质检通过。${comment}` : "质检通过",
      createdAt: now,
    });
    await writeTaskLog(tx, {
      taskId: id,
      action: "accept",
      actor,
      fromStatus: "submitted",
      toStatus: "accepted",
      relatedDeliveryId: delivery.id,
      comment: "验收通过（质检并验收）",
      createdAt: new Date(now.getTime() + 1000),
    });
  });
}

export async function cancelTask(actor: Actor, id: string, comment: string) {
  await assertOps(actor, `取消任务 ${id}`);
  const task = await loadRaw(id);
  if (terminal(task.status)) throw new AppError("已验收或已取消的任务不能再变更");
  const note = comment.trim();
  if (note.length < 2) throw new AppError("取消任务时备注必填");
  await runWrite(async (tx) => {
    await tx.task.update({ where: { id }, data: { status: "cancelled" } });
    await writeTaskLog(tx, {
      taskId: id,
      action: "cancel",
      actor,
      fromStatus: task.status,
      toStatus: "cancelled",
      comment: note,
    });
  });
}

export async function reassignTask(actor: Actor, id: string, talentId: string, force: boolean) {
  await assertOps(actor, `改派任务 ${id}`);
  const task = await loadRaw(id);
  if (terminal(task.status)) throw new AppError("终态任务不能改派，请复制为新任务");
  if (task.assigneeTalentId === talentId) throw new AppError("执行人没有变化");
  const talent = await prisma.talent.findUnique({ where: { id: talentId } });
  if (!talent) throw new AppError("执行人不存在", "NOT_FOUND");
  const position = await prisma.position.findUniqueOrThrow({ where: { id: task.positionId } });
  const blockers = assignmentBlockers(talent, position);
  if (blockers.includes("人才已停用")) throw new AppError("不能改派给已停用人才");
  const soft = blockers.filter((item) => item !== "人才已停用");
  if (soft.length > 0 && !force) throw new AppError(`${soft.join("；")}。如需例外改派，请勾选强制派发。`);
  await runWrite(async (tx) => {
    await tx.task.update({
      where: { id },
      data: { assigneeTalentId: talent.id, forceAssigned: soft.length > 0 || task.forceAssigned },
    });
    await writeTaskLog(tx, {
      taskId: id,
      action: "reassign",
      actor,
      fromStatus: task.status,
      toStatus: task.status,
      changedFields: [{ field: "执行人", old: task.assignee.name, new: talent.name }],
      comment: `改派给 ${talent.name}`,
    });
    if (soft.length > 0) {
      await writeTaskLog(tx, {
        taskId: id,
        action: "internal_note",
        actor,
        comment: `强制改派：${soft.join("；")}`,
        internal: true,
        createdAt: new Date(Date.now() + 1),
      });
    }
  });
}

export async function editTask(
  actor: Actor,
  id: string,
  input: { title: string; description: string; planStartAt: string; planEndAt: string },
) {
  await assertOps(actor, `编辑任务 ${id}`);
  const task = await loadRaw(id);
  if (terminal(task.status)) throw new AppError("终态任务不能修改，请复制为新任务");
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title) throw new AppError("请填写任务标题");
  if (description.length < 10) throw new AppError("请填写任务要求（至少 10 字）");
  const planStartAt = fromDatetimeLocalValue(input.planStartAt);
  const planEndAt = fromDatetimeLocalValue(input.planEndAt);
  if (planEndAt < planStartAt) throw new AppError("计划截止不能早于计划开始");
  const changes = fieldChanges([
    { field: "标题", old: task.title, new: title },
    { field: "要求", old: task.description, new: description },
    { field: "计划开始", old: task.planStartAt.toISOString(), new: planStartAt.toISOString() },
    { field: "计划截止", old: task.planEndAt.toISOString(), new: planEndAt.toISOString() },
  ]);
  if (changes.length === 0) return;
  await runWrite(async (tx) => {
    await tx.task.update({
      where: { id },
      data: { title, description, planStartAt, planEndAt },
    });
    await writeTaskLog(tx, {
      taskId: id,
      action: "edit",
      actor,
      fromStatus: task.status,
      toStatus: task.status,
      changedFields: changes,
      comment: "编辑任务字段",
    });
  });
  await writeAudit(actor, "task", id, "update", changes);
}

export async function copyTask(actor: Actor, id: string) {
  await assertOps(actor, `复制任务 ${id}`);
  const task = await loadRaw(id);
  if (!terminal(task.status)) throw new AppError("只有已验收或已取消的任务可以复制为新任务");
  const position = await prisma.position.findUnique({ where: { id: task.positionId } });
  if (!position || position.status !== "active") throw new AppError("原岗位未启用，不能复制任务");
  const start = new Date();
  const end = new Date(start.getTime() + 7 * 24 * 3600 * 1000);
  const code = await nextTaskCode();
  const created = await runWrite(async (tx) => {
    const copy = await tx.task.create({
      data: {
        code,
        enterpriseId: task.enterpriseId,
        positionId: task.positionId,
        assigneeTalentId: task.assigneeTalentId,
        title: task.title.startsWith("复制：") ? task.title : `复制：${task.title}`,
        description: task.description,
        planStartAt: start,
        planEndAt: end,
        status: "assigned",
        createdById: actor.id,
        forceAssigned: false,
      },
    });
    await writeTaskLog(tx, {
      taskId: copy.id,
      action: "copy",
      actor,
      toStatus: "assigned",
      comment: `复制自 ${task.code}`,
    });
    await writeTaskLog(tx, {
      taskId: copy.id,
      action: "dispatch",
      actor,
      fromStatus: "assigned",
      toStatus: "assigned",
      comment: `派发给 ${task.assignee.name}`,
      createdAt: new Date(Date.now() + 1),
    });
    return copy;
  });
  return created;
}

export async function addInternalNote(actor: Actor, id: string, comment: string) {
  await assertOps(actor, `内部备注 ${id}`);
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError("任务不存在", "NOT_FOUND");
  const note = comment.trim();
  if (note.length < 2) throw new AppError("请填写内部备注");
  await prisma.taskAuditLog.create({
    data: {
      taskId: id,
      action: "internal_note",
      actorUserId: actor.id,
      actorRole: actor.role,
      comment: note,
      internal: true,
    },
  });
}

export async function taskFormOptions(actor: Actor) {
  await assertOps(actor, "读取派单选项");
  const enterprises = await prisma.enterprise.findMany({
    where: { status: { not: "terminated" } },
    select: {
      id: true,
      name: true,
      code: true,
      positions: {
        where: { status: "active" },
        select: { id: true, name: true, code: true, enterpriseId: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
  const talents = await prisma.talent.findMany({
    where: { status: { not: "inactive" } },
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
      trainingProgress: true,
      currentPositionId: true,
      currentEnterpriseId: true,
    },
    orderBy: { name: "asc" },
  });
  return { enterprises, talents };
}

export async function reassignOptions(actor: Actor) {
  await assertOps(actor, "读取改派名单");
  return prisma.talent.findMany({
    where: { status: { not: "inactive" } },
    select: { id: true, name: true, code: true, status: true, currentPositionId: true },
    orderBy: { name: "asc" },
  });
}

export { qaItems };
