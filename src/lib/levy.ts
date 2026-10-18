/**
 * 残疾人就业保障金（残保金）测算。首页计算器与控制台方案书共用这一份逻辑。
 *
 * 政策依据（详见 /workspace/残保金政策-2026.md）：
 * - 财税〔2015〕72号 第六、七、八条：比例不低于 1.5%，具体比例由各省规定；
 *   年缴纳额 =（上年在职职工人数 × 当地比例 − 上年实际安排残疾人就业人数）× 上年在职职工年平均工资；
 *   差额人数可以不是整数；1–2 级残疾人（残疾军人 1–3 级）按 2 人计；计入须签 1 年以上合同、
 *   工资不低于当地最低工资、足额缴纳社保。
 * - 财政部公告2019年第98号：征收标准上限按当地社会平均工资 2 倍执行。
 * - 财政部公告2023年第8号：分档减缴（≥1% 未达标按 50%；<1% 按 90%），
 *   在职职工 30 人（含）以下企业免征，执行至 2027-12-31。
 *
 * 金额一律用「分」做整数运算，比例用「万分比」（1.5% = 150）避免浮点误差。
 */

export const POLICY_TIER_END = "2027-12-31";
export const SMALL_ENTERPRISE_LIMIT = 30;
export const TIER_LOW_BP = 100; // 1%

export type Region = { code: string; name: string; ratioBp: number; note: string };

/** 省级安置比例预置。来源与核实情况见政策文档；页面允许手工修改。 */
export const REGIONS: Region[] = [
  { code: "national", name: "全国通用（1.5%）", ratioBp: 150, note: "财税〔2015〕72号 第六条：不得低于 1.5%" },
  { code: "beijing", name: "北京", ratioBp: 150, note: "京财税〔2019〕1333号 第六条" },
  { code: "shanghai", name: "上海", ratioBp: 150, note: "按属地现行通告核实" },
  { code: "tianjin", name: "天津", ratioBp: 150, note: "按属地现行通告核实" },
  { code: "chongqing", name: "重庆", ratioBp: 150, note: "按属地现行通告核实" },
  { code: "guangdong", name: "广东", ratioBp: 150, note: "按属地现行通告核实" },
  { code: "zhejiang", name: "浙江", ratioBp: 150, note: "浙江省税务局 2026 申报指引" },
  { code: "jiangsu", name: "江苏", ratioBp: 150, note: "苏财综〔2017〕2号（江苏税务 2026-08 热点问答）" },
  { code: "shandong", name: "山东", ratioBp: 150, note: "按属地现行通告核实" },
  { code: "hubei", name: "湖北", ratioBp: 150, note: "按属地现行通告核实" },
  { code: "hunan", name: "湖南", ratioBp: 150, note: "按属地现行通告核实" },
  { code: "anhui", name: "安徽", ratioBp: 150, note: "按属地现行通告核实" },
  { code: "hebei", name: "河北", ratioBp: 150, note: "按属地现行通告核实" },
  { code: "shaanxi", name: "陕西", ratioBp: 150, note: "陕西省残保金征收使用管理实施办法 第六条" },
  { code: "hainan", name: "海南", ratioBp: 150, note: "东方市 2026 残保金通告" },
  { code: "sichuan", name: "四川", ratioBp: 160, note: "川财规〔2021〕5号：1.6%（川财规〔2026〕2号延至 2029-02-28）" },
  { code: "fujian", name: "福建", ratioBp: 160, note: "公开资料为 1.6%，请以属地通告核实" },
  { code: "henan", name: "河南", ratioBp: 160, note: "公开资料为 1.6%，请以属地通告核实" },
  { code: "jilin", name: "吉林", ratioBp: 160, note: "公开资料为 1.6%，请以属地通告核实" },
  { code: "custom", name: "其他 / 手工填写", ratioBp: 150, note: "按当地政府规定比例填写" },
];

export type PlacementKind = "severe" | "mild";

export type LevyInput = {
  /** 上年在职职工年平均人数（整数） */
  employees: number;
  /** 当地安置比例，万分比：1.5% = 150 */
  ratioBp: number;
  /** 上年在职职工年平均工资（元/年） */
  avgWageYuan: number;
  /** 当地社会平均工资（元/年）。填了才按 2 倍封顶；0 表示不封顶 */
  socialAvgWageYuan: number;
  /** 安置人员月工资（元/月），不得低于当地最低工资 */
  monthlyWageYuan: number;
  /** 当地最低工资（元/月） */
  minWageYuan: number;
  /** 安置人员社保（元/人/月，按企业实际承担口径） */
  monthlySocialYuan: number;
  /** 已安置：轻度（3–4 级）人数 */
  placedMild: number;
  /** 已安置：重度（1–2 级）人数，按 2 人计 */
  placedSevere: number;
  /** 新增安置按重度还是轻度测算 */
  newKind: PlacementKind;
  /** 服务费（元/人/月） */
  serviceFeeYuan: number;
  /** 轻度到岗方案的额外管理成本（元/人/月），仅用于方案对比 */
  onsiteManageYuan?: number;
  /** 是否为企业（30 人免征只适用于企业） */
  isEnterprise?: boolean;
};

