import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { assertOps, canReadEnterprise, deny } from "@/server/access";
import { writeAudit } from "@/server/audit";
import type { Actor, Adjustment } from "@/server/types";
import {
  fenToYuan,
  makeCode,
  monthRange,
  parseStringArray,
  parseYuanToFen,
  weeksOverlappingMonth,
} from "@/lib/format";
import { SETTLEMENT_CYCLE } from "@/lib/labels";
import { Prisma } from "@prisma/client";

function parseAdjustments(raw: string): Adjustment[] {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        const row = item as Partial<Adjustment>;
        return {
          name: String(row.name ?? ""),
          amount: Number(row.amount ?? 0),
          remark: String(row.remark ?? ""),
        };
      })
      .filter((item) => item.name);
  } catch {
    return [];
  }
}

function totalOf(positionFee: number, platformFee: number, adjustments: Adjustment[]) {
  return positionFee + platformFee + adjustments.reduce((sum, item) => sum + item.amount, 0);
}

async function nextBillCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = makeCode("ZD");
    const exists = await prisma.bill.findUnique({ where: { code } });
    if (!exists) return code;
  }
  return `ZD-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Q3 建议默认：岗位费与 settlement_cycle 一致。
 * - 按人月：生成账单时、该岗位状态为在岗的人数 × 单价（不回溯月中入离职）
 * - 按件：账单月内 actualEndAt 落在该月、状态为已验收的任务数 × 单价
 * - 按周：账单月重叠的自然周数 × 当前在岗人数 × 单价
 * 只统计启用岗位。平台服务费取覆盖该月、签约状态为已签约或执行中的方案；多条时优先执行中。
 */
export async function buildBillDraft(actor: Actor, enterpriseId: string, yearMonth: string) {
  await assertOps(actor, `生成账单 ${enterpriseId} ${yearMonth}`);
  const range = monthRange(yearMonth);
  const enterprise = await prisma.enterprise.findUnique({ where: { id: enterpriseId } });
  if (!enterprise) throw new AppError("企业不存在", "NOT_FOUND");

  const existing = await prisma.bill.findUnique({
    where: { enterpriseId_yearMonth: { enterpriseId, yearMonth } },
  });
  if (existing && existing.status !== "draft" && existing.status !== "voided") {
    throw new AppError("该月账单已出账或已确认，不能重新生成");
  }

  const positions = await prisma.position.findMany({
    where: { enterpriseId, status: "active" },
    orderBy: { createdAt: "asc" },
  });
  const plans = await prisma.plan.findMany({
    where: {
      enterpriseId,
      signStatus: { in: ["signed", "executing"] },
      startDate: { lt: range.end },
      endDate: { gte: range.start },
    },
    orderBy: { startDate: "desc" },
  });
  const plan = plans.find((item) => item.signStatus === "executing") ?? plans[0] ?? null;
  if (positions.length === 0 && !plan) {
    throw new AppError("该企业在该月没有启用岗位，也没有覆盖该月的已签约或执行中方案");
  }

  const lineData: {
    positionId: string;
    positionName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    amount: number;
    remark: string;
  }[] = [];

  for (const position of positions) {
    if (position.settlementCycle === "per_piece") {
      const quantity = await prisma.task.count({
        where: {
          positionId: position.id,
          status: "accepted",
          actualEndAt: { gte: range.start, lt: range.end },
        },
      });
      lineData.push({
        positionId: position.id,
        positionName: position.name,
        quantity,
        unit: "件",
        unitPrice: position.unitPrice,
        amount: quantity * position.unitPrice,
        remark: `按件：${yearMonth} 已验收 ${quantity} 件 × 单价 ${fenToYuan(position.unitPrice)} 元`,
      });
    } else if (position.settlementCycle === "per_headcount_month") {
      const quantity = await prisma.talent.count({
        where: { currentPositionId: position.id, status: "on_duty" },
      });
      lineData.push({
        positionId: position.id,
        positionName: position.name,
        quantity,
        unit: "人月",
        unitPrice: position.unitPrice,
        amount: quantity * position.unitPrice,
        remark: `按人月：生成时在岗 ${quantity} 人 × 单价 ${fenToYuan(position.unitPrice)} 元。未回溯月中入离职。`,
      });
    } else if (position.settlementCycle === "per_week") {
      const people = await prisma.talent.count({
        where: { currentPositionId: position.id, status: "on_duty" },
      });
      const weeks = weeksOverlappingMonth(yearMonth);
      const quantity = weeks * people;
      lineData.push({
        positionId: position.id,
        positionName: position.name,
        quantity,
        unit: "人周",
        unitPrice: position.unitPrice,
        amount: quantity * position.unitPrice,
        remark: `按周：${yearMonth} 重叠自然周 ${weeks} × 在岗 ${people} 人 × 单价 ${fenToYuan(position.unitPrice)} 元`,
      });
    } else {
      throw new AppError(`岗位 ${position.name} 的结算周期无法识别`);
    }
  }

  const positionFeeTotal = lineData.reduce((sum, line) => sum + line.amount, 0);
  const platformServiceFee = plan?.monthlyServiceFee ?? 0;
  const adjustments = existing ? parseAdjustments(existing.adjustments) : [];
  const pricingNote = [
    plan
      ? `平台服务费来自方案 ${plan.code}（${plan.planVersion}，${plan.signStatus === "executing" ? "执行中" : "已签约"}）的月服务费。`
      : "覆盖该月的已签约/执行中方案不存在，平台服务费按 0 计。",
    "岗位费只统计启用岗位。",
    "按人月、按周取生成账单当时的在岗人数，不回溯月中入离职（Q3 待产品确认是否改为月内在岗人天）。",
    `结算周期口径：${positions.map((item) => `${item.name} ${SETTLEMENT_CYCLE[item.settlementCycle] ?? item.settlementCycle}`).join("；") || "无启用岗位"}。`,
  ].join("");

  const totals = {
    positionFeeTotal,
    platformServiceFee,
    adjustments: JSON.stringify(adjustments),
    totalAmount: totalOf(positionFeeTotal, platformServiceFee, adjustments),
    pricingNote,
    status: "draft",
    invoiceStatus: "none",
    invoiceNo: null,
    paymentStatus: "unpaid",
    paidAmount: 0,
  };

  const code = existing?.code ?? (await nextBillCode());
  const bill = await prisma.$transaction(async (tx) => {
    const saved = existing
      ? await tx.bill.update({
          where: { id: existing.id },
          data: totals,
        })
      : await tx.bill.create({
          data: {
            code,
            enterpriseId,
            yearMonth,
            createdById: actor.id,
            ...totals,
          },
        });
    await tx.billLineItem.deleteMany({ where: { billId: saved.id } });
    if (lineData.length > 0) {
      await tx.billLineItem.createMany({
        data: lineData.map((line) => ({ ...line, billId: saved.id })),
      });
    }
    return saved;
  });

  await writeAudit(actor, "bill", bill.id, existing ? "generate" : "generate", null, `生成 ${enterprise.name} ${yearMonth} 草稿账单`);
  return bill;
}

export async function listBills(
  actor: Actor,
  filters: { enterpriseId?: string; yearMonth?: string; page: number; pageSize: number; skip: number },
) {
  const where: Prisma.BillWhereInput = {};
  if (actor.role === "enterprise") {
    if (!actor.enterpriseId) return { rows: [], total: 0 };
    where.enterpriseId = actor.enterpriseId;
    where.status = { in: ["issued", "confirmed"] };
  } else if (actor.role === "worker") {
    await deny(actor, "执行端查看账单列表");
  } else if (filters.enterpriseId) {
    where.enterpriseId = filters.enterpriseId;
  }
  if (filters.yearMonth) where.yearMonth = filters.yearMonth;
  const [rows, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      include: { enterprise: { select: { id: true, name: true, code: true } } },
      orderBy: [{ yearMonth: "desc" }, { createdAt: "desc" }],
      skip: filters.skip,
      take: filters.pageSize,
    }),
    prisma.bill.count({ where }),
  ]);
  return { rows, total };
}

export async function getBill(actor: Actor, id: string) {
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: {
      enterprise: true,
      lineItems: { orderBy: { positionName: "asc" } },
      createdBy: { select: { displayName: true } },
    },
  });
  if (!bill) throw new AppError("账单不存在", "NOT_FOUND");
  if (actor.role === "worker") await deny(actor, `执行端查看账单 ${id}`);
  if (actor.role === "enterprise") {
    if (actor.enterpriseId !== bill.enterpriseId) await deny(actor, `越权查看账单 ${id}`);
    if (bill.status !== "issued" && bill.status !== "confirmed") {
      throw new AppError("账单不存在", "NOT_FOUND");
    }
  }
  return { ...bill, adjustmentList: parseAdjustments(bill.adjustments) };
}

async function requireDraft(actor: Actor, id: string) {
  await assertOps(actor, `修改账单 ${id}`);
  const bill = await prisma.bill.findUnique({ where: { id } });
  if (!bill) throw new AppError("账单不存在", "NOT_FOUND");
  if (bill.status !== "draft") throw new AppError("只有草稿账单可以改费用明细");
  return bill;
}

export async function addAdjustment(
  actor: Actor,
  id: string,
  input: { name: string; amount: string; remark: string },
) {
  const bill = await requireDraft(actor, id);
  const name = input.name.trim();
  if (!name) throw new AppError("请填写增减项名称");
  const amount = parseYuanToFen(input.amount, "增减项金额");
  if (amount === 0) throw new AppError("增减项金额不能为 0");
  const adjustments = parseAdjustments(bill.adjustments);
  adjustments.push({ name, amount, remark: input.remark.trim() });
  const saved = await prisma.bill.update({
    where: { id },
    data: {
      adjustments: JSON.stringify(adjustments),
      totalAmount: totalOf(bill.positionFeeTotal, bill.platformServiceFee, adjustments),
    },
  });
  await writeAudit(actor, "bill", id, "adjustment", [
    { field: "增减项", old: "—", new: `${name} ${fenToYuan(amount)}` },
  ]);
  return saved;
}

export async function removeAdjustment(actor: Actor, id: string, index: number) {
  const bill = await requireDraft(actor, id);
  const adjustments = parseAdjustments(bill.adjustments);
  if (!adjustments[index]) throw new AppError("增减项不存在", "NOT_FOUND");
  const removed = adjustments[index];
  adjustments.splice(index, 1);
  await prisma.bill.update({
    where: { id },
    data: {
      adjustments: JSON.stringify(adjustments),
      totalAmount: totalOf(bill.positionFeeTotal, bill.platformServiceFee, adjustments),
    },
  });
  await writeAudit(actor, "bill", id, "adjustment", [
    { field: "增减项", old: `${removed.name} ${fenToYuan(removed.amount)}`, new: "已移除" },
  ]);
}

async function requireIssuedLike(actor: Actor, id: string) {
  await assertOps(actor, `更新账单状态 ${id}`);
  const bill = await prisma.bill.findUnique({ where: { id } });
  if (!bill) throw new AppError("账单不存在", "NOT_FOUND");
  return bill;
}

export async function issueBill(actor: Actor, id: string) {
  const bill = await requireIssuedLike(actor, id);
  if (bill.status !== "draft") throw new AppError("只有草稿可以出账");
  await prisma.bill.update({ where: { id }, data: { status: "issued" } });
  await writeAudit(actor, "bill", id, "issue", [{ field: "状态", old: "草稿", new: "已出账" }]);
}

export async function confirmBill(actor: Actor, id: string) {
  const bill = await requireIssuedLike(actor, id);
  if (bill.status !== "issued") throw new AppError("只有已出账账单可以确认");
  await prisma.bill.update({ where: { id }, data: { status: "confirmed" } });
  await writeAudit(actor, "bill", id, "confirm", [{ field: "状态", old: "已出账", new: "已确认" }]);
}

export async function voidBill(actor: Actor, id: string, remark: string) {
  const bill = await requireIssuedLike(actor, id);
  if (bill.status === "voided") throw new AppError("账单已作废");
  const note = remark.trim();
  if (note.length < 2) throw new AppError("作废请填写原因");
  await prisma.bill.update({
    where: { id },
    data: { status: "voided", remark: bill.remark ? `${bill.remark}\n作废：${note}` : `作废：${note}` },
  });
  await writeAudit(actor, "bill", id, "void", [{ field: "状态", old: bill.status, new: "作废" }], note);
}

export async function updateInvoice(
  actor: Actor,
  id: string,
  input: { invoiceStatus: string; invoiceNo: string },
) {
  const bill = await requireIssuedLike(actor, id);
  if (bill.status !== "issued" && bill.status !== "confirmed") {
    throw new AppError("出账后才能登记开票");
  }
  if (!["none", "issued", "partial"].includes(input.invoiceStatus)) {
    throw new AppError("开票状态不正确");
  }
  const invoiceNo = input.invoiceNo.trim();
  await prisma.bill.update({
    where: { id },
    data: {
      invoiceStatus: input.invoiceStatus,
      invoiceNo: input.invoiceStatus === "none" ? null : invoiceNo || null,
    },
  });
  await writeAudit(actor, "bill", id, "invoice", [
    { field: "开票状态", old: bill.invoiceStatus, new: input.invoiceStatus },
    { field: "发票号", old: bill.invoiceNo ?? "", new: invoiceNo },
  ]);
}

export async function updatePayment(
  actor: Actor,
  id: string,
  input: { paymentStatus: string; paidAmount: string },
) {
  const bill = await requireIssuedLike(actor, id);
  if (bill.status !== "issued" && bill.status !== "confirmed") {
    throw new AppError("出账后才能登记回款");
  }
  if (!["unpaid", "partial", "paid"].includes(input.paymentStatus)) {
    throw new AppError("回款状态不正确");
  }
  const paidAmount = parseYuanToFen(input.paidAmount || "0", "已回款金额");
  if (paidAmount < 0) throw new AppError("已回款金额不能为负");
  if (input.paymentStatus === "unpaid" && paidAmount !== 0) {
    throw new AppError("未回款时，已回款金额须为 0");
  }
  if (input.paymentStatus === "paid" && paidAmount !== bill.totalAmount) {
    throw new AppError("已回款时，已回款金额须等于应付合计");
  }
  if (input.paymentStatus === "partial" && !(paidAmount > 0 && paidAmount < bill.totalAmount)) {
    throw new AppError("部分回款金额须大于 0 且小于应付合计");
  }
  await prisma.bill.update({
    where: { id },
    data: { paymentStatus: input.paymentStatus, paidAmount },
  });
  await writeAudit(actor, "bill", id, "payment", [
    { field: "回款状态", old: bill.paymentStatus, new: input.paymentStatus },
    { field: "已回款", old: fenToYuan(bill.paidAmount), new: fenToYuan(paidAmount) },
  ]);
}

export async function enterprisesForBilling(actor: Actor) {
  await assertOps(actor, "读取开账企业");
  return prisma.enterprise.findMany({
    where: { status: { not: "terminated" } },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });
}

export { parseAdjustments, canReadEnterprise, parseStringArray };
