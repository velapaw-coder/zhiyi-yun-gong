import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { assertOps, canReadEnterprise, deny } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { makeCode } from "@/lib/format";
import { REGIONS, calculateLevy, type LevyInput, type LevyResult } from "@/lib/levy";
import type { Actor } from "@/server/types";

export const PROPOSAL_STATUS: Record<string, string> = {
  draft: "草稿",
  sent: "已发送",
  converted: "已转签单",
};

const FEE_KEY = "calc.serviceFeeFen";
export const DEFAULT_FEE_FEN = 50000;

export async function getServiceFeeFen() {
  const row = await prisma.appSetting.findUnique({ where: { key: FEE_KEY } });
  const fen = row ? Number(row.value) : DEFAULT_FEE_FEN;
  return Number.isInteger(fen) && fen >= 0 ? fen : DEFAULT_FEE_FEN;
}

export async function setServiceFee(actor: Actor, yuanText: string) {
  await assertOps(actor, "修改计算器服务费");
  const yuanValue = Number(String(yuanText).trim());
  if (!Number.isFinite(yuanValue) || yuanValue < 0 || yuanValue > 100000) throw new AppError("服务费须为 0–100000 元");
  const fen = Math.round(yuanValue * 100);
  const old = await getServiceFeeFen();
  await prisma.appSetting.upsert({ where: { key: FEE_KEY }, create: { key: FEE_KEY, value: String(fen) }, update: { value: String(fen) } });
  await writeAudit(actor, "setting", FEE_KEY, "update", [{ field: "计算器服务费（元/人/月）", old: String(old / 100), new: String(fen / 100) }], null);
  return fen;
}

function num(form: Record<string, string>, key: string, label: string, opts: { int?: boolean; max?: number } = {}) {
  const raw = String(form[key] ?? "").replace(/[,，\s]/g, "");
  if (raw === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new AppError(`${label}须为不小于 0 的数字`);
  if (opts.int && !Number.isInteger(n)) throw new AppError(`${label}须为整数`);
  if (opts.max !== undefined && n > opts.max) throw new AppError(`${label}过大`);
  return n;
}

/** 把表单字段转成测算输入，在服务端重新计算，不信任前端结果。 */
export function parseLevyForm(form: Record<string, string>): { input: LevyInput; region: string } {
  const region = REGIONS.some((r) => r.code === form.region) ? form.region : "custom";
  const ratio = num(form, "ratio", "安置比例", { max: 10 });
  if (ratio < 1.5) throw new AppError("安置比例不得低于国家规定的 1.5%");
  const employees = num(form, "employees", "在职职工人数", { int: true, max: 10_000_000 });
  if (employees < 1) throw new AppError("请填写在职职工人数");
  const input: LevyInput = {
    employees,
    ratioBp: Math.round(ratio * 100),
    avgWageYuan: num(form, "avgWage", "职工年平均工资", { max: 100_000_000 }),
    socialAvgWageYuan: num(form, "socialAvgWage", "社会平均工资", { max: 100_000_000 }),
    minWageYuan: num(form, "minWage", "最低工资", { max: 1_000_000 }),
    monthlyWageYuan: num(form, "monthlyWage", "安置人员月工资", { max: 1_000_000 }),
    monthlySocialYuan: num(form, "monthlySocial", "社保", { max: 1_000_000 }),
    placedMild: num(form, "placedMild", "已安置轻度人数", { int: true, max: 1_000_000 }),
    placedSevere: num(form, "placedSevere", "已安置重度人数", { int: true, max: 1_000_000 }),
    newKind: form.newKind === "mild" ? "mild" : "severe",
    serviceFeeYuan: num(form, "serviceFee", "服务费", { max: 100_000 }),
    onsiteManageYuan: 200,
    isEnterprise: form.isEnterprise === "on" || form.isEnterprise === "true",
  };
  if (input.avgWageYuan <= 0) throw new AppError("请填写职工年平均工资");
  return { input, region };
}

export async function listProposals(actor: Actor, filters: { q?: string; skip: number; pageSize: number }) {
  const where: Prisma.ProposalWhereInput = {};
  if (actor.role === "enterprise") {
    if (!actor.enterpriseId) await deny(actor, "企业账号未绑定企业，查看方案书");
    where.enterpriseId = actor.enterpriseId;
  } else if (actor.role !== "ops") {
    await deny(actor, "查看方案书列表");
  }
  if (filters.q) where.OR = [{ companyName: { contains: filters.q } }, { code: { contains: filters.q } }];
  const [rows, total] = await Promise.all([
    prisma.proposal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: filters.skip,
      take: filters.pageSize,
      select: { id: true, code: true, companyName: true, region: true, status: true, result: true, createdAt: true, enterpriseId: true, planId: true },
    }),
    prisma.proposal.count({ where }),
  ]);
  return {
    total,
    rows: rows.map((row) => {
      const result = JSON.parse(row.result) as LevyResult;
      return { ...row, result: undefined, levyFen: result.current.levyFen, netFen: result.recommended.netFen, newPersons: result.recommended.newPersons };
    }),
  };
}

export async function getProposal(actor: Actor, id: string) {
  const row = await prisma.proposal.findUnique({
    where: { id },
    include: { enterprise: { select: { id: true, name: true, code: true } }, createdBy: { select: { displayName: true } } },
  });
  if (!row) throw new AppError("方案书不存在", "NOT_FOUND");
  if (actor.role === "ops") {
    // ok
  } else if (!row.enterpriseId || !canReadEnterprise(actor, row.enterpriseId)) {
    await deny(actor, `越权查看方案书 ${row.code}`);
  }
  const plan = row.planId ? await prisma.plan.findUnique({ where: { id: row.planId }, select: { id: true, code: true, planVersion: true } }) : null;
  return { ...row, plan, parsed: JSON.parse(row.result) as LevyResult, inputValues: JSON.parse(row.inputs) as LevyInput };
}