export type Tier = "exempt" | "met" | "half" | "ninety";

export const TIER_LABEL: Record<Tier, string> = {
  exempt: "免征（企业在职职工 ≤ 30 人）",
  met: "已达比例，无需缴纳",
  half: "分档减缴：按应缴额 50%",
  ninety: "分档减缴：按应缴额 90%",
};

export type LevyState = {
  /** 折算后的已安置人数（重度×2） */
  counted: number;
  /** 实际安置比例（万分比，可带小数） */
  placedRatioBp: number;
  /** 应安置人数 = 职工数 × 比例（可不是整数） */
  required: number;
  /** 差额人数 */
  gap: number;
  tier: Tier;
  /** 减缴前应缴额（分） */
  baseLevyFen: number;
  /** 实际应缴（分） */
  levyFen: number;
};

export type Scenario = {
  key: string;
  label: string;
  /** 新增安置人数（实际人头） */
  newPersons: number;
  kind: PlacementKind;
  state: LevyState;
  /** 年节省残保金（分） */
  savingFen: number;
  /** 年安置成本（分）= 人数 × 12 ×（工资 + 社保 + 服务费/管理费） */
  costFen: number;
  /** 年净节省（分） */
  netFen: number;
  /** 投入产出比：节省 / 成本 */
  roi: number | null;
};

export type LevyResult = {
  input: LevyInput;
  exempt: boolean;
  /** 计征工资基数（分/年），已按 2 倍社平封顶 */
  wageBaseFen: number;
  capped: boolean;
  capFen: number | null;
  current: LevyState;
  scenarios: Scenario[];
  recommended: Scenario;
  /** 若 2027-12-31 后分档减缴不再延续，当前状态按全额的应缴（分） */
  levyWithoutTierFen: number;
  warnings: string[];
  monthlyPerPersonFen: number;
};

const fen = (yuan: number) => Math.round((Number.isFinite(yuan) ? yuan : 0) * 100);
const int = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));

/** 计算某个已安置折算人数下的缴费状态。 */
export function levyState(employees: number, ratioBp: number, counted: number, wageBaseFen: number, exempt: boolean): LevyState {
  const required = (employees * ratioBp) / 10000;
  const gap = Math.max(0, required - counted);
  const placedRatioBp = employees > 0 ? (counted * 10000) / employees : 0;
  // 比较用整数：counted × 10000 与 employees × ratioBp
  const metTarget = counted * 10000 >= employees * ratioBp;
  const metLow = counted * 10000 >= employees * TIER_LOW_BP;
  // 差额人数可以不是整数：基数 = 差额 × 工资基数，四舍五入到分
  const baseLevyFen = metTarget ? 0 : Math.round(((employees * ratioBp - counted * 10000) * wageBaseFen) / 10000);
  let tier: Tier;
  let levyFen: number;
  if (exempt) {
    tier = "exempt";
    levyFen = 0;
  } else if (metTarget) {
    tier = "met";
    levyFen = 0;
  } else if (metLow) {
    tier = "half";
    levyFen = Math.round(baseLevyFen * 0.5);
  } else {
    tier = "ninety";
    levyFen = Math.round(baseLevyFen * 0.9);
  }
  return { counted, placedRatioBp, required, gap, tier, baseLevyFen, levyFen };
}

/** 达到某个比例（万分比）需要新增的最少人数。 */
export function personsToReach(employees: number, targetBp: number, counted: number, weight: number) {
  const need = employees * targetBp - counted * 10000; // 万分之一人
  if (need <= 0) return 0;
  return Math.ceil(need / (weight * 10000));
}

