import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { assertOps } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { calculateLevy, type LevyResult } from "@/lib/levy";
import { createProposal, parseLevyForm } from "@/server/proposals";
import type { Actor } from "@/server/types";

export const LEAD_STATUS: Record<string, string> = {
  new: "新线索",
  contacted: "已联系",
  proposed: "已出方案",
  signed: "已签约",
  invalid: "无效",
};

export const CN_MOBILE = /^1[3-9]\d{9}$/;
const DRAFT_KEYS = ["region", "ratio", "employees", "avgWage", "socialAvgWage", "minWage", "monthlyWage", "monthlySocial", "placedMild", "placedSevere", "newKind", "serviceFee", "isEnterprise"];

export type LeadPayload = {
  company?: unknown;
  contact?: unknown;
  phone?: unknown;
  plan?: unknown;
  note?: unknown;
  website?: unknown; // honeypot
  source?: unknown;
  calc?: unknown;
};

const s = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

async function sha(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf).slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** 公开提交。返回 { id, result }，result 是服务端重算的测算结果（供前端打印报告）。 */
export async function submitLead(body: LeadPayload, ip: string) {
  if (s(body.website, 200)) return { id: "ok", result: null, spam: true }; // 蜜罐：静默成功
  const company = s(body.company, 80);
  const contact = s(body.contact, 30);
  const phone = s(body.phone, 20).replace(/[\s-]/g, "").replace(/^\+?86/, "");
  if (!company) throw new AppError("请填写企业名称");
  if (!contact) throw new AppError("请填写联系人");
  if (!CN_MOBILE.test(phone)) throw new AppError("请填写正确的 11 位手机号码");
  const plan = s(body.plan, 40) || null;
  const note = s(body.note, 600) || null;
  const source = s(body.source, 40) || "/";

  let calcInput: string | null = null;
  let calcResult: string | null = null;
  let result: LevyResult | null = null;
  if (body.calc && typeof body.calc === "object") {
    const raw = body.calc as Record<string, unknown>;
    const form: Record<string, string> = {};
    for (const k of DRAFT_KEYS) form[k] = s(raw[k], 30);
    try {
      const { input } = parseLevyForm(form);
      result = calculateLevy(input);
      calcInput = JSON.stringify(form);
      calcResult = JSON.stringify(result);
    } catch {
      // 参数不完整就当没测算，不挡住留资
    }
  }

  const ipHash = await sha(`zy-lead:${ip}`);
  const tenMin = new Date(Date.now() - 10 * 60_000);
  const day = new Date(Date.now() - 24 * 3600_000);
  const [byIp, byPhone] = await Promise.all([
    prisma.lead.count({ where: { ipHash, createdAt: { gte: tenMin } } }),
    prisma.lead.count({ where: { phone, createdAt: { gte: day } } }),
  ]);
  if (byIp >= 5) throw new AppError("提交太频繁，请稍后再试", "RATE_LIMIT");
  if (byPhone >= 3) throw new AppError("该手机号今天已提交过，顾问会尽快联系您", "RATE_LIMIT");

  const row = await prisma.lead.create({ data: { company, contact, phone, plan, note, calcInput, calcResult, source, ipHash } });
  return { id: row.id, result, spam: false };
}

export async function countNewLeads() {
  return prisma.lead.count({ where: { status: "new" } });
}

export async function listLeads(actor: Actor, f: { status?: string; q?: string; skip: number; pageSize: number }) {
  await assertOps(actor, "查看线索");
  const where: Prisma.LeadWhereInput = {};
  if (f.status && LEAD_STATUS[f.status]) where.status = f.status;
  if (f.q) where.OR = [{ company: { contains: f.q } }, { contact: { contains: f.q } }, { phone: { contains: f.q } }];
  const [rows, total] = await Promise.all([
    prisma.lead.findMany({ where, orderBy: { createdAt: "desc" }, skip: f.skip, take: f.pageSize }),
    prisma.lead.count({ where }),
  ]);
  return {
    total,
    rows: rows.map((r) => {
      const res = r.calcResult ? (JSON.parse(r.calcResult) as LevyResult) : null;
      return { ...r, levyFen: res?.current.levyFen ?? null, netFen: res?.recommended.netFen ?? null };
    }),
  };
}

export async function getLead(actor: Actor, id: string) {
  await assertOps(actor, "查看线索详情");
  const row = await prisma.lead.findUnique({ where: { id } });
  if (!row) throw new AppError("线索不存在", "NOT_FOUND");
  return {
    ...row,
    input: row.calcInput ? (JSON.parse(row.calcInput) as Record<string, string>) : null,
    result: row.calcResult ? (JSON.parse(row.calcResult) as LevyResult) : null,
  };
}

export async function updateLead(actor: Actor, id: string, status: string, ownerNote: string) {
  await assertOps(actor, "更新线索");
  if (!LEAD_STATUS[status]) throw new AppError("状态不正确");
  if (ownerNote.length > 2000) throw new AppError("备注过长");
  const row = await prisma.lead.findUnique({ where: { id } });
  if (!row) throw new AppError("线索不存在", "NOT_FOUND");
  await prisma.lead.update({ where: { id }, data: { status, ownerNote: ownerNote.trim() || null } });
  if (row.status !== status) {
    await writeAudit(actor, "lead", id, "status", [{ field: "状态", old: LEAD_STATUS[row.status] ?? row.status, new: LEAD_STATUS[status] }], null);
  }
}

/** 用线索的测算参数一键生成方案书，并把线索标为已出方案。 */
export async function proposalFromLead(actor: Actor, id: string) {
  await assertOps(actor, "线索生成方案书");
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) throw new AppError("线索不存在", "NOT_FOUND");
  if (lead.proposalId) {
    const existing = await prisma.proposal.findUnique({ where: { id: lead.proposalId }, select: { id: true } });
    if (existing) return existing;
  }
  if (!lead.calcInput) throw new AppError("这条线索没有测算数据，请到「新建方案书」手动填写参数");
  const form = JSON.parse(lead.calcInput) as Record<string, string>;
  const remark = [`来自线索：${lead.company} · ${lead.contact} ${lead.phone}`, lead.plan ? `意向：${lead.plan}` : "", lead.note ? `需求：${lead.note}` : ""]
    .filter(Boolean)
    .join("\n");
  const row = await createProposal(actor, { ...form, companyName: lead.company, remark });
  await prisma.lead.update({ where: { id }, data: { proposalId: row.id, status: lead.status === "signed" ? "signed" : "proposed" } });
  await writeAudit(actor, "lead", id, "proposal", null, `生成方案书 ${row.code}`);
  return { id: row.id };
}
