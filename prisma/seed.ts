import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { hash } from "bcryptjs";
import { prisma } from "../src/server/db";
import { minimalPdf, uploadRoot } from "../src/server/files";
import { buildBillDraft, addAdjustment, issueBill, updateInvoice, updatePayment } from "../src/server/billing";
import type { Actor } from "../src/server/types";

const PASSWORD = "Zhiyi#2026";
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6nAAAAAElFTkSuQmCC",
  "base64",
);

let fileSeq = 0;

async function saveNamed(name: string, body: Buffer, mime: string) {
  fileSeq += 1;
  const ext = mime === "image/png" ? "png" : "pdf";
  const slug = name.replace(/[^\w.\-]+/g, "_").replace(/_+/g, "_").slice(0, 40);
  const storageKey = `${String(fileSeq).padStart(2, "0")}-${slug}-${body.length}.${ext}`;
  await writeFile(path.join(uploadRoot(), storageKey), body);
  return { storageKey, size: body.length, mime, originalName: name };
}

async function main() {
  await rm(uploadRoot(), { recursive: true, force: true });
  await mkdir(uploadRoot(), { recursive: true });

  await prisma.taskAuditLog.deleteMany();
  await prisma.fileAsset.deleteMany();
  await prisma.deliveryVersion.deleteMany();
  await prisma.billLineItem.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.complianceLedger.deleteMany();
  await prisma.task.deleteMany();
  await prisma.loginLog.deleteMany();
  await prisma.securityLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.talent.deleteMany();
  await prisma.position.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.enterprise.deleteMany();

  const passwordHash = await hash(PASSWORD, 10);
  const at = (value: string) => new Date(value);

  await prisma.enterprise.create({
    data: {
      id: "ent_a",
      code: "ZY-A",
      name: "样例制造 A",
      industry: "制造",
      scaleHeadcount: 860,
      contactName: "王敏",
      contactPhone: "13800001001",
      contactEmail: "wangmin@example.com",
      status: "signed",
      remark: "首单试跑客户。在职约 860 人，残保金口径以财务提供的上年工资总额为准，详见方案备注。",
    },
  });
  await prisma.enterprise.create({
    data: {
      id: "ent_b",
      code: "ZY-B",
      name: "瀚海跨境",
      industry: "电商外贸",
      scaleHeadcount: 240,
      contactName: "李航",
      contactPhone: "13800001002",
      contactEmail: "lihang@example.com",
      status: "signed",
      remark: "对照企业，用来演示企业之间的数据隔离。",
    },
  });

  await prisma.plan.create({
    data: {
      id: "plan_a",
      code: "FA-A1",
      enterpriseId: "ent_a",
      planVersion: "V1 / 2026Q4",
      disabilityFundBase: 128_000_000,
      disabilityFundGap: 48_600_000,
      monthlyServiceFee: 3_600_000,
      startDate: at("2026-10-01T00:00:00+08:00"),
      endDate: at("2027-09-30T00:00:00+08:00"),
      signStatus: "executing",
      productLine: "compliance_single_position",
      remark: "手工测算：若按现行残保金口径全额缴纳，试跑月服务费约为原支出的三成左右。自动测算引擎本期不做（Q8）。",
    },
  });
  await prisma.plan.create({
    data: {
      id: "plan_b",
      code: "FA-B1",
      enterpriseId: "ent_b",
      planVersion: "V1 / 2026Q4",
      disabilityFundBase: 36_000_000,
      disabilityFundGap: 9_600_000,
      monthlyServiceFee: 1_200_000,
      startDate: at("2026-09-01T00:00:00+08:00"),
      endDate: at("2027-08-31T00:00:00+08:00"),
      signStatus: "signed",
      productLine: "compliance_single_position",
      remark: "按人月结算的对照方案。",
    },
  });

  await prisma.position.create({
    data: {
      id: "pos_a",
      code: "GW-A1",
      enterpriseId: "ent_a",
      planId: "plan_a",
      name: "AI 内容编排助理",
      type: "AI_CONTENT_OPS",
      headcount: 2,
      deliveryStandard: "每周不少于 8 条商品或活动内容；标题、卖点、关键词字段完整率不低于 95%；按条计量验收。",
      qaRules: "条数达到任务要求\n标题与卖点无事实错误\n关键词字段完整\n语气符合品牌调性\n无敏感与违规表述",
      unitPrice: 18_000,
      settlementCycle: "per_piece",
      status: "active",
    },
  });
  await prisma.position.create({
    data: {
      id: "pos_b",
      code: "GW-B1",
      enterpriseId: "ent_b",
      planId: "plan_b",
      name: "AI 内容编排助理",
      type: "AI_CONTENT_OPS",
      headcount: 1,
      deliveryStandard: "每月维护独立站首页与活动页文案，按在岗人月结算。",
      qaRules: "页面三屏文案齐全\n卖点与素材一致\n无错别字",
      unitPrice: 650_000,
      settlementCycle: "per_headcount_month",
      status: "active",
    },
  });

  const talents = [
    {
      id: "talent_lin",
      code: "RC-LIN",
      name: "林晓",
      disabilityCertNo: "沪残联2020-104218",
      disabilityType: "肢体",
      disabilityLevel: "三级",
      phone: "13800002001",
      skillTags: JSON.stringify(["文案", "电商详情页"]),
      trainingProgress: "graduated",
      trainingPercent: 100,
      status: "on_duty",
      currentEnterpriseId: "ent_a",
      currentPositionId: "pos_a",
    },
    {
      id: "talent_zhao",
      code: "RC-ZHAO",
      name: "赵敏",
      disabilityCertNo: "沪残联2018-228813",
      disabilityType: "听力",
      disabilityLevel: "二级",
      phone: "13800002002",
      skillTags: JSON.stringify(["活动文案", "表格"]),
      trainingProgress: "graduated",
      trainingPercent: 100,
      status: "on_duty",
      currentEnterpriseId: "ent_a",
      currentPositionId: "pos_a",
    },
    {
      id: "talent_zhou",
      code: "RC-ZHOU",
      name: "周宁",
      disabilityCertNo: "沪残联2022-330146",
      disabilityType: "视力",
      disabilityLevel: "四级",
      phone: "13800002003",
      skillTags: JSON.stringify(["校对"]),
      trainingProgress: "in_progress",
      trainingPercent: 60,
      status: "eligible",
      currentEnterpriseId: null,
      currentPositionId: null,
    },
    {
      id: "talent_chen",
      code: "RC-CHEN",
      name: "陈远",
      disabilityCertNo: "浙残联2019-118802",
      disabilityType: "肢体",
      disabilityLevel: "二级",
      phone: "13800002004",
      skillTags: JSON.stringify(["独立站文案"]),
      trainingProgress: "graduated",
      trainingPercent: 100,
      status: "on_duty",
      currentEnterpriseId: "ent_b",
      currentPositionId: "pos_b",
    },
  ];
  await prisma.talent.createMany({ data: talents });

  await prisma.user.createMany({
    data: [
      { id: "user_ops", loginName: "yunying", passwordHash, displayName: "陈运营", role: "ops", status: "active" },
      {
        id: "user_ent_a",
        loginName: "qiye.zhizao",
        passwordHash,
        displayName: "王敏",
        role: "enterprise",
        enterpriseId: "ent_a",
        status: "active",
      },
      {
        id: "user_ent_b",
        loginName: "qiye.kuajing",
        passwordHash,
        displayName: "李航",
        role: "enterprise",
        enterpriseId: "ent_b",
        status: "active",
      },
      {
        id: "user_lin",
        loginName: "lin.xiao",
        passwordHash,
        displayName: "林晓",
        role: "worker",
        talentId: "talent_lin",
        status: "active",
      },
      {
        id: "user_zhao",
        loginName: "zhao.min",
        passwordHash,
        displayName: "赵敏",
        role: "worker",
        talentId: "talent_zhao",
        status: "active",
      },
      {
        id: "user_chen",
        loginName: "chen.yuan",
        passwordHash,
        displayName: "陈远",
        role: "worker",
        talentId: "talent_chen",
        status: "active",
      },
    ],
  });

  async function fileFor(input: {
    name: string;
    body: Buffer;
    mime: string;
    uploaderId: string;
    enterpriseId: string;
    taskId?: string;
    deliveryId?: string;
    ledgerId?: string;
    ledgerSlot?: string;
    planId?: string;
  }) {
    const stored = await saveNamed(input.name, input.body, input.mime);
    return prisma.fileAsset.create({
      data: {
        originalName: input.name,
        mime: stored.mime,
        size: stored.size,
        storageKey: stored.storageKey,
        uploaderId: input.uploaderId,
        enterpriseId: input.enterpriseId,
        taskId: input.taskId,
        deliveryId: input.deliveryId,
        ledgerId: input.ledgerId,
        ledgerSlot: input.ledgerSlot,
        planId: input.planId,
      },
    });
  }

  const tasks = [
    {
      id: "task_1001",
      code: "RW-1001",
      enterpriseId: "ent_a",
      positionId: "pos_a",
      assigneeTalentId: "talent_lin",
      title: "秋季工装系列 8 条详情页文案",
      description: "覆盖冲锋衣、工装裤等 8 个 SKU。每条包含标题、三段卖点、关键词。周五前给到市场部。",
      planStartAt: at("2026-10-06T09:00:00+08:00"),
      planEndAt: at("2026-10-10T18:00:00+08:00"),
      actualStartAt: at("2026-10-06T10:24:00+08:00"),
      actualEndAt: at("2026-10-08T14:02:05+08:00"),
      status: "accepted",
      currentDeliveryId: "del_1001_v2",
      createdById: "user_ops",
    },
    {
      id: "task_1002",
      code: "RW-1002",
      enterpriseId: "ent_a",
      positionId: "pos_a",
      assigneeTalentId: "talent_lin",
      title: "会员日预热短内容 6 条",
      description: "会员日预热：6 条短内容，含标题和一条行动号召，链接放共享文档。",
      planStartAt: at("2026-10-09T09:00:00+08:00"),
      planEndAt: at("2026-10-13T18:00:00+08:00"),
      actualStartAt: at("2026-10-09T09:40:00+08:00"),
      actualEndAt: null,
      status: "submitted",
      currentDeliveryId: "del_1002_v1",
      createdById: "user_ops",
    },
    {
      id: "task_1003",
      code: "RW-1003",
      enterpriseId: "ent_a",
      positionId: "pos_a",
      assigneeTalentId: "talent_zhao",
      title: "新品上架标题与五点描述 10 条",
      description: "10 个新品，每条标题加五点描述，字段完整率按岗位标准。",
      planStartAt: at("2026-10-10T09:00:00+08:00"),
      planEndAt: at("2026-10-15T18:00:00+08:00"),
      actualStartAt: at("2026-10-10T11:00:00+08:00"),
      actualEndAt: null,
      status: "in_progress",
      currentDeliveryId: null,
      createdById: "user_ops",
    },
    {
      id: "task_1004",
      code: "RW-1004",
      enterpriseId: "ent_a",
      positionId: "pos_a",
      assigneeTalentId: "talent_zhao",
      title: "渠道活动 banner 文案 4 条",
      description: "四个渠道活动 banner，每条主标题、副标题和按钮文案。",
      planStartAt: at("2026-10-08T09:00:00+08:00"),
      planEndAt: at("2026-10-12T18:00:00+08:00"),
      actualStartAt: at("2026-10-08T09:30:00+08:00"),
      actualEndAt: null,
      status: "rework",
      currentDeliveryId: "del_1004_v1",
      createdById: "user_ops",
    },
    {
      id: "task_1005",
      code: "RW-1005",
      enterpriseId: "ent_a",
      positionId: "pos_a",
      assigneeTalentId: "talent_lin",
      title: "周报素材整理 5 条",
      description: "整理本周可复用的 5 条素材说明，交给内容负责人。",
      planStartAt: at("2026-10-11T09:00:00+08:00"),
      planEndAt: at("2026-10-14T18:00:00+08:00"),
      actualStartAt: null,
      actualEndAt: null,
      status: "assigned",
      currentDeliveryId: null,
      createdById: "user_ops",
    },
    {
      id: "task_1006",
      code: "RW-1006",
      enterpriseId: "ent_a",
      positionId: "pos_a",
      assigneeTalentId: "talent_zhao",
      title: "社群日更文案 7 条",
      description: "社群日更 7 条，已过计划截止，仍待领取。",
      planStartAt: at("2026-10-07T09:00:00+08:00"),
      planEndAt: at("2026-10-09T18:00:00+08:00"),
      actualStartAt: null,
      actualEndAt: null,
      status: "assigned",
      currentDeliveryId: null,
      createdById: "user_ops",
    },
    {
      id: "task_1007",
      code: "RW-1007",
      enterpriseId: "ent_a",
      positionId: "pos_a",
      assigneeTalentId: "talent_lin",
      title: "作废：重复派发的测试任务",
      description: "与 RW-1005 重复，取消留痕。",
      planStartAt: at("2026-10-11T09:00:00+08:00"),
      planEndAt: at("2026-10-12T18:00:00+08:00"),
      actualStartAt: null,
      actualEndAt: null,
      status: "cancelled",
      currentDeliveryId: null,
      createdById: "user_ops",
    },
    {
      id: "task_1008",
      code: "RW-1008",
      enterpriseId: "ent_b",
      positionId: "pos_b",
      assigneeTalentId: "talent_chen",
      title: "独立站首页三屏文案",
      description: "首页首屏、卖点屏、信任屏各一版文案。",
      planStartAt: at("2026-10-03T09:00:00+08:00"),
      planEndAt: at("2026-10-08T18:00:00+08:00"),
      actualStartAt: at("2026-10-03T10:00:00+08:00"),
      actualEndAt: at("2026-10-07T16:00:00+08:00"),
      status: "accepted",
      currentDeliveryId: "del_1008_v1",
      createdById: "user_ops",
    },
    {
      id: "task_1009",
      code: "RW-1009",
      enterpriseId: "ent_a",
      positionId: "pos_a",
      assigneeTalentId: "talent_zhou",
      title: "试跑：培训未结业的校对任务",
      description: "例外派发，用于演示强制派发留痕。周宁尚未结业、也未上岗。",
      planStartAt: at("2026-10-11T09:00:00+08:00"),
      planEndAt: at("2026-10-16T18:00:00+08:00"),
      actualStartAt: null,
      actualEndAt: null,
      status: "assigned",
      currentDeliveryId: null,
      createdById: "user_ops",
      forceAssigned: true,
    },
  ];
  await prisma.task.createMany({ data: tasks });

  await prisma.deliveryVersion.createMany({
    data: [
      {
        id: "del_1001_v1",
        taskId: "task_1001",
        versionNo: 1,
        summary: "已完成 8 条秋季工装详情页文案，覆盖冲锋衣和工装裤。卖点按面料、版型、场景三段撰写，关键词已填入表格。",
        links: JSON.stringify(["https://example.com/zhiyi/rw-1001-v1"]),
        submittedById: "user_lin",
        submittedAt: at("2026-10-07T15:06:00+08:00"),
        qaResult: "failed",
        qaComment: "第 3 条「防风工装裤」卖点缺少尺码对照，关键词未覆盖「耐磨」。请补齐后重提。",
        qaChecklist: JSON.stringify(["条数达到任务要求", "语气符合品牌调性"]),
        qaById: "user_ops",
        qaAt: at("2026-10-07T16:40:00+08:00"),
      },
      {
        id: "del_1001_v2",
        taskId: "task_1001",
        versionNo: 2,
        summary: "已按质检意见修订第 3 条，补充尺码对照，并补上耐磨、多口袋等关键词。8 条均已复核字段完整率。",
        links: JSON.stringify(["https://example.com/zhiyi/rw-1001-v2"]),
        submittedById: "user_lin",
        submittedAt: at("2026-10-08T11:18:00+08:00"),
        qaResult: "passed",
        qaComment: "尺码对照和关键词已补齐，可以验收。",
        qaChecklist: JSON.stringify(["条数达到任务要求", "标题与卖点无事实错误", "关键词字段完整", "语气符合品牌调性", "无敏感与违规表述"]),
        qaById: "user_ops",
        qaAt: at("2026-10-08T14:02:00+08:00"),
      },
      {
        id: "del_1002_v1",
        taskId: "task_1002",
        versionNo: 1,
        summary: "会员日预热 6 条短内容已写完，每条含标题和行动号召，正文放在共享文档第二页。",
        links: JSON.stringify(["https://example.com/zhiyi/rw-1002"]),
        submittedById: "user_lin",
        submittedAt: at("2026-10-10T17:20:00+08:00"),
        qaResult: "pending",
      },
      {
        id: "del_1004_v1",
        taskId: "task_1004",
        versionNo: 1,
        summary: "四个渠道的 banner 主副标题已出，按钮文案统一用「立即查看」。",
        links: JSON.stringify(["https://example.com/zhiyi/rw-1004"]),
        submittedById: "user_zhao",
        submittedAt: at("2026-10-09T15:10:00+08:00"),
        qaResult: "failed",
        qaComment: "渠道 B 的副标题超过版位字数，按钮和主标题抢语气。请按版位重写后再交。",
        qaById: "user_ops",
        qaAt: at("2026-10-09T18:05:00+08:00"),
      },
      {
        id: "del_1008_v1",
        taskId: "task_1008",
        versionNo: 1,
        summary: "独立站首页三屏文案已按品牌语气写完，卖点与现有素材一致。",
        links: JSON.stringify(["https://example.com/zhiyi/rw-1008"]),
        submittedById: "user_chen",
        submittedAt: at("2026-10-07T11:00:00+08:00"),
        qaResult: "passed",
        qaComment: "三屏齐全，验收通过。",
        qaById: "user_ops",
        qaAt: at("2026-10-07T16:00:00+08:00"),
      },
    ],
  });

  await fileFor({
    name: "林晓-秋季工装文案-v1.pdf",
    body: minimalPdf("RW-1001 version 1 draft"),
    mime: "application/pdf",
    uploaderId: "user_lin",
    enterpriseId: "ent_a",
    taskId: "task_1001",
    deliveryId: "del_1001_v1",
  });
  await fileFor({
    name: "林晓-秋季工装文案-v2.pdf",
    body: minimalPdf("RW-1001 version 2 revised"),
    mime: "application/pdf",
    uploaderId: "user_lin",
    enterpriseId: "ent_a",
    taskId: "task_1001",
    deliveryId: "del_1001_v2",
  });
  await fileFor({
    name: "交付截图.png",
    body: PNG,
    mime: "image/png",
    uploaderId: "user_lin",
    enterpriseId: "ent_a",
    taskId: "task_1001",
    deliveryId: "del_1001_v2",
  });
  await fileFor({
    name: "样例制造-成本测算说明.pdf",
    body: minimalPdf("Manual cost note for plan FA-A1"),
    mime: "application/pdf",
    uploaderId: "user_ops",
    enterpriseId: "ent_a",
    planId: "plan_a",
  });

  const log = (
    id: string,
    taskId: string,
    action: string,
    createdAt: string,
    extra: {
      actorUserId?: string;
      actorRole?: string;
      fromStatus?: string;
      toStatus?: string;
      comment?: string;
      relatedDeliveryId?: string;
      changedFields?: unknown;
      internal?: boolean;
    } = {},
  ) =>
    prisma.taskAuditLog.create({
      data: {
        id,
        taskId,
        action,
        actorUserId: extra.actorUserId ?? "user_ops",
        actorRole: extra.actorRole ?? "ops",
        fromStatus: extra.fromStatus,
        toStatus: extra.toStatus,
        comment: extra.comment,
        relatedDeliveryId: extra.relatedDeliveryId,
        changedFields: extra.changedFields ? JSON.stringify(extra.changedFields) : null,
        internal: extra.internal ?? false,
        createdAt: at(createdAt),
      },
    });

  await log("log_1001_1", "task_1001", "create", "2026-10-06T09:10:00+08:00", { toStatus: "assigned", comment: "创建任务" });
  await log("log_1001_2", "task_1001", "dispatch", "2026-10-06T09:10:01+08:00", {
    fromStatus: "assigned",
    toStatus: "assigned",
    comment: "派发给 林晓",
  });
  await log("log_1001_3", "task_1001", "claim", "2026-10-06T10:24:00+08:00", {
    actorUserId: "user_lin",
    actorRole: "worker",
    fromStatus: "assigned",
    toStatus: "in_progress",
    comment: "领取任务",
  });
  await log("log_1001_4", "task_1001", "submit", "2026-10-07T15:06:00+08:00", {
    actorUserId: "user_lin",
    actorRole: "worker",
    fromStatus: "in_progress",
    toStatus: "submitted",
    relatedDeliveryId: "del_1001_v1",
    comment: "提交交付 v1",
  });
  await log("log_1001_5", "task_1001", "qa_fail", "2026-10-07T16:40:00+08:00", {
    fromStatus: "submitted",
    toStatus: "rework",
    relatedDeliveryId: "del_1001_v1",
    comment: "第 3 条「防风工装裤」卖点缺少尺码对照，关键词未覆盖「耐磨」。请补齐后重提。",
  });
  await log("log_1001_6", "task_1001", "submit", "2026-10-08T11:18:00+08:00", {
    actorUserId: "user_lin",
    actorRole: "worker",
    fromStatus: "rework",
    toStatus: "submitted",
    relatedDeliveryId: "del_1001_v2",
    comment: "提交交付 v2",
  });
  await log("log_1001_7", "task_1001", "qa_pass", "2026-10-08T14:02:00+08:00", {
    fromStatus: "submitted",
    toStatus: "submitted",
    relatedDeliveryId: "del_1001_v2",
    comment: "质检通过。尺码对照和关键词已补齐，可以验收。",
  });
  await log("log_1001_8", "task_1001", "accept", "2026-10-08T14:02:05+08:00", {
    fromStatus: "submitted",
    toStatus: "accepted",
    relatedDeliveryId: "del_1001_v2",
    comment: "验收通过（质检并验收）",
  });
  await log("log_1001_9", "task_1001", "internal_note", "2026-10-08T14:10:00+08:00", {
    comment: "客户对接人王敏要求周五前给到市场部，不要写进对企业可见的时间线。",
    internal: true,
  });

  await log("log_1002_1", "task_1002", "create", "2026-10-09T09:00:00+08:00", { toStatus: "assigned", comment: "创建任务" });
  await log("log_1002_2", "task_1002", "dispatch", "2026-10-09T09:00:01+08:00", { fromStatus: "assigned", toStatus: "assigned", comment: "派发给 林晓" });
  await log("log_1002_3", "task_1002", "claim", "2026-10-09T09:40:00+08:00", {
    actorUserId: "user_lin",
    actorRole: "worker",
    fromStatus: "assigned",
    toStatus: "in_progress",
    comment: "领取任务",
  });
  await log("log_1002_4", "task_1002", "submit", "2026-10-10T17:20:00+08:00", {
    actorUserId: "user_lin",
    actorRole: "worker",
    fromStatus: "in_progress",
    toStatus: "submitted",
    relatedDeliveryId: "del_1002_v1",
    comment: "提交交付 v1",
  });

  await log("log_1003_1", "task_1003", "create", "2026-10-10T09:00:00+08:00", { toStatus: "assigned", comment: "创建任务" });
  await log("log_1003_2", "task_1003", "dispatch", "2026-10-10T09:00:01+08:00", { fromStatus: "assigned", toStatus: "assigned", comment: "派发给 赵敏" });
  await log("log_1003_3", "task_1003", "claim", "2026-10-10T11:00:00+08:00", {
    actorUserId: "user_zhao",
    actorRole: "worker",
    fromStatus: "assigned",
    toStatus: "in_progress",
    comment: "领取任务",
  });

  await log("log_1004_1", "task_1004", "create", "2026-10-08T09:00:00+08:00", { toStatus: "assigned", comment: "创建任务" });
  await log("log_1004_2", "task_1004", "dispatch", "2026-10-08T09:00:01+08:00", { fromStatus: "assigned", toStatus: "assigned", comment: "派发给 赵敏" });
  await log("log_1004_3", "task_1004", "claim", "2026-10-08T09:30:00+08:00", {
    actorUserId: "user_zhao",
    actorRole: "worker",
    fromStatus: "assigned",
    toStatus: "in_progress",
  });
  await log("log_1004_4", "task_1004", "submit", "2026-10-09T15:10:00+08:00", {
    actorUserId: "user_zhao",
    actorRole: "worker",
    fromStatus: "in_progress",
    toStatus: "submitted",
    relatedDeliveryId: "del_1004_v1",
    comment: "提交交付 v1",
  });
  await log("log_1004_5", "task_1004", "qa_fail", "2026-10-09T18:05:00+08:00", {
    fromStatus: "submitted",
    toStatus: "rework",
    relatedDeliveryId: "del_1004_v1",
    comment: "渠道 B 的副标题超过版位字数，按钮和主标题抢语气。请按版位重写后再交。",
  });

  await log("log_1005_1", "task_1005", "create", "2026-10-11T09:05:00+08:00", { toStatus: "assigned", comment: "创建任务" });
  await log("log_1005_2", "task_1005", "dispatch", "2026-10-11T09:05:01+08:00", { fromStatus: "assigned", toStatus: "assigned", comment: "派发给 林晓" });
  await log("log_1005_3", "task_1005", "edit", "2026-10-11T09:20:00+08:00", {
    fromStatus: "assigned",
    toStatus: "assigned",
    comment: "编辑任务字段",
    changedFields: [{ field: "标题", old: "周报素材整理（初稿）", new: "周报素材整理 5 条" }],
  });

  await log("log_1006_1", "task_1006", "create", "2026-10-07T09:00:00+08:00", { toStatus: "assigned", comment: "创建任务" });
  await log("log_1006_2", "task_1006", "dispatch", "2026-10-07T09:00:01+08:00", { fromStatus: "assigned", toStatus: "assigned", comment: "派发给 赵敏" });
  await log("log_1007_1", "task_1007", "create", "2026-10-11T09:30:00+08:00", { toStatus: "assigned", comment: "创建任务" });
  await log("log_1007_2", "task_1007", "cancel", "2026-10-11T09:40:00+08:00", {
    fromStatus: "assigned",
    toStatus: "cancelled",
    comment: "与 RW-1005 重复，取消。",
  });
  await log("log_1008_1", "task_1008", "create", "2026-10-03T09:00:00+08:00", { toStatus: "assigned", comment: "创建任务" });
  await log("log_1008_2", "task_1008", "dispatch", "2026-10-03T09:00:01+08:00", { fromStatus: "assigned", toStatus: "assigned", comment: "派发给 陈远" });
  await log("log_1008_3", "task_1008", "claim", "2026-10-03T10:00:00+08:00", {
    actorUserId: "user_chen",
    actorRole: "worker",
    fromStatus: "assigned",
    toStatus: "in_progress",
  });
  await log("log_1008_4", "task_1008", "submit", "2026-10-07T11:00:00+08:00", {
    actorUserId: "user_chen",
    actorRole: "worker",
    fromStatus: "in_progress",
    toStatus: "submitted",
    relatedDeliveryId: "del_1008_v1",
    comment: "提交交付 v1",
  });
  await log("log_1008_5", "task_1008", "qa_pass", "2026-10-07T16:00:00+08:00", {
    fromStatus: "submitted",
    toStatus: "submitted",
    relatedDeliveryId: "del_1008_v1",
    comment: "质检通过",
  });
  await log("log_1008_6", "task_1008", "accept", "2026-10-07T16:00:05+08:00", {
    fromStatus: "submitted",
    toStatus: "accepted",
    relatedDeliveryId: "del_1008_v1",
    comment: "验收通过（质检并验收）",
  });
  await log("log_1009_1", "task_1009", "create", "2026-10-11T10:00:00+08:00", { toStatus: "assigned", comment: "创建任务" });
  await log("log_1009_2", "task_1009", "dispatch", "2026-10-11T10:00:01+08:00", { fromStatus: "assigned", toStatus: "assigned", comment: "派发给 周宁" });
  await log("log_1009_3", "task_1009", "internal_note", "2026-10-11T10:00:02+08:00", {
    internal: true,
    comment: "强制派发：执行人不是该岗位的在岗人员；培训未结业",
  });

  await prisma.auditLog.create({
    data: {
      entityType: "task",
      entityId: "task_1005",
      action: "update",
      actorUserId: "user_ops",
      actorRole: "ops",
      changedFields: JSON.stringify([{ field: "标题", old: "周报素材整理（初稿）", new: "周报素材整理 5 条" }]),
      comment: "RW-1005",
      createdAt: at("2026-10-11T09:20:00+08:00"),
    },
  });

  await prisma.complianceLedger.create({
    data: { id: "led_lin", enterpriseId: "ent_a", talentId: "talent_lin", yearMonth: "2026-10", checkStatus: "checked", checkedById: "user_ops", checkedAt: at("2026-10-10T15:00:00+08:00") },
  });
  await prisma.complianceLedger.create({
    data: { id: "led_zhao", enterpriseId: "ent_a", talentId: "talent_zhao", yearMonth: "2026-10", checkStatus: "incomplete" },
  });
  await prisma.complianceLedger.create({
    data: {
      id: "led_chen",
      enterpriseId: "ent_b",
      talentId: "talent_chen",
      yearMonth: "2026-10",
      checkStatus: "anomaly",
      anomalyNote: "社保缴纳证明月份与台账月不一致，待企业补传。",
    },
  });

  for (const slot of ["contract", "social_security", "payroll", "tax_invoice"] as const) {
    const names: Record<string, string> = {
      contract: "林晓-劳动合同.pdf",
      social_security: "林晓-社保缴纳证明.pdf",
      payroll: "林晓-发薪凭证.pdf",
      tax_invoice: "林晓-个税申报回执.pdf",
    };
    await fileFor({
      name: names[slot],
      body: minimalPdf(`ledger lin ${slot}`),
      mime: "application/pdf",
      uploaderId: "user_ops",
      enterpriseId: "ent_a",
      ledgerId: "led_lin",
      ledgerSlot: slot,
    });
  }
  await fileFor({
    name: "赵敏-劳动合同.pdf",
    body: minimalPdf("ledger zhao contract"),
    mime: "application/pdf",
    uploaderId: "user_ops",
    enterpriseId: "ent_a",
    ledgerId: "led_zhao",
    ledgerSlot: "contract",
  });
  await fileFor({
    name: "赵敏-社保缴纳证明.pdf",
    body: minimalPdf("ledger zhao social"),
    mime: "application/pdf",
    uploaderId: "user_ops",
    enterpriseId: "ent_a",
    ledgerId: "led_zhao",
    ledgerSlot: "social_security",
  });

  const ops: Actor = {
    id: "user_ops",
    loginName: "yunying",
    displayName: "陈运营",
    role: "ops",
    enterpriseId: null,
    talentId: null,
  };
  const billA = await buildBillDraft(ops, "ent_a", "2026-10");
  await prisma.bill.update({ where: { id: billA.id }, data: { code: "ZD-A-202610" } });
  await addAdjustment(ops, billA.id, { name: "首单试跑减免", amount: "-500", remark: "首月试跑" });
  await issueBill(ops, billA.id);
  await updateInvoice(ops, billA.id, { invoiceStatus: "issued", invoiceNo: "26312000000188921031" });
  await updatePayment(ops, billA.id, { paymentStatus: "partial", paidAmount: "20000" });

  const billB = await buildBillDraft(ops, "ent_b", "2026-10");
  await prisma.bill.update({ where: { id: billB.id }, data: { code: "ZD-B-202610" } });

  await prisma.bill.create({
    data: {
      id: "bill_b_09",
      code: "ZD-B-202609",
      enterpriseId: "ent_b",
      yearMonth: "2026-09",
      positionFeeTotal: 650_000,
      platformServiceFee: 1_200_000,
      adjustments: "[]",
      totalAmount: 1_850_000,
      invoiceStatus: "issued",
      invoiceNo: "26312000000170001988",
      paymentStatus: "paid",
      paidAmount: 1_850_000,
      pricingNote: "9 月历史账单，按当时在岗 1 人月录入，供企业门户对照。",
      status: "confirmed",
      createdById: "user_ops",
      lineItems: {
        create: {
          positionId: "pos_b",
          positionName: "AI 内容编排助理",
          quantity: 1,
          unit: "人月",
          unitPrice: 650_000,
          amount: 650_000,
          remark: "按人月：2026-09 在岗 1 人。",
        },
      },
    },
  });

  console.log("种子数据已写入。演示密码：", PASSWORD);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