export function calculateLevy(raw: LevyInput): LevyResult {
  const input: LevyInput = {
    ...raw,
    employees: int(raw.employees),
    ratioBp: Math.max(0, Math.round(raw.ratioBp)),
    placedMild: int(raw.placedMild),
    placedSevere: int(raw.placedSevere),
    isEnterprise: raw.isEnterprise ?? true,
    onsiteManageYuan: raw.onsiteManageYuan ?? 200,
  };
  const warnings: string[] = [];
  const exempt = Boolean(input.isEnterprise) && input.employees <= SMALL_ENTERPRISE_LIMIT;

  const avgFen = fen(input.avgWageYuan);
  const capFen = input.socialAvgWageYuan > 0 ? fen(input.socialAvgWageYuan) * 2 : null;
  const capped = capFen !== null && avgFen > capFen;
  const wageBaseFen = capped ? capFen! : avgFen;
  if (capFen === null) warnings.push("未填写当地社会平均工资，未按 2 倍社平封顶。");

  const wage = Math.max(input.monthlyWageYuan, 0);
  if (input.minWageYuan > 0 && wage < input.minWageYuan) {
    warnings.push("安置人员月工资低于当地最低工资标准，不能计入安置人数。测算已按最低工资计。");
  }
  const monthlyWageFen = fen(Math.max(wage, input.minWageYuan));
  const monthlySocialFen = fen(input.monthlySocialYuan);
  if (monthlySocialFen <= 0) warnings.push("社保为 0：未足额缴纳社保的人员不能计入安置人数。");
  const monthlyPerPersonFen = monthlyWageFen + monthlySocialFen + fen(input.serviceFeeYuan);
  const onsitePerPersonFen = monthlyWageFen + monthlySocialFen + fen(input.onsiteManageYuan ?? 200);

  const counted = input.placedMild + input.placedSevere * 2;
  const current = levyState(input.employees, input.ratioBp, counted, wageBaseFen, exempt);
  const levyWithoutTierFen = exempt ? 0 : current.baseLevyFen;

  const weight = input.newKind === "severe" ? 2 : 1;
  const build = (key: string, label: string, persons: number, kind: PlacementKind, perPersonFen: number): Scenario => {
    const w = kind === "severe" ? 2 : 1;
    const state = levyState(input.employees, input.ratioBp, counted + persons * w, wageBaseFen, exempt);
    const savingFen = current.levyFen - state.levyFen;
    const costFen = persons * 12 * perPersonFen;
    return { key, label, newPersons: persons, kind, state, savingFen, costFen, netFen: savingFen - costFen, roi: costFen > 0 ? savingFen / costFen : null };
  };

  const kind = input.newKind;
  const kindLabel = kind === "severe" ? "重度，1 人按 2 人计" : "轻度";
  const toLow = personsToReach(input.employees, TIER_LOW_BP, counted, weight);
  const toFull = personsToReach(input.employees, input.ratioBp, counted, weight);
  const scenarios: Scenario[] = [build("keep", "维持现状", 0, kind, monthlyPerPersonFen)];
  if (!exempt && current.tier === "ninety" && toLow > 0 && toLow < toFull) {
    scenarios.push(build("tier1", `部分安置到 1%（${kindLabel}）`, toLow, kind, monthlyPerPersonFen));
  }
  if (!exempt && toFull > 0) {
    scenarios.push(build("full", `足额安置到 ${(input.ratioBp / 100).toFixed(2).replace(/0$/, "")}%（${kindLabel}）`, toFull, kind, monthlyPerPersonFen));
  }
  // 方案对比：轻度到岗（真实到岗，自管）
  if (!exempt) {
    const onsite = personsToReach(input.employees, input.ratioBp, counted, 1);
    if (onsite > 0) scenarios.push(build("onsite", "轻度到岗、企业自管（对比）", onsite, "mild", onsitePerPersonFen));
  }

  // 推荐：在「维持现状 / 到 1% / 足额」里净节省最高的；并列时取安置更多、更合规的
  const candidates = scenarios.filter((s) => s.key !== "onsite");
  const recommended = candidates.reduce((best, s) => (s.netFen > best.netFen || (s.netFen === best.netFen && s.newPersons > best.newPersons) ? s : best), candidates[0]);

  if (exempt) warnings.push(`在职职工 ${input.employees} 人（≤ ${SMALL_ENTERPRISE_LIMIT}），企业按现行政策免征，执行至 ${POLICY_TIER_END}。`);
  return { input, exempt, wageBaseFen, capped, capFen, current, scenarios, recommended, levyWithoutTierFen, warnings, monthlyPerPersonFen };
}

export function yuan(fenValue: number, digits = 0) {
  const value = fenValue / 100;
  return value.toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function percentBp(bp: number, digits = 2) {
  return `${(bp / 100).toFixed(digits)}%`;
}

export const DEFAULT_INPUT: LevyInput = {
  employees: 300,
  ratioBp: 150,
  avgWageYuan: 96000,
  socialAvgWageYuan: 0,
  monthlyWageYuan: 2520,
  minWageYuan: 2520,
  monthlySocialYuan: 1100,
  placedMild: 0,
  placedSevere: 0,
  newKind: "severe",
  serviceFeeYuan: 500,
  onsiteManageYuan: 200,
  isEnterprise: true,
};

/** 一段可复制的测算摘要，用于咨询表单和方案书。 */
export function summaryText(result: LevyResult, companyName?: string, regionName?: string) {
  const r = result;
  const rec = r.recommended;
  return [
    `智翼云工 · 残保金测算${companyName ? ` · ${companyName}` : ""}`,
    `地区/比例：${regionName ?? "—"} ${percentBp(r.input.ratioBp)}；在职职工 ${r.input.employees} 人；计征工资 ${yuan(r.wageBaseFen)} 元/年${r.capped ? "（已按 2 倍社平封顶）" : ""}`,
    `当前：${TIER_LABEL[r.current.tier]}，年应缴约 ${yuan(r.current.levyFen)} 元`,
    `建议：${rec.label}，新增 ${rec.newPersons} 人，年节省 ${yuan(rec.savingFen)} 元，年成本 ${yuan(rec.costFen)} 元，净节省 ${yuan(rec.netFen)} 元`,
    "测算仅供参考，以属地残联审核和税务机关核定为准。",
  ].join("\n");
}
