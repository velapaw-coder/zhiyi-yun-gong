"use client";

import { REGIONS, type LevyInput } from "@/lib/levy";

/** 表单里的字符串状态，允许清空再输入。 */
export type LevyDraft = {
  region: string;
  ratio: string; // 百分数，如 1.5
  employees: string;
  avgWage: string;
  socialAvgWage: string;
  minWage: string;
  monthlyWage: string;
  monthlySocial: string;
  placedMild: string;
  placedSevere: string;
  newKind: "severe" | "mild";
  serviceFee: string;
  isEnterprise: boolean;
};

export const DEFAULT_DRAFT: LevyDraft = {
  region: "national",
  ratio: "1.5",
  employees: "300",
  avgWage: "96000",
  socialAvgWage: "",
  minWage: "2520",
  monthlyWage: "2520",
  monthlySocial: "1100",
  placedMild: "0",
  placedSevere: "0",
  newKind: "severe",
  serviceFee: "500",
  isEnterprise: true,
};

const num = (value: string) => {
  const n = Number(String(value).replace(/[,，\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export function draftToInput(draft: LevyDraft): LevyInput {
  return {
    employees: num(draft.employees),
    ratioBp: Math.round(num(draft.ratio) * 100),
    avgWageYuan: num(draft.avgWage),
    socialAvgWageYuan: num(draft.socialAvgWage),
    minWageYuan: num(draft.minWage),
    monthlyWageYuan: num(draft.monthlyWage),
    monthlySocialYuan: num(draft.monthlySocial),
    placedMild: num(draft.placedMild),
    placedSevere: num(draft.placedSevere),
    newKind: draft.newKind,
    serviceFeeYuan: num(draft.serviceFee),
    onsiteManageYuan: 200,
    isEnterprise: draft.isEnterprise,
  };
}

export function regionName(draft: LevyDraft) {
  return REGIONS.find((r) => r.code === draft.region)?.name.replace(/（.*）/, "") ?? "—";
}

const input =
  "h-11 w-full min-w-0 rounded-lg border border-[#cbd8de] bg-white px-3 text-base text-zy-text outline-none transition focus:border-zy-cyan focus:ring-3 focus:ring-zy-cyan/20 sm:h-10 sm:text-sm";

function NumberField({
  label,
  name,
  value,
  onChange,
  unit,
  hint,
  step = "1",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  hint?: string;
  step?: string;
}) {
  return (
    <label className="grid min-w-0 content-start gap-1.5 text-sm font-semibold text-zy-deep">
      {label}
      <span className="relative">
        <input
          name={name}
          inputMode="decimal"
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${input} ${unit ? "pr-14" : ""} num`}
        />
        {unit ? <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-normal text-zy-muted">{unit}</span> : null}
      </span>
      {hint ? <span className="text-xs font-normal leading-5 text-zy-muted">{hint}</span> : null}
    </label>
  );
}

export function LevyFields({
  draft,
  onChange,
  feeEditable,
}: {
  draft: LevyDraft;
  onChange: (draft: LevyDraft) => void;
  feeEditable: boolean;
}) {
  const set = <K extends keyof LevyDraft>(key: K, value: LevyDraft[K]) => onChange({ ...draft, [key]: value });
  const region = REGIONS.find((r) => r.code === draft.region);
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid min-w-0 content-start gap-1.5 text-sm font-semibold text-zy-deep">
          省份 / 城市
          <select
            name="region"
            value={draft.region}
            onChange={(event) => {
              const next = REGIONS.find((r) => r.code === event.target.value);
              onChange({ ...draft, region: event.target.value, ratio: next && next.code !== "custom" ? String(next.ratioBp / 100) : draft.ratio });
            }}
            className={input}
          >
            {REGIONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
                {r.code !== "national" && r.code !== "custom" ? ` · ${(r.ratioBp / 100).toFixed(1)}%` : ""}
              </option>
            ))}
          </select>
          {region ? <span className="text-xs font-normal leading-5 text-zy-muted">{region.note}</span> : null}
        </label>
        <NumberField label="安置比例" name="ratio" unit="%" step="0.1" value={draft.ratio} onChange={(v) => onChange({ ...draft, ratio: v, region: draft.region === "national" && v !== "1.5" ? "custom" : draft.region })} hint="国家底线 1.5%，以当地规定为准" />
        <NumberField label="上年在职职工人数" name="employees" unit="人" value={draft.employees} onChange={(v) => set("employees", v)} hint="年平均人数，含 1 年以上合同人员" />
        <NumberField label="上年职工年平均工资" name="avgWage" unit="元/年" value={draft.avgWage} onChange={(v) => set("avgWage", v)} hint="工资总额 ÷ 在职职工人数" />
        <NumberField label="当地社会平均工资" name="socialAvgWage" unit="元/年" value={draft.socialAvgWage} onChange={(v) => set("socialAvgWage", v)} hint="选填。填写后按 2 倍封顶计征" />
        <NumberField label="当地最低工资" name="minWage" unit="元/月" value={draft.minWage} onChange={(v) => onChange({ ...draft, minWage: v, monthlyWage: draft.monthlyWage === draft.minWage ? v : draft.monthlyWage })} hint="安置人员工资不得低于此标准" />
        <NumberField label="安置人员月工资" name="monthlyWage" unit="元/月" value={draft.monthlyWage} onChange={(v) => set("monthlyWage", v)} />
        <NumberField label="安置人员社保（企业承担）" name="monthlySocial" unit="元/月" value={draft.monthlySocial} onChange={(v) => set("monthlySocial", v)} hint="按当地缴费基数与企业承担部分估算" />
        <NumberField label="已安置：轻度（3–4 级）" name="placedMild" unit="人" value={draft.placedMild} onChange={(v) => set("placedMild", v)} />
        <NumberField label="已安置：重度（1–2 级）" name="placedSevere" unit="人" value={draft.placedSevere} onChange={(v) => set("placedSevere", v)} hint="1 人按 2 人计" />
        {feeEditable ? (
          <NumberField label="服务费" name="serviceFee" unit="元/人/月" value={draft.serviceFee} onChange={(v) => set("serviceFee", v)} hint="默认取运营后台设置" />
        ) : (
          <div className="grid content-start gap-1.5 text-sm font-semibold text-zy-deep">
            服务费
            <p className="flex h-11 items-center rounded-lg bg-zy-pale px-3 text-base font-bold text-zy-blue sm:h-10 sm:text-sm">
              <span className="num">{draft.serviceFee}</span>&nbsp;元/人/月
            </p>
            <span className="text-xs font-normal leading-5 text-zy-muted">套餐 A 合规版定价，含对接、备案与平台服务</span>
            <input type="hidden" name="serviceFee" value={draft.serviceFee} />
          </div>
        )}
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-sm font-semibold text-zy-deep">新增安置按哪类测算</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["severe", "重度（1–2 级）", "1 人抵 2 个指标"],
              ["mild", "轻度（3–4 级）", "1 人抵 1 个指标"],
            ] as const
          ).map(([value, title, note]) => (
            <label
              key={value}
              className={`flex min-h-14 cursor-pointer flex-col justify-center rounded-lg border px-3 py-2 text-sm transition ${
                draft.newKind === value ? "border-zy-blue bg-zy-pale/70 ring-2 ring-zy-blue/15" : "border-[#cbd8de] bg-white hover:border-zy-cyan"
              }`}
            >
              <input type="radio" name="newKind" value={value} checked={draft.newKind === value} onChange={() => set("newKind", value)} className="sr-only" />
              <span className="font-bold text-zy-deep">{title}</span>
              <span className="text-xs text-zy-muted">{note}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex min-h-11 items-center gap-2.5 text-sm text-zy-muted">
        <input type="checkbox" name="isEnterprise" checked={draft.isEnterprise} onChange={(event) => set("isEnterprise", event.target.checked)} />
        用人单位是企业（30 人以下免征只适用于企业）
      </label>
    </div>
  );
}
