/**
 * 领域回归：任务生命周期、权限隔离、按件账单、强制派发、台账唯一、ISO 周数。
 * 使用独立库 DATABASE_URL=file:./verify.db，不碰演示数据。
 */
import { prisma } from "../src/server/db";
import { AppError } from "../src/server/errors";
import { weeksOverlappingMonth } from "../src/lib/format";
import { buildBillDraft, getBill, listBills } from "../src/server/billing";
import { createLedger, getEnterprise, getTalent } from "../src/server/repo";
import {
  acceptTask,
  claimTask,
  createTask,
  getTask,
  listTasks,
  rejectTask,
  submitTask,
} from "../src/server/tasks";
import type { Actor } from "../src/server/types";
import {
  createProposal,
  getProposal,
  getServiceFeeFen,
  linkProposalEnterprise,
  listProposals,
  markProposalConverted,
  planDefaultsFromProposal,
  setServiceFee,
} from "../src/server/proposals";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectError(work: () => Promise<unknown>, code: AppError["code"], hint: string) {
  try {
    await work();
  } catch (error) {
    assert(error instanceof AppError, `${hint} 应抛出 AppError，实际 ${String(error)}`);
    assert(error.code === code, `${hint} 期望 ${code}，实际 ${error.code}：${error.message}`);
    return;
  }
  throw new Error(`${hint} 应当失败`);
}

async function wipe() {
  await prisma.proposal.deleteMany();
  await prisma.appSetting.deleteMany();
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
}