export async function createProposal(actor: Actor, form: Record<string, string>) {
  await assertOps(actor, "创建方案书");
  let enterpriseId: string | null = null;
  let companyName = String(form.companyName ?? "").trim();
  if (form.enterpriseId) {
    const enterprise = await prisma.enterprise.findUnique({ where: { id: form.enterpriseId }, select: { id: true, name: true } });
    if (!enterprise) throw new AppError("企业不存在");
    enterpriseId = enterprise.id;
    companyName = enterprise.name;
  }
  if (!companyName) throw new AppError("请选择企业或填写企业名称");
  if (companyName.length > 80) throw new AppError("企业名称过长");
  const remark = String(form.remark ?? "").trim();
  if (remark.length > 2000) throw new AppError("备注过长");
  const { input, region } = parseLevyForm(form);
  const result = calculateLevy(input);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = makeCode("PS");
    if (await prisma.proposal.findUnique({ where: { code }, select: { id: true } })) continue;
    const row = await prisma.proposal.create({
      data: {
        code,
        enterpriseId,
        companyName,
        region,
        inputs: JSON.stringify(input),
        result: JSON.stringify(result),
        serviceFee: Math.round(input.serviceFeeYuan * 100),
        remark: remark || null,
        createdById: actor.id,
      },
    });
    await writeAudit(actor, "proposal", row.id, "create", null, `${companyName} 残保金方案书 ${code}`);
    return row;
  }
  throw new AppError("编号生成失败，请重试");
}

export async function setProposalStatus(actor: Actor, id: string, status: string) {
  await assertOps(actor, "修改方案书状态");
  if (status !== "draft" && status !== "sent") throw new AppError("状态不正确");
  const row = await prisma.proposal.findUnique({ where: { id } });
  if (!row) throw new AppError("方案书不存在", "NOT_FOUND");
  if (row.status === "converted") throw new AppError("已转签单的方案书不能改状态");
  await prisma.proposal.update({ where: { id }, data: { status } });
  await writeAudit(actor, "proposal", id, "status", [{ field: "状态", old: PROPOSAL_STATUS[row.status] ?? row.status, new: PROPOSAL_STATUS[status] }], null);
}

export async function deleteProposal(actor: Actor, id: string) {
  await assertOps(actor, "删除方案书");
  const row = await prisma.proposal.findUnique({ where: { id } });
  if (!row) throw new AppError("方案书不存在", "NOT_FOUND");
  if (row.status === "converted") throw new AppError("已转签单的方案书不能删除");
  await prisma.proposal.delete({ where: { id } });
  await writeAudit(actor, "proposal", id, "delete", null, `${row.companyName} ${row.code}`);
}

/** 潜在客户先建企业档案后，把方案书挂到企业上。 */
export async function linkProposalEnterprise(actor: Actor, id: string, enterpriseId: string) {
  await assertOps(actor, "方案书关联企业");
  const [row, enterprise] = await Promise.all([
    prisma.proposal.findUnique({ where: { id } }),
    prisma.enterprise.findUnique({ where: { id: enterpriseId }, select: { id: true, name: true } }),
  ]);
  if (!row || !enterprise) throw new AppError("方案书或企业不存在", "NOT_FOUND");
  await prisma.proposal.update({ where: { id }, data: { enterpriseId: enterprise.id, companyName: enterprise.name } });
  await writeAudit(actor, "proposal", id, "link", [{ field: "企业", old: row.companyName, new: enterprise.name }], null);
}

export async function markProposalConverted(actor: Actor, id: string, planId: string) {
  await assertOps(actor, "方案书转签单");
  const row = await prisma.proposal.findUnique({ where: { id } });
  if (!row) return;
  await prisma.proposal.update({ where: { id }, data: { status: "converted", planId } });
  await writeAudit(actor, "proposal", id, "convert", null, `转为签单方案 ${planId}`);
}

/** 新建方案页的预填值（单位：元，日期为 YYYY-MM-DD）。 */
export function planDefaultsFromProposal(p: { code: string; parsed: LevyResult; serviceFee: number }, today: Date) {
  const r = p.parsed;
  const rec = r.recommended;
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
  const end = new Date(Date.UTC(start.getUTCFullYear() + 1, start.getUTCMonth(), 0));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    planVersion: `方案书 ${p.code}`.slice(0, 40),
    disabilityFundBase: (r.current.baseLevyFen / 100).toFixed(2),
    disabilityFundGap: (r.current.levyFen / 100).toFixed(2),
    monthlyServiceFee: ((p.serviceFee * rec.newPersons) / 100).toFixed(2),
    startDate: iso(start),
    endDate: iso(end),
    signStatus: "pending",
    remark: [
      `来自残保金方案书 ${p.code}`,
      `残保金基数=减缴前应缴 ¥${(r.current.baseLevyFen / 100).toFixed(2)}；缺口=当前实际应缴 ¥${(r.current.levyFen / 100).toFixed(2)}`,
      `推荐：${rec.label}，新增 ${rec.newPersons} 人，年节省 ¥${(rec.savingFen / 100).toFixed(2)}，年净节省 ¥${(rec.netFen / 100).toFixed(2)}`,
      `月服务费 = ${p.serviceFee / 100} 元/人/月 × ${rec.newPersons} 人`,
    ].join("\n"),
  };
}
