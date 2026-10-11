import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { assertOps, canReadEnterprise, deny } from "@/server/access";
import { fieldChanges, writeAudit } from "@/server/audit";
import { assertFilesAttachable } from "@/server/files";
import type { Actor, ChangedField } from "@/server/types";
import {
  fenToYuan,
  fromDateInput,
  makeCode,
  monthRange,
  parseStringArray,
  parseYuanToFen,
} from "@/lib/format";
import {
  DISABILITY_TYPES,
  ENTERPRISE_STATUS,
  INDUSTRIES,
  LEDGER_SLOTS,
  LEDGER_STATUS,
  POSITION_STATUS,
  POSITION_TYPE,
  SETTLEMENT_CYCLE,
  SIGN_STATUS,
  TALENT_STATUS,
  TRAINING_PROGRESS,
} from "@/lib/labels";

function isUnique(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function withCode<T>(prefix: string, requested: string | undefined, exists: (code: string) => Promise<unknown>, create: (code: string) => Promise<T>) {
  const manual = requested?.trim();
  if (manual) {
    if (!/^[A-Za-z0-9-]{2,24}$/.test(manual)) throw new AppError("编号仅支持字母、数字和短横线，2–24 位");
    if (await exists(manual)) throw new AppError("编号已存在");
    return create(manual);
  }
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = makeCode(prefix);
    if (await exists(code)) continue;
    try {
      return await create(code);
    } catch (error) {
      if (!isUnique(error)) throw error;
    }
  }
  throw new AppError("编号生成失败，请重试");
}

function text(value: unknown, label: string, max: number, required = true) {
  const raw = String(value ?? "").trim();
  if (!raw && required) throw new AppError(`请填写${label}`);
  if (raw.length > max) throw new AppError(`${label}过长`);
  return raw;
}

function positiveInt(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new AppError(`${label}须为大于 0 的整数`);
  return number;
}

function nonNegativeFen(value: unknown, label: string) {
  const fen = parseYuanToFen(String(value ?? ""), label);
  if (fen < 0) throw new AppError(`${label}不能为负`);
  return fen;
}

export async function listEnterprises(
  actor: Actor,
  filters: { q?: string; status?: string; skip: number; pageSize: number },
) {
  await assertOps(actor, "查看企业列表");
  const where: Prisma.EnterpriseWhereInput = {};
  if (filters.status && filters.status in ENTERPRISE_STATUS) where.status = filters.status;
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q } },
      { code: { contains: filters.q } },
      { contactName: { contains: filters.q } },
    ];
  }
  const [rows, total] = await Promise.all([
    prisma.enterprise.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: filters.skip,
      take: filters.pageSize,
      include: { _count: { select: { plans: true, positions: true } } },
    }),
    prisma.enterprise.count({ where }),
  ]);
  return { rows, total };
}

export async function getEnterprise(actor: Actor, id: string) {
  const enterprise = await prisma.enterprise.findUnique({
    where: { id },
    include: {
      plans: { orderBy: { startDate: "desc" }, include: { _count: { select: { positions: true } } } },
      positions: { orderBy: { createdAt: "desc" }, include: { plan: { select: { planVersion: true, code: true } } } },
    },
  });
  if (!enterprise) throw new AppError("企业不存在", "NOT_FOUND");
  if (!canReadEnterprise(actor, enterprise.id)) await deny(actor, `越权查看企业 ${enterprise.code}`);
  return enterprise;
}

export async function createEnterprise(
  actor: Actor,
  input: {
    code?: string;
    name: string;
    industry: string;
    scaleHeadcount: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    status: string;
    remark: string;
  },
) {
  await assertOps(actor, "创建企业");
  const name = text(input.name, "企业名称", 80);
  const industry = text(input.industry, "行业", 40, false);
  if (industry && !INDUSTRIES.includes(industry as (typeof INDUSTRIES)[number])) {
    throw new AppError("行业不在可选范围内");
  }
  const contactName = text(input.contactName, "对接人", 40);
  const contactPhone = text(input.contactPhone, "电话", 30);
  const contactEmail = text(input.contactEmail, "邮箱", 80, false);
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) throw new AppError("邮箱格式不正确");
  if (!(input.status in ENTERPRISE_STATUS)) throw new AppError("企业状态不正确");
  const scaleHeadcount = positiveInt(input.scaleHeadcount, "规模人数");
  const row = await withCode(
    "ZY",
    input.code,
    (code) => prisma.enterprise.findUnique({ where: { code } }),
    (code) =>
      prisma.enterprise.create({
        data: {
          code,
          name,
          industry: industry || null,
          scaleHeadcount,
          contactName,
          contactPhone,
          contactEmail: contactEmail || null,
          status: input.status,
          remark: text(input.remark, "备注", 2000, false) || null,
        },
      }),
  );
  await writeAudit(actor, "enterprise", row.id, "create", null, row.name);
  return row;
}

