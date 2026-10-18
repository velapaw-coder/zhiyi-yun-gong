import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateLevy, DEFAULT_INPUT, levyState, personsToReach, REGIONS, type LevyInput } from "../src/lib/levy";

const base = (patch: Partial<LevyInput> = {}): LevyInput => ({ ...DEFAULT_INPUT, socialAvgWageYuan: 120000, ...patch });

test("公式：300 人 × 1.5% × 9.6 万，未安置按 90% 分档", () => {
  const r = calculateLevy(base());
  assert.equal(r.current.required, 4.5);
  assert.equal(r.current.gap, 4.5);
  assert.equal(r.current.baseLevyFen, 4.5 * 96000 * 100); // 432,000 元
  assert.equal(r.current.tier, "ninety");
  assert.equal(r.current.levyFen, 388800 * 100);
  assert.equal(r.levyWithoutTierFen, 432000 * 100);
});

test("30 人（含）以下企业免征；31 人开始征收", () => {
  const exempt = calculateLevy(base({ employees: 30 }));
  assert.equal(exempt.exempt, true);
  assert.equal(exempt.current.tier, "exempt");
  assert.equal(exempt.current.levyFen, 0);
  assert.equal(exempt.scenarios.length, 1);
  const levied = calculateLevy(base({ employees: 31 }));
  assert.equal(levied.exempt, false);
  assert.equal(levied.current.levyFen, Math.round(Math.round(0.465 * 96000 * 100) * 0.9));
});

test("免征只适用企业：机关事业单位 30 人也要算", () => {
  const r = calculateLevy(base({ employees: 30, isEnterprise: false }));
  assert.equal(r.exempt, false);
  assert.ok(r.current.levyFen > 0);
});

test("2 倍社平封顶", () => {
  const r = calculateLevy(base({ avgWageYuan: 300000, socialAvgWageYuan: 120000 }));
  assert.equal(r.capped, true);
  assert.equal(r.wageBaseFen, 240000 * 100);
  const nocap = calculateLevy(base({ avgWageYuan: 300000, socialAvgWageYuan: 0 }));
  assert.equal(nocap.capped, false);
  assert.equal(nocap.wageBaseFen, 300000 * 100);
  assert.ok(nocap.warnings.some((w) => w.includes("社会平均工资")));
});

test("等于 2 倍社平时不算封顶", () => {
  const r = calculateLevy(base({ avgWageYuan: 240000, socialAvgWageYuan: 120000 }));
  assert.equal(r.capped, false);
});

test("分档边界：1% 及以上按 50%，达到比例为 0", () => {
  // 200 人：1% = 2 人，1.5% = 3 人
  const half = calculateLevy(base({ employees: 200, placedMild: 2 }));
  assert.equal(half.current.tier, "half");
  assert.equal(half.current.baseLevyFen, 96000 * 100);
  assert.equal(half.current.levyFen, 48000 * 100);
  const below = calculateLevy(base({ employees: 200, placedMild: 1 }));
  assert.equal(below.current.tier, "ninety");
  const met = calculateLevy(base({ employees: 200, placedMild: 3 }));
  assert.equal(met.current.tier, "met");
  assert.equal(met.current.levyFen, 0);
});

test("重度 1 人按 2 人计", () => {
  const r = calculateLevy(base({ employees: 200, placedSevere: 1 }));
  assert.equal(r.current.counted, 2);
  assert.equal(r.current.tier, "half");
  const full = calculateLevy(base({ employees: 200, placedSevere: 1, placedMild: 1 }));
  assert.equal(full.current.tier, "met");
});

test("差额人数可以不是整数", () => {
  const s = levyState(150, 150, 1, 10000000, false); // 2.25 - 1 = 1.25 人
  assert.equal(s.gap, 1.25);
  assert.equal(s.baseLevyFen, 12500000);
});

test("达标所需人数：重度按 2 人计、向上取整", () => {
  assert.equal(personsToReach(300, 150, 0, 2), 3); // 4.5 → 重度 3 人
  assert.equal(personsToReach(300, 150, 0, 1), 5);
  assert.equal(personsToReach(300, 100, 0, 2), 2); // 1% = 3 → 2 人
  assert.equal(personsToReach(300, 150, 5, 1), 0);
  assert.equal(personsToReach(1000, 160, 0, 2), 8);
});

test("方案：足额安置后应缴为 0，节省等于当前应缴，成本按 12 个月", () => {
  const r = calculateLevy(base());
  const full = r.scenarios.find((s) => s.key === "full")!;
  assert.equal(full.newPersons, 3);
  assert.equal(full.state.levyFen, 0);
  assert.equal(full.savingFen, r.current.levyFen);
  const monthly = (2520 + 1100 + 500) * 100;
  assert.equal(full.costFen, 3 * 12 * monthly);
  assert.equal(full.netFen, full.savingFen - full.costFen);
  assert.ok(full.roi! > 2);
  // 300 人：重度 2 人即到 1%，剩 0.5 个差额按 50% 缴，净节省反而比足额高
  assert.equal(r.recommended.key, "tier1");
  assert.ok(r.recommended.netFen > full.netFen);
});

test("差额大时推荐足额安置", () => {
  const r = calculateLevy(base({ employees: 400 }));
  assert.equal(r.recommended.key, "full");
  assert.equal(r.recommended.newPersons, 3);
});

test("到 1% 的中间方案只在未达 1% 时出现", () => {
  const r = calculateLevy(base({ employees: 1000 }));
  const tier1 = r.scenarios.find((s) => s.key === "tier1");
  assert.ok(tier1);
  assert.equal(tier1!.newPersons, 5); // 10 人 → 重度 5 人
  assert.equal(tier1!.state.tier, "half");
  const half = calculateLevy(base({ employees: 1000, placedMild: 10 }));
  assert.equal(half.scenarios.find((s) => s.key === "tier1"), undefined);
});

test("工资低、成本高时推荐维持现状", () => {
  const r = calculateLevy(base({ employees: 40, avgWageYuan: 30000, socialAvgWageYuan: 0, serviceFeeYuan: 3000 }));
  assert.equal(r.recommended.key, "keep");
  assert.ok(r.scenarios.find((s) => s.key === "full")!.netFen < 0);
});

test("工资低于最低工资时按最低工资计成本并提示", () => {
  const r = calculateLevy(base({ monthlyWageYuan: 1000, minWageYuan: 2520 }));
  assert.ok(r.warnings.some((w) => w.includes("最低工资")));
  assert.equal(r.monthlyPerPersonFen, (2520 + 1100 + 500) * 100);
});

test("省份比例：四川 1.6%", () => {
  const sichuan = REGIONS.find((r) => r.code === "sichuan")!;
  const r = calculateLevy(base({ employees: 1000, ratioBp: sichuan.ratioBp }));
  assert.equal(r.current.required, 16);
});

test("异常输入不会算出负数或 NaN", () => {
  const r = calculateLevy(base({ employees: -5, avgWageYuan: Number.NaN, placedMild: -3 }));
  assert.equal(r.input.employees, 0);
  assert.equal(r.current.levyFen, 0);
  assert.ok(Number.isFinite(r.recommended.netFen));
});