async function main() {
  assert(weeksOverlappingMonth("2026-10") === 5, "2026-10 应重叠 5 个 ISO 周");

  await wipe();
  await prisma.enterprise.create({
    data: {
      id: "ent_a",
      code: "ZY-A",
      name: "样例制造 A",
      scaleHeadcount: 100,
      contactName: "王敏",
      contactPhone: "13800001001",
      status: "signed",
    },
  });
  await prisma.enterprise.create({
    data: {
      id: "ent_b",
      code: "ZY-B",
      name: "瀚海跨境",
      scaleHeadcount: 40,
      contactName: "李航",
      contactPhone: "13800001002",
      status: "signed",
    },
  });
  await prisma.plan.create({
    data: {
      id: "plan_a",
      code: "FA-A",
      enterpriseId: "ent_a",
      planVersion: "V1",
      disabilityFundBase: 1,
      disabilityFundGap: 1,
      monthlyServiceFee: 3_600_000,
      startDate: new Date("2026-10-01T00:00:00+08:00"),
      endDate: new Date("2027-09-30T00:00:00+08:00"),
      signStatus: "executing",
      productLine: "compliance_single_position",
    },
  });
  await prisma.position.create({
    data: {
      id: "pos_a",
      code: "GW-A",
      enterpriseId: "ent_a",
      planId: "plan_a",
      name: "AI 内容编排助理",
      type: "AI_CONTENT_OPS",
      headcount: 2,
      deliveryStandard: "按条验收",
      qaRules: "条数达标",
      unitPrice: 18_000,
      settlementCycle: "per_piece",
      status: "active",
    },
  });
  await prisma.talent.create({
    data: {
      id: "talent_lin",
      code: "RC-LIN",
      name: "林晓",
      disabilityCertNo: "110101199001011234",
      disabilityType: "肢体",
      phone: "13900001001",
      trainingProgress: "graduated",
      trainingPercent: 100,
      status: "on_duty",
      currentEnterpriseId: "ent_a",
      currentPositionId: "pos_a",
    },
  });
  await prisma.talent.create({
    data: {
      id: "talent_zhou",
      code: "RC-ZHOU",
      name: "周宁",
      disabilityCertNo: "110101199202023333",
      disabilityType: "听力",
      phone: "13900001003",
      trainingProgress: "in_training",
      trainingPercent: 60,
      status: "eligible",
    },
  });
  await prisma.user.create({
    data: { id: "user_ops", loginName: "yunying", passwordHash: "x", displayName: "陈运营", role: "ops", status: "active" },
  });
  await prisma.user.create({
    data: {
      id: "user_ent_a",
      loginName: "qiye.a",
      passwordHash: "x",
      displayName: "王敏",
      role: "enterprise",
      enterpriseId: "ent_a",
      status: "active",
    },
  });
  await prisma.user.create({
    data: {
      id: "user_ent_b",
      loginName: "qiye.b",
      passwordHash: "x",
      displayName: "李航",
      role: "enterprise",
      enterpriseId: "ent_b",
      status: "active",
    },
  });
  await prisma.user.create({
    data: {
      id: "user_lin",
      loginName: "lin.xiao",
      passwordHash: "x",
      displayName: "林晓",
      role: "worker",
      talentId: "talent_lin",
      status: "active",
    },
  });

  const ops: Actor = { id: "user_ops", loginName: "yunying", displayName: "陈运营", role: "ops", enterpriseId: null, talentId: null };
  const entA: Actor = { id: "user_ent_a", loginName: "qiye.a", displayName: "王敏", role: "enterprise", enterpriseId: "ent_a", talentId: null };
  const entB: Actor = { id: "user_ent_b", loginName: "qiye.b", displayName: "李航", role: "enterprise", enterpriseId: "ent_b", talentId: null };
  const worker: Actor = { id: "user_lin", loginName: "lin.xiao", displayName: "林晓", role: "worker", enterpriseId: null, talentId: "talent_lin" };

  await expectError(() => createTask(ops, {
    positionId: "pos_a",
    talentId: "talent_zhou",
    title: "未强制",
    description: "培训未结业且未绑定岗位，不应直接派发。",
    planStartAt: "2026-10-02T09:00",
    planEndAt: "2026-10-08T18:00",
    force: false,
  }), "BAD_REQUEST", "未强制派发");

  const forced = await createTask(ops, {
    positionId: "pos_a",
    talentId: "talent_zhou",
    title: "强制派发样例",
    description: "培训未结业，运营勾选强制派发后应写入内部备注。",
    planStartAt: "2026-10-02T09:00",
    planEndAt: "2026-10-08T18:00",
    force: true,
  });
  const forcedView = await getTask(ops, forced.id);
  assert(forcedView.forceAssigned, "运营应看到强制派发标记");
  assert(forcedView.logs.some((log) => log.internal && log.comment?.includes("强制派发")), "应有内部备注");
  const forcedForEnterprise = await getTask(entA, forced.id);
  assert(!forcedForEnterprise.forceAssigned, "企业看不到强制派发标记");
  assert(forcedForEnterprise.logs.every((log) => !log.internal), "企业看不到强制派发内部备注");
  await expectError(() => getTask(entB, forced.id), "FORBIDDEN", "企业 B 不能看企业 A 的强制派发任务");

  const task = await createTask(ops, {
    positionId: "pos_a",
    talentId: "talent_lin",
    title: "十月商品文案",
    description: "为样例制造 A 编写 8 条商品卖点，按条验收。",
    planStartAt: "2026-10-06T09:00",
    planEndAt: "2026-10-12T18:00",
    force: false,
  });

  await expectError(() => getTask(entB, task.id), "FORBIDDEN", "企业 B 不能看企业 A 的任务");
  await expectError(() => getEnterprise(entB, "ent_a"), "FORBIDDEN", "企业 B 不能看企业 A");
  await expectError(() => getTalent(worker, "talent_zhou"), "FORBIDDEN", "执行端不能看他人档案");
  const ownList = await listTasks(worker, { skip: 0, pageSize: 20, view: "list" });
  assert(ownList.rows.every((row) => row.assigneeName === "林晓"), "执行端列表只含自己的任务");
  assert(ownList.rows.some((row) => row.id === task.id), "执行端应看到自己的新任务");

  await claimTask(worker, task.id);
  await expectError(
    () => submitTask(worker, task.id, { summary: "说明太短", links: "", fileIds: [] }),
    "BAD_REQUEST",
    "交付说明过短且无附件",
  );

  const file = await prisma.fileAsset.create({
    data: {
      originalName: "文案.pdf",
      mime: "application/pdf",
      size: 128,
      storageKey: "verify-copy.pdf",
      uploaderId: worker.id,
    },
  });
  await submitTask(worker, task.id, {
    summary: "已完成 8 条商品卖点，标题与关键词齐全，详见附件。",
    links: "https://example.com/draft",
    fileIds: [file.id],
  });
  await rejectTask(ops, task.id, { comment: "关键词缺两处，请补全后重提。", checked: ["条数达标"] });
  await submitTask(worker, task.id, {
    summary: "已按质检意见补全关键词，8 条卖点均可验收，详见附件与链接。",
    links: "https://example.com/final",
    fileIds: [],
  });
  await acceptTask(ops, task.id, { comment: "关键词已补全。", checked: ["条数达标"] });

  const done = await getTask(ops, task.id);
  const actions = done.logs.map((log) => log.action);
  assert(
    JSON.stringify(actions) === JSON.stringify(["create", "dispatch", "claim", "submit", "qa_fail", "submit", "qa_pass", "accept"]),
    `时间线动作不符：${actions.join(",")}`,
  );
  assert(done.status === "accepted", "任务应为已验收");
  assert(done.deliveries.length === 2, "应有两个交付版本");
  assert(done.deliveries[0]?.qaResult === "failed", "第一版质检不通过");
  assert(done.deliveries[1]?.qaResult === "passed", "第二版质检通过");
  assert(done.deliveries[0]?.files.length === 1, "第一版应挂上附件");
  assert(done.deliveries[1]?.links[0] === "https://example.com/final", "第二版应保留链接");

  const enterpriseView = await getTask(entA, task.id);
  assert(enterpriseView.assignee.cert === null, "企业看不到残疾证号");
  assert(enterpriseView.assignee.name === "林晓", "企业看得到执行人姓名");
  assert(enterpriseView.logs.every((log) => !log.internal), "企业看不到内部备注");

  const bill = await buildBillDraft(ops, "ent_a", "2026-10");
  assert(bill.positionFeeTotal === 18_000, `岗位费应为 180 元，实际 ${bill.positionFeeTotal}`);
  assert(bill.platformServiceFee === 3_600_000, "平台费应取执行中方案月费");
  assert(bill.totalAmount === 3_618_000, `合计应为 36180 元，实际 ${bill.totalAmount}`);
  await expectError(() => getBill(entA, bill.id), "NOT_FOUND", "企业看不到草稿账单");
  const visible = await listBills(entA, { page: 1, pageSize: 20, skip: 0 });
  assert(visible.total === 0, "企业账单列表不应出现草稿");

  const ledger = await createLedger(ops, { enterpriseId: "ent_a", talentId: "talent_lin", yearMonth: "2026-10" });
  assert(ledger.checkStatus === "incomplete", "新台账应为材料未齐");
  await expectError(
    () => createLedger(ops, { enterpriseId: "ent_a", talentId: "talent_lin", yearMonth: "2026-10" }),
    "BAD_REQUEST",
    "同月台账唯一",
  );

  // 残保金方案书：服务端重算、权限隔离、转签单
  assert((await getServiceFeeFen()) === 50_000, "默认服务费 500 元");
  await expectError(() => setServiceFee(entA, "400"), "FORBIDDEN", "企业不能改服务费");
  await setServiceFee(ops, "520");
  assert((await getServiceFeeFen()) === 52_000, "服务费改为 520 元");
  const form = {
    enterpriseId: "ent_a",
    region: "national",
    ratio: "1.5",
    employees: "300",
    avgWage: "96000",
    socialAvgWage: "120000",
    minWage: "2520",
    monthlyWage: "2520",
    monthlySocial: "1100",
    placedMild: "0",
    placedSevere: "0",
    newKind: "severe",
    serviceFee: "500",
    isEnterprise: "on",
    remark: "verify",
  };
  const proposal = await createProposal(ops, form);
  await expectError(() => createProposal(entA, form), "FORBIDDEN", "企业不能建方案书");
  await expectError(() => createProposal(ops, { ...form, ratio: "1.2" }), "BAD_REQUEST", "比例不得低于 1.5%");
  const own = await getProposal(entA, proposal.id);
  assert(own.parsed.current.levyFen === 38_880_000, `应缴 388800 元，实际 ${own.parsed.current.levyFen}`);
  assert(own.parsed.recommended.newPersons === 2, "推荐新增 2 人（到 1%）");
  await expectError(() => getProposal(entB, proposal.id), "FORBIDDEN", "别家企业看不到方案书");
  await expectError(() => getProposal(worker, proposal.id), "FORBIDDEN", "执行端看不到方案书");
  await expectError(() => listProposals(worker, { pageSize: 20, skip: 0 }), "FORBIDDEN", "执行端没有方案书列表");
  assert((await listProposals(entA, { skip: 0, pageSize: 20 })).total === 1, "企业 A 看到 1 份");
  assert((await listProposals(entB, { skip: 0, pageSize: 20 })).total === 0, "企业 B 看到 0 份");
  const prospect = await createProposal(ops, { ...form, enterpriseId: "", companyName: "潜在客户 C" });
  assert(prospect.enterpriseId === null, "潜在客户没有企业档案");
  await expectError(() => getProposal(entA, prospect.id), "FORBIDDEN", "企业看不到未关联的方案书");
  await linkProposalEnterprise(ops, prospect.id, "ent_b");
  assert((await listProposals(entB, { skip: 0, pageSize: 20 })).total === 1, "关联后企业 B 能看到");
  const defaults = planDefaultsFromProposal(own, new Date("2026-10-18T00:00:00Z"));
  assert(defaults.monthlyServiceFee === "1000.00", `月服务费 500×2，实际 ${defaults.monthlyServiceFee}`);
  assert(defaults.disabilityFundGap === "388800.00", "缺口=当前应缴");
  assert(defaults.startDate === "2026-11-01" && defaults.endDate === "2027-10-31", `服务期 ${defaults.startDate}~${defaults.endDate}`);
  await markProposalConverted(ops, proposal.id, "plan_x");
  assert((await getProposal(ops, proposal.id)).status === "converted", "转签单后状态为已转签单");

  console.log("verify ok");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