export async function updateEnterprise(
  actor: Actor,
  id: string,
  input: {
    name: string;
    industry: string;
    scaleHeadcount: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    status: string;
    remark: string;
  },
) {
  await assertOps(actor, `修改企业 ${id}`);
  const before = await prisma.enterprise.findUnique({ where: { id } });
  if (!before) throw new AppError("企业不存在", "NOT_FOUND");
  const name = text(input.name, "企业名称", 80);
  const industry = text(input.industry, "行业", 40, false);
  if (industry && !INDUSTRIES.includes(industry as (typeof INDUSTRIES)[number])) throw new AppError("行业不在可选范围内");
  const contactEmail = text(input.contactEmail, "邮箱", 80, false);
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) throw new AppError("邮箱格式不正确");
  if (!(input.status in ENTERPRISE_STATUS)) throw new AppError("企业状态不正确");
  const data = {
    name,
    industry: industry || null,
    scaleHeadcount: positiveInt(input.scaleHeadcount, "规模人数"),
    contactName: text(input.contactName, "对接人", 40),
    contactPhone: text(input.contactPhone, "电话", 30),
    contactEmail: contactEmail || null,
    status: input.status,
    remark: text(input.remark, "备注", 2000, false) || null,
  };
  const changes = fieldChanges([
    { field: "企业名称", old: before.name, new: data.name },
    { field: "行业", old: before.industry ?? "", new: data.industry ?? "" },
    { field: "规模人数", old: String(before.scaleHeadcount), new: String(data.scaleHeadcount) },
    { field: "对接人", old: before.contactName, new: data.contactName },
    { field: "电话", old: before.contactPhone, new: data.contactPhone },
    { field: "邮箱", old: before.contactEmail ?? "", new: data.contactEmail ?? "" },
    { field: "状态", old: ENTERPRISE_STATUS[before.status] ?? before.status, new: ENTERPRISE_STATUS[data.status] ?? data.status },
    { field: "备注", old: before.remark ?? "", new: data.remark ?? "" },
  ]);
  const row = await prisma.enterprise.update({ where: { id }, data });
  if (changes.length > 0) await writeAudit(actor, "enterprise", id, "update", changes);
  return row;
}

export async function deleteEnterprise(actor: Actor, id: string) {
  await assertOps(actor, `删除企业 ${id}`);
  const row = await prisma.enterprise.findUnique({
    where: { id },
    include: { _count: { select: { plans: true, positions: true, tasks: true, bills: true, ledgers: true, users: true } } },
  });
  if (!row) throw new AppError("企业不存在", "NOT_FOUND");
  const bound = await prisma.talent.count({ where: { currentEnterpriseId: id } });
  const c = row._count;
  if (c.plans || c.positions || c.tasks || c.bills || c.ledgers || c.users || bound) {
    throw new AppError("企业下仍有方案、岗位、任务、台账、账单、账号或在岗人才，不能删除。可将状态改为终止。");
  }
  await writeAudit(actor, "enterprise", id, "delete", null, row.name);
  await prisma.enterprise.delete({ where: { id } });
}

export async function getPlan(actor: Actor, id: string) {
  const plan = await prisma.plan.findUnique({
    where: { id },
    include: {
      enterprise: true,
      positions: true,
      files: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!plan) throw new AppError("方案不存在", "NOT_FOUND");
  if (!canReadEnterprise(actor, plan.enterpriseId)) await deny(actor, `越权查看方案 ${plan.code}`);
  return plan;
}

export async function createPlan(
  actor: Actor,
  input: {
    enterpriseId: string;
    code?: string;
    planVersion: string;
    disabilityFundBase: string;
    disabilityFundGap: string;
    monthlyServiceFee: string;
    startDate: string;
    endDate: string;
    signStatus: string;
    remark: string;
  },
) {
  await assertOps(actor, "创建方案");
  const enterprise = await prisma.enterprise.findUnique({ where: { id: input.enterpriseId } });
  if (!enterprise) throw new AppError("企业不存在", "NOT_FOUND");
  if (!(input.signStatus in SIGN_STATUS)) throw new AppError("签约状态不正确");
  const startDate = fromDateInput(input.startDate);
  const endDate = fromDateInput(input.endDate);
  if (endDate < startDate) throw new AppError("服务止日不能早于起日");
  const row = await withCode(
    "FA",
    input.code,
    (code) => prisma.plan.findUnique({ where: { code } }),
    (code) =>
      prisma.plan.create({
        data: {
          code,
          enterpriseId: enterprise.id,
          planVersion: text(input.planVersion, "方案版本", 40),
          disabilityFundBase: nonNegativeFen(input.disabilityFundBase, "残保金基数"),
          disabilityFundGap: nonNegativeFen(input.disabilityFundGap, "残保金缺口"),
          monthlyServiceFee: nonNegativeFen(input.monthlyServiceFee, "月服务费"),
          startDate,
          endDate,
          signStatus: input.signStatus,
          productLine: "compliance_single_position",
          remark: text(input.remark, "备注", 4000, false) || null,
        },
      }),
  );
  await writeAudit(actor, "plan", row.id, "create", null, `${enterprise.name} ${row.planVersion}`);
  return row;
}

export async function updatePlan(
  actor: Actor,
  id: string,
  input: {
    planVersion: string;
    disabilityFundBase: string;
    disabilityFundGap: string;
    monthlyServiceFee: string;
    startDate: string;
    endDate: string;
    signStatus: string;
    remark: string;
  },
) {
  await assertOps(actor, `修改方案 ${id}`);
  const before = await prisma.plan.findUnique({ where: { id } });
  if (!before) throw new AppError("方案不存在", "NOT_FOUND");
  if (!(input.signStatus in SIGN_STATUS)) throw new AppError("签约状态不正确");
  const startDate = fromDateInput(input.startDate);
  const endDate = fromDateInput(input.endDate);
  if (endDate < startDate) throw new AppError("服务止日不能早于起日");
  const data = {
    planVersion: text(input.planVersion, "方案版本", 40),
    disabilityFundBase: nonNegativeFen(input.disabilityFundBase, "残保金基数"),
    disabilityFundGap: nonNegativeFen(input.disabilityFundGap, "残保金缺口"),
    monthlyServiceFee: nonNegativeFen(input.monthlyServiceFee, "月服务费"),
    startDate,
    endDate,
    signStatus: input.signStatus,
    remark: text(input.remark, "备注", 4000, false) || null,
  };
  const changes = fieldChanges([
    { field: "版本", old: before.planVersion, new: data.planVersion },
    { field: "残保金基数", old: fenToYuan(before.disabilityFundBase), new: fenToYuan(data.disabilityFundBase) },
    { field: "残保金缺口", old: fenToYuan(before.disabilityFundGap), new: fenToYuan(data.disabilityFundGap) },
    { field: "月服务费", old: fenToYuan(before.monthlyServiceFee), new: fenToYuan(data.monthlyServiceFee) },
    { field: "服务起", old: before.startDate.toISOString(), new: data.startDate.toISOString() },
    { field: "服务止", old: before.endDate.toISOString(), new: data.endDate.toISOString() },
    { field: "签约状态", old: SIGN_STATUS[before.signStatus] ?? before.signStatus, new: SIGN_STATUS[data.signStatus] ?? data.signStatus },
    { field: "备注", old: before.remark ?? "", new: data.remark ?? "" },
  ]);
  const row = await prisma.plan.update({ where: { id }, data });
  if (changes.length > 0) await writeAudit(actor, "plan", id, "update", changes);
  return row;
}

export async function deletePlan(actor: Actor, id: string) {
  await assertOps(actor, `删除方案 ${id}`);
  const plan = await prisma.plan.findUnique({ where: { id }, include: { _count: { select: { positions: true } } } });
  if (!plan) throw new AppError("方案不存在", "NOT_FOUND");
  if (plan._count.positions > 0) throw new AppError("方案下已有岗位，不能删除。可将签约状态改为已作废。");
  await writeAudit(actor, "plan", id, "delete", null, plan.code);
  await prisma.fileAsset.updateMany({ where: { planId: id }, data: { deletedAt: new Date(), planId: null } });
  await prisma.plan.delete({ where: { id } });
}

export async function attachPlanFiles(actor: Actor, planId: string, fileIds: string[]) {
  await assertOps(actor, `上传方案附件 ${planId}`);
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new AppError("方案不存在", "NOT_FOUND");
  if (fileIds.length === 0) throw new AppError("请选择附件");
  await assertFilesAttachable(actor, fileIds);
  await prisma.fileAsset.updateMany({
    where: { id: { in: fileIds } },
    data: { planId, enterpriseId: plan.enterpriseId },
  });
  await writeAudit(actor, "plan", planId, "upload", null, `上传测算或方案附件 ${fileIds.length} 个`);
}

export async function listPositions(
  actor: Actor,
  filters: { enterpriseId?: string; status?: string; q?: string; skip: number; pageSize: number },
) {
  const where: Prisma.PositionWhereInput = {};
  if (actor.role === "enterprise") {
    if (!actor.enterpriseId) return { rows: [], total: 0 };
    where.enterpriseId = actor.enterpriseId;
  } else if (actor.role === "worker") {
    await deny(actor, "执行端查看岗位");
  } else if (filters.enterpriseId) {
    where.enterpriseId = filters.enterpriseId;
  }
  if (filters.status && filters.status in POSITION_STATUS) where.status = filters.status;
  if (filters.q) where.OR = [{ name: { contains: filters.q } }, { code: { contains: filters.q } }];
  const [rows, total] = await Promise.all([
    prisma.position.findMany({
      where,
      include: {
        enterprise: { select: { id: true, name: true, code: true } },
        plan: { select: { id: true, planVersion: true, code: true } },
        _count: { select: { talents: true, tasks: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: filters.skip,
      take: filters.pageSize,
    }),
    prisma.position.count({ where }),
  ]);
  return { rows, total };
}

export async function getPosition(actor: Actor, id: string) {
  const position = await prisma.position.findUnique({
    where: { id },
    include: {
      enterprise: true,
      plan: true,
      talents: { where: { status: "on_duty" }, select: { id: true, name: true, code: true } },
      _count: { select: { tasks: true } },
    },
  });
  if (!position) throw new AppError("岗位不存在", "NOT_FOUND");
  if (!canReadEnterprise(actor, position.enterpriseId)) await deny(actor, `越权查看岗位 ${position.code}`);
  const openTasks = await prisma.task.count({
    where: { positionId: id, status: { notIn: ["accepted", "cancelled"] } },
  });
  return { ...position, openTasks };
}

export async function positionFormOptions(actor: Actor) {
  await assertOps(actor, "读取岗位表单");
  return prisma.enterprise.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      plans: { select: { id: true, code: true, planVersion: true, signStatus: true }, orderBy: { startDate: "desc" } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createPosition(
  actor: Actor,
  input: {
    code?: string;
    enterpriseId: string;
    planId: string;
    name: string;
    headcount: string;
    deliveryStandard: string;
    qaRules: string;
    unitPrice: string;
    settlementCycle: string;
    status: string;
  },
) {
  await assertOps(actor, "创建岗位");
  const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
  if (!plan || plan.enterpriseId !== input.enterpriseId) throw new AppError("方案不属于所选企业");
  if (!(input.settlementCycle in SETTLEMENT_CYCLE)) throw new AppError("结算周期不正确");
  if (!(input.status in POSITION_STATUS)) throw new AppError("岗位状态不正确");
  const row = await withCode(
    "GW",
    input.code,
    (code) => prisma.position.findUnique({ where: { code } }),
    (code) =>
      prisma.position.create({
        data: {
          code,
          enterpriseId: input.enterpriseId,
          planId: plan.id,
          name: text(input.name, "岗位名称", 80),
          type: POSITION_TYPE,
          headcount: positiveInt(input.headcount, "编制人数"),
          deliveryStandard: text(input.deliveryStandard, "交付标准", 4000),
          qaRules: text(input.qaRules, "质检规则", 4000),
          unitPrice: nonNegativeFen(input.unitPrice, "单价"),
          settlementCycle: input.settlementCycle,
          status: input.status,
        },
      }),
  );
  await writeAudit(actor, "position", row.id, "create", null, row.name);
  return row;
}

export async function updatePosition(
  actor: Actor,
  id: string,
  input: {
    name: string;
    headcount: string;
    deliveryStandard: string;
    qaRules: string;
    unitPrice: string;
    settlementCycle: string;
    status: string;
    planId: string;
  },
) {
  await assertOps(actor, `修改岗位 ${id}`);
  const before = await prisma.position.findUnique({ where: { id } });
  if (!before) throw new AppError("岗位不存在", "NOT_FOUND");
  const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
  if (!plan || plan.enterpriseId !== before.enterpriseId) throw new AppError("方案不属于该企业");
  if (!(input.settlementCycle in SETTLEMENT_CYCLE)) throw new AppError("结算周期不正确");
  if (!(input.status in POSITION_STATUS)) throw new AppError("岗位状态不正确");
  const openTasks = await prisma.task.count({
    where: { positionId: id, status: { notIn: ["accepted", "cancelled"] } },
  });
  const data = {
    planId: plan.id,
    name: text(input.name, "岗位名称", 80),
    headcount: positiveInt(input.headcount, "编制人数"),
    deliveryStandard: text(input.deliveryStandard, "交付标准", 4000),
    qaRules: text(input.qaRules, "质检规则", 4000),
    unitPrice: nonNegativeFen(input.unitPrice, "单价"),
    settlementCycle: input.settlementCycle,
    status: input.status,
  };
  const changes = fieldChanges([
    { field: "岗位名称", old: before.name, new: data.name },
    { field: "编制", old: String(before.headcount), new: String(data.headcount) },
    { field: "交付标准", old: before.deliveryStandard, new: data.deliveryStandard },
    { field: "质检规则", old: before.qaRules, new: data.qaRules },
    { field: "单价", old: fenToYuan(before.unitPrice), new: fenToYuan(data.unitPrice) },
    { field: "结算周期", old: SETTLEMENT_CYCLE[before.settlementCycle] ?? before.settlementCycle, new: SETTLEMENT_CYCLE[data.settlementCycle] ?? data.settlementCycle },
    { field: "状态", old: POSITION_STATUS[before.status] ?? before.status, new: POSITION_STATUS[data.status] ?? data.status },
    { field: "方案", old: before.planId, new: data.planId },
  ]);
  const row = await prisma.position.update({ where: { id }, data });
  if (changes.length > 0) await writeAudit(actor, "position", id, "update", changes);
  const warning =
    data.status === "inactive" && openTasks > 0
      ? `岗位已停用。仍有 ${openTasks} 条未结束任务，这些任务可以继续交付，但不能再新建任务。`
      : undefined;
  return { row, warning };
}

export async function deletePosition(actor: Actor, id: string) {
  await assertOps(actor, `删除岗位 ${id}`);
  const position = await prisma.position.findUnique({
    where: { id },
    include: { _count: { select: { tasks: true, talents: true } } },
  });
  if (!position) throw new AppError("岗位不存在", "NOT_FOUND");
  if (position._count.tasks || position._count.talents) {
    throw new AppError("岗位已有任务或绑定人才，不能删除。请改为停用。");
  }
  await writeAudit(actor, "position", id, "delete", null, position.code);
  await prisma.position.delete({ where: { id } });
}

export async function listTalents(
  actor: Actor,
  filters: { q?: string; status?: string; skip: number; pageSize: number },
) {
  await assertOps(actor, "查看人才列表");
  const where: Prisma.TalentWhereInput = {};
  if (filters.status && filters.status in TALENT_STATUS) where.status = filters.status;
  if (filters.q) where.OR = [{ name: { contains: filters.q } }, { code: { contains: filters.q } }, { phone: { contains: filters.q } }];
  const [rows, total] = await Promise.all([
    prisma.talent.findMany({
      where,
      include: {
        currentEnterprise: { select: { name: true } },
        currentPosition: { select: { name: true } },
        account: { select: { loginName: true, status: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: filters.skip,
      take: filters.pageSize,
    }),
    prisma.talent.count({ where }),
  ]);
  return { rows, total };
}

export async function getTalent(actor: Actor, id: string) {
  if (actor.role === "worker") {
    if (actor.talentId !== id) await deny(actor, `执行端查看他人档案 ${id}`);
  } else if (actor.role !== "ops") {
    await deny(actor, `查看人才档案 ${id}`);
  }
  const talent = await prisma.talent.findUnique({
    where: { id },
    include: {
      currentEnterprise: { select: { id: true, name: true, code: true } },
      currentPosition: { select: { id: true, name: true, code: true, headcount: true } },
      account: { select: { id: true, loginName: true, status: true } },
    },
  });
  if (!talent) throw new AppError("人才不存在", "NOT_FOUND");
  return talent;
}

export async function createTalent(
  actor: Actor,
  input: {
    code?: string;
    name: string;
    disabilityCertNo: string;
    disabilityType: string;
    disabilityLevel: string;
    phone: string;
    skillTags: string;
    trainingProgress: string;
    trainingPercent: string;
    status: string;
  },
) {
  await assertOps(actor, "创建人才");
  if (!DISABILITY_TYPES.includes(input.disabilityType as (typeof DISABILITY_TYPES)[number])) {
    throw new AppError("请选择残疾类别");
  }
  if (!(input.trainingProgress in TRAINING_PROGRESS)) throw new AppError("培训进度不正确");
  if (!(input.status in TALENT_STATUS) || input.status === "on_duty") {
    throw new AppError("新建档案不能直接设为在岗，请保存后使用上岗绑定");
  }
  const percent = Number(input.trainingPercent || 0);
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) throw new AppError("培训百分比须为 0–100");
  const tags = input.skillTags
    .split(/[,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
  const row = await withCode(
    "RC",
    input.code,
    (code) => prisma.talent.findUnique({ where: { code } }),
    (code) =>
      prisma.talent.create({
        data: {
          code,
          name: text(input.name, "姓名", 40),
          disabilityCertNo: text(input.disabilityCertNo, "残疾证号", 40),
          disabilityType: input.disabilityType,
          disabilityLevel: text(input.disabilityLevel, "等级", 20, false) || null,
          phone: text(input.phone, "联系电话", 30),
          skillTags: JSON.stringify(tags),
          trainingProgress: input.trainingProgress,
          trainingPercent: percent,
          eligiblePositionTypes: JSON.stringify([POSITION_TYPE]),
          status: input.status,
        },
      }),
  );
  await writeAudit(actor, "talent", row.id, "create", null, row.name);
  return row;
}

export async function updateTalent(
  actor: Actor,
  id: string,
  input: {
    name: string;
    disabilityCertNo: string;
    disabilityType: string;
    disabilityLevel: string;
    phone: string;
    skillTags: string;
    trainingProgress: string;
    trainingPercent: string;
    status: string;
  },
) {
  await assertOps(actor, `修改人才 ${id}`);
  const before = await prisma.talent.findUnique({ where: { id } });
  if (!before) throw new AppError("人才不存在", "NOT_FOUND");
  if (!DISABILITY_TYPES.includes(input.disabilityType as (typeof DISABILITY_TYPES)[number])) {
    throw new AppError("请选择残疾类别");
  }
  if (!(input.trainingProgress in TRAINING_PROGRESS)) throw new AppError("培训进度不正确");
  if (!(input.status in TALENT_STATUS)) throw new AppError("人才状态不正确");
  if (input.status === "on_duty" && before.status !== "on_duty") {
    throw new AppError("请使用上岗绑定将人才设为在岗");
  }
  if (before.status === "on_duty" && input.status !== "on_duty" && input.status !== "inactive") {
    throw new AppError("在岗人才请先离岗，或直接停用");
  }
  const percent = Number(input.trainingPercent || 0);
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) throw new AppError("培训百分比须为 0–100");
  const tags = input.skillTags.split(/[,，\s]+/).map((item) => item.trim()).filter(Boolean).slice(0, 12);
  const data = {
    name: text(input.name, "姓名", 40),
    disabilityCertNo: text(input.disabilityCertNo, "残疾证号", 40),
    disabilityType: input.disabilityType,
    disabilityLevel: text(input.disabilityLevel, "等级", 20, false) || null,
    phone: text(input.phone, "联系电话", 30),
    skillTags: JSON.stringify(tags),
    trainingProgress: input.trainingProgress,
    trainingPercent: percent,
    status: input.status,
    ...(input.status === "inactive"
      ? { currentEnterpriseId: null, currentPositionId: null }
      : {}),
  };
  const changes = fieldChanges([
    { field: "姓名", old: before.name, new: data.name },
    { field: "残疾证号", old: before.disabilityCertNo, new: data.disabilityCertNo },
    { field: "残疾类别", old: before.disabilityType, new: data.disabilityType },
    { field: "等级", old: before.disabilityLevel ?? "", new: data.disabilityLevel ?? "" },
    { field: "电话", old: before.phone, new: data.phone },
    { field: "技能", old: before.skillTags, new: data.skillTags },
    { field: "培训", old: TRAINING_PROGRESS[before.trainingProgress] ?? before.trainingProgress, new: TRAINING_PROGRESS[data.trainingProgress] ?? data.trainingProgress },
    { field: "培训进度", old: String(before.trainingPercent), new: String(data.trainingPercent) },
    { field: "状态", old: TALENT_STATUS[before.status] ?? before.status, new: TALENT_STATUS[data.status] ?? data.status },
  ]);
  const row = await prisma.talent.update({ where: { id }, data });
  if (changes.length > 0) await writeAudit(actor, "talent", id, "update", changes);
  return row;
}

export async function bindTalent(
  actor: Actor,
  id: string,
  input: { positionId: string; force: boolean },
) {
  await assertOps(actor, `人才上岗 ${id}`);
  const talent = await prisma.talent.findUnique({ where: { id } });
  if (!talent) throw new AppError("人才不存在", "NOT_FOUND");
  if (talent.status === "inactive") throw new AppError("停用人才不能上岗");
  const position = await prisma.position.findUnique({ where: { id: input.positionId } });
  if (!position) throw new AppError("岗位不存在", "NOT_FOUND");
  if (position.status !== "active") throw new AppError("只能绑定启用中的岗位");
  const eligible = parseStringArray(talent.eligiblePositionTypes);
  const reasons: string[] = [];
  if (talent.trainingProgress !== "graduated") reasons.push("培训未结业");
  if (!eligible.includes(position.type)) reasons.push("可上岗位类型不匹配");
  if (reasons.length > 0 && !input.force) {
    throw new AppError(`${reasons.join("；")}。默认不可上岗，如需例外请勾选强制上岗。`);
  }
  const others = await prisma.talent.count({
    where: { currentPositionId: position.id, status: "on_duty", NOT: { id } },
  });
  await prisma.talent.update({
    where: { id },
    data: {
      status: "on_duty",
      currentEnterpriseId: position.enterpriseId,
      currentPositionId: position.id,
    },
  });
  const warning = others + 1 > position.headcount ? `在岗人数将超过编制（${others + 1}/${position.headcount}），已允许保存。` : undefined;
  await writeAudit(
    actor,
    "talent",
    id,
    "bind",
    [{ field: "在岗岗位", old: talent.currentPositionId ?? "", new: position.id }],
    reasons.length > 0 ? `强制上岗：${reasons.join("；")}` : `上岗到 ${position.name}`,
  );
  return { warning };
}

export async function unbindTalent(actor: Actor, id: string) {
  await assertOps(actor, `人才离岗 ${id}`);
  const talent = await prisma.talent.findUnique({ where: { id } });
  if (!talent) throw new AppError("人才不存在", "NOT_FOUND");
  if (talent.status !== "on_duty") throw new AppError("当前不在岗");
  const nextStatus = talent.trainingProgress === "graduated" ? "eligible" : "training";
  await prisma.talent.update({
    where: { id },
    data: { status: nextStatus, currentEnterpriseId: null, currentPositionId: null },
  });
  await writeAudit(actor, "talent", id, "unbind", [
    { field: "状态", old: "在岗", new: TALENT_STATUS[nextStatus] ?? nextStatus },
  ]);
}

export async function deleteTalent(actor: Actor, id: string) {
  await assertOps(actor, `删除人才 ${id}`);
  const talent = await prisma.talent.findUnique({
    where: { id },
    include: { _count: { select: { tasks: true, ledgers: true } }, account: true },
  });
  if (!talent) throw new AppError("人才不存在", "NOT_FOUND");
  if (talent._count.tasks || talent._count.ledgers || talent.account) {
    throw new AppError("人才已有任务、台账或登录账号，不能删除。请改为停用。");
  }
  await writeAudit(actor, "talent", id, "delete", null, talent.name);
  await prisma.talent.delete({ where: { id } });
}

export async function bindOptions(actor: Actor) {
  await assertOps(actor, "读取上岗岗位");
  return prisma.position.findMany({
    where: { status: "active" },
    select: { id: true, name: true, code: true, headcount: true, enterprise: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
}

export async function listLedgers(
  actor: Actor,
  filters: { enterpriseId?: string; yearMonth?: string; checkStatus?: string; q?: string; skip: number; pageSize: number },
) {
  const where: Prisma.ComplianceLedgerWhereInput = {};
  if (actor.role === "enterprise") {
    if (!actor.enterpriseId) return { rows: [], total: 0 };
    where.enterpriseId = actor.enterpriseId;
  } else if (actor.role === "worker") {
    await deny(actor, "执行端查看台账");
  } else if (filters.enterpriseId) where.enterpriseId = filters.enterpriseId;
  if (filters.yearMonth) where.yearMonth = filters.yearMonth;
  if (filters.checkStatus && filters.checkStatus in LEDGER_STATUS) where.checkStatus = filters.checkStatus;
  if (filters.q) where.talent = { name: { contains: filters.q } };
  const [rows, total] = await Promise.all([
    prisma.complianceLedger.findMany({
      where,
      include: {
        enterprise: { select: { name: true, code: true } },
        talent: { select: { name: true, code: true } },
        files: { where: { deletedAt: null }, select: { id: true, ledgerSlot: true } },
      },
      orderBy: [{ yearMonth: "desc" }, { updatedAt: "desc" }],
      skip: filters.skip,
      take: filters.pageSize,
    }),
    prisma.complianceLedger.count({ where }),
  ]);
  return { rows, total };
}

export async function getLedger(actor: Actor, id: string) {
  const ledger = await prisma.complianceLedger.findUnique({
    where: { id },
    include: {
      enterprise: true,
      talent: true,
      checkedBy: { select: { displayName: true } },
      files: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!ledger) throw new AppError("台账不存在", "NOT_FOUND");
  if (!canReadEnterprise(actor, ledger.enterpriseId)) await deny(actor, `越权查看台账 ${id}`);
  return ledger;
}

export async function createLedger(
  actor: Actor,
  input: { enterpriseId: string; talentId: string; yearMonth: string },
) {
  await assertOps(actor, "创建台账");
  monthRange(input.yearMonth);
  const talent = await prisma.talent.findUnique({ where: { id: input.talentId } });
  if (!talent) throw new AppError("人才不存在", "NOT_FOUND");
  const enterprise = await prisma.enterprise.findUnique({ where: { id: input.enterpriseId } });
  if (!enterprise) throw new AppError("企业不存在", "NOT_FOUND");
  try {
    const row = await prisma.complianceLedger.create({
      data: {
        enterpriseId: enterprise.id,
        talentId: talent.id,
        yearMonth: input.yearMonth,
        checkStatus: "incomplete",
      },
    });
    await writeAudit(actor, "ledger", row.id, "create", null, `${talent.name} ${input.yearMonth}`);
    return row;
  } catch (error) {
    if (isUnique(error)) throw new AppError("该人才在这个月已经有一条台账");
    throw error;
  }
}

export async function updateLedger(
  actor: Actor,
  id: string,
  input: { checkStatus: string; anomalyNote: string },
) {
  await assertOps(actor, `核对台账 ${id}`);
  const before = await prisma.complianceLedger.findUnique({ where: { id } });
  if (!before) throw new AppError("台账不存在", "NOT_FOUND");
  if (!(input.checkStatus in LEDGER_STATUS)) throw new AppError("核对状态不正确");
  const anomalyNote = text(input.anomalyNote, "异常备注", 2000, false);
  if (input.checkStatus === "anomaly" && anomalyNote.length < 2) throw new AppError("标记异常时请填写异常备注");
  const data: Prisma.ComplianceLedgerUpdateInput = {
    checkStatus: input.checkStatus,
    anomalyNote: anomalyNote || null,
  };
  if (input.checkStatus === "checked") {
    data.checkedBy = { connect: { id: actor.id } };
    data.checkedAt = new Date();
  }
  await prisma.complianceLedger.update({ where: { id }, data });
  const changes: ChangedField[] = fieldChanges([
    { field: "核对状态", old: LEDGER_STATUS[before.checkStatus] ?? before.checkStatus, new: LEDGER_STATUS[input.checkStatus] ?? input.checkStatus },
    { field: "异常备注", old: before.anomalyNote ?? "", new: anomalyNote },
  ]);
  if (changes.length > 0) await writeAudit(actor, "ledger", id, "check", changes);
}

export async function attachLedgerFiles(actor: Actor, id: string, slot: string, fileIds: string[]) {
  await assertOps(actor, `上传台账附件 ${id}`);
  if (!LEDGER_SLOTS.includes(slot as (typeof LEDGER_SLOTS)[number])) throw new AppError("材料类型不正确");
  const ledger = await prisma.complianceLedger.findUnique({
    where: { id },
    include: { files: { where: { deletedAt: null } } },
  });
  if (!ledger) throw new AppError("台账不存在", "NOT_FOUND");
  if (fileIds.length === 0) throw new AppError("请选择附件");
  const existing = ledger.files.filter((file) => file.ledgerSlot === slot).length;
  if (existing + fileIds.length > 20) throw new AppError("每一类材料最多 20 个附件");
  await assertFilesAttachable(actor, fileIds);
  await prisma.fileAsset.updateMany({
    where: { id: { in: fileIds } },
    data: { ledgerId: id, ledgerSlot: slot, enterpriseId: ledger.enterpriseId },
  });
  const slots = new Set([...ledger.files.map((file) => file.ledgerSlot), slot]);
  if (ledger.checkStatus === "incomplete" && LEDGER_SLOTS.every((item) => slots.has(item))) {
    await prisma.complianceLedger.update({ where: { id }, data: { checkStatus: "pending_review" } });
  }
  await writeAudit(actor, "ledger", id, "upload", null, `${slot} +${fileIds.length}`);
}

export async function removeLedgerFile(actor: Actor, ledgerId: string, fileId: string) {
  await assertOps(actor, `移除台账附件 ${fileId}`);
  const file = await prisma.fileAsset.findUnique({ where: { id: fileId } });
  if (!file || file.ledgerId !== ledgerId || file.deletedAt) throw new AppError("附件不存在", "NOT_FOUND");
  await prisma.fileAsset.update({ where: { id: fileId }, data: { deletedAt: new Date() } });
  await writeAudit(actor, "ledger", ledgerId, "remove_file", null, file.originalName);
}

export async function ledgerFormOptions(actor: Actor) {
  await assertOps(actor, "读取台账表单");
  const [enterprises, talents] = await Promise.all([
    prisma.enterprise.findMany({ select: { id: true, name: true, code: true }, orderBy: { name: "asc" } }),
    prisma.talent.findMany({ select: { id: true, name: true, code: true, currentEnterpriseId: true }, orderBy: { name: "asc" } }),
  ]);
  return { enterprises, talents };
}

export async function listUsers(actor: Actor) {
  await assertOps(actor, "查看账号");
  return prisma.user.findMany({
    include: {
      enterprise: { select: { name: true, code: true } },
      talent: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createUser(
  actor: Actor,
  input: { loginName: string; displayName: string; password: string; role: string; enterpriseId: string; talentId: string },
) {
  await assertOps(actor, "创建账号");
  const loginName = text(input.loginName, "登录名", 40);
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(loginName)) throw new AppError("登录名使用 3–40 位字母、数字、点、下划线或短横线");
  const displayName = text(input.displayName, "显示名", 40);
  if (input.password.length < 8) throw new AppError("密码至少 8 位");
  if (!["ops", "enterprise", "worker"].includes(input.role)) throw new AppError("角色不正确");
  let enterpriseId: string | null = null;
  let talentId: string | null = null;
  if (input.role === "enterprise") {
    const enterprise = await prisma.enterprise.findUnique({ where: { id: input.enterpriseId } });
    if (!enterprise) throw new AppError("请选择所属企业");
    enterpriseId = enterprise.id;
  }
  if (input.role === "worker") {
    const talent = await prisma.talent.findUnique({ where: { id: input.talentId }, include: { account: true } });
    if (!talent) throw new AppError("请选择绑定的人才");
    if (talent.account) throw new AppError("该人才已有登录账号");
    talentId = talent.id;
  }
  try {
    const row = await prisma.user.create({
      data: {
        loginName,
        displayName,
        passwordHash: await hash(input.password, 10),
        role: input.role,
        enterpriseId,
        talentId,
        status: "active",
      },
    });
    await writeAudit(actor, "user", row.id, "create", null, `${loginName} / ${input.role}`);
    return row;
  } catch (error) {
    if (isUnique(error)) throw new AppError("登录名已存在");
    throw error;
  }
}

export async function resetPassword(actor: Actor, userId: string, password: string) {
  await assertOps(actor, `重置密码 ${userId}`);
  if (password.length < 8) throw new AppError("密码至少 8 位");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("账号不存在", "NOT_FOUND");
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hash(password, 10) } });
  await writeAudit(actor, "user", userId, "reset_password", null, user.loginName);
}

export async function setUserStatus(actor: Actor, userId: string, status: "active" | "disabled") {
  await assertOps(actor, `变更账号状态 ${userId}`);
  if (actor.id === userId && status === "disabled") throw new AppError("不能停用自己的账号");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("账号不存在", "NOT_FOUND");
  await prisma.user.update({ where: { id: userId }, data: { status } });
  await writeAudit(actor, "user", userId, status === "active" ? "enable" : "disable", [
    { field: "状态", old: user.status, new: status },
  ]);
}

export async function userFormOptions(actor: Actor) {
  await assertOps(actor, "读取账号表单");
  const [enterprises, talents] = await Promise.all([
    prisma.enterprise.findMany({ select: { id: true, name: true, code: true }, orderBy: { name: "asc" } }),
    prisma.talent.findMany({
      where: { account: null },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { enterprises, talents };
}

export async function listAudit(actor: Actor, filters: { entityType?: string; skip: number; pageSize: number }) {
  await assertOps(actor, "查看审计日志");
  const where: Prisma.AuditLogWhereInput = {};
  if (filters.entityType) where.entityType = filters.entityType;
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { displayName: true, loginName: true } } },
      orderBy: { createdAt: "desc" },
      skip: filters.skip,
      take: filters.pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { rows, total };
}

export async function listLoginLogs(actor: Actor, filters: { skip: number; pageSize: number }) {
  await assertOps(actor, "查看登录日志");
  const [rows, total] = await Promise.all([
    prisma.loginLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: filters.skip,
      take: filters.pageSize,
    }),
    prisma.loginLog.count(),
  ]);
  return { rows, total };
}

export async function listSecurityLogs(actor: Actor, filters: { skip: number; pageSize: number }) {
  await assertOps(actor, "查看安全日志");
  const [rows, total] = await Promise.all([
    prisma.securityLog.findMany({
      include: { actor: { select: { displayName: true, loginName: true } } },
      orderBy: { createdAt: "desc" },
      skip: filters.skip,
      take: filters.pageSize,
    }),
    prisma.securityLog.count(),
  ]);
  return { rows, total };
}

export async function getDashboard(actor: Actor) {
  if (actor.role === "ops") {
    const monthStart = monthRange(
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7),
    );
    const [pendingQa, overdue, rework, anomaly, acceptedMonth, recentTasks, recentLogs] = await Promise.all([
      prisma.task.count({ where: { status: "submitted" } }),
      prisma.task.count({
        where: { status: { in: ["assigned", "in_progress", "submitted", "rework"] }, planEndAt: { lt: new Date() } },
      }),
      prisma.task.count({ where: { status: "rework" } }),
      prisma.complianceLedger.count({ where: { checkStatus: "anomaly" } }),
      prisma.task.count({
        where: { status: "accepted", actualEndAt: { gte: monthStart.start, lt: monthStart.end } },
      }),
      prisma.task.findMany({
        take: 6,
        orderBy: { updatedAt: "desc" },
        include: { enterprise: { select: { name: true } }, assignee: { select: { name: true } } },
      }),
      prisma.auditLog.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { displayName: true } } },
      }),
    ]);
    return { kind: "ops" as const, pendingQa, overdue, rework, anomaly, acceptedMonth, recentTasks, recentLogs };
  }
  if (actor.role === "enterprise") {
    if (!actor.enterpriseId) return { kind: "enterprise" as const, enterprise: null, counts: [], bill: null };
    const enterprise = await prisma.enterprise.findUnique({ where: { id: actor.enterpriseId } });
    const grouped = await prisma.task.groupBy({
      by: ["status"],
      where: { enterpriseId: actor.enterpriseId },
      _count: { _all: true },
    });
    const bill = await prisma.bill.findFirst({
      where: { enterpriseId: actor.enterpriseId, status: { in: ["issued", "confirmed"] } },
      orderBy: { yearMonth: "desc" },
    });
    return { kind: "enterprise" as const, enterprise, counts: grouped, bill };
  }
  if (!actor.talentId) return { kind: "worker" as const, tasks: [], counts: [] };
  const [tasks, grouped] = await Promise.all([
    prisma.task.findMany({
      where: { assigneeTalentId: actor.talentId, status: { in: ["assigned", "in_progress", "rework", "submitted"] } },
      orderBy: { planEndAt: "asc" },
      take: 8,
      include: { enterprise: { select: { name: true } }, position: { select: { name: true } } },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: { assigneeTalentId: actor.talentId },
      _count: { _all: true },
    }),
  ]);
  return { kind: "worker" as const, tasks, counts: grouped };
}

export async function myProfile(actor: Actor) {
  if (actor.role !== "worker" || !actor.talentId) await deny(actor, "查看执行端档案");
  const talentId = actor.talentId;
  if (!talentId) throw new AppError("档案不存在", "NOT_FOUND");
  const talent = await prisma.talent.findUnique({
    where: { id: talentId },
    include: {
      currentEnterprise: { select: { name: true } },
      currentPosition: { select: { name: true } },
    },
  });
  if (!talent) throw new AppError("档案不存在", "NOT_FOUND");
  return talent;
}
