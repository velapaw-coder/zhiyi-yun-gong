"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError, FormNote, selectClass } from "@/components/field";
import { FilePicker } from "@/components/file-picker";
import { useSubmit } from "@/components/use-submit";
import {
  attachPlanFilesAction,
  bindTalentAction,
  createEnterpriseAction,
  createLedgerAction,
  createPlanAction,
  createPositionAction,
  createTalentAction,
  createUserAction,
  deleteEnterpriseAction,
  deletePlanAction,
  deletePositionAction,
  deleteTalentAction,
  resetPasswordAction,
  setUserStatusAction,
  unbindTalentAction,
  updateEnterpriseAction,
  updateLedgerAction,
  updatePlanAction,
  updatePositionAction,
  updateTalentAction,
} from "@/server/actions";
import {
  DISABILITY_LEVELS,
  DISABILITY_TYPES,
  ENTERPRISE_STATUS,
  INDUSTRIES,
  LEDGER_STATUS,
  POSITION_STATUS,
  ROLE_LABEL,
  SETTLEMENT_CYCLE,
  SIGN_STATUS,
  TALENT_STATUS,
  TRAINING_PROGRESS,
} from "@/lib/labels";

function options(map: Record<string, string>) {
  return Object.entries(map);
}

export function EnterpriseForm({
  mode,
  id,
  defaults,
  fromProposal,
}: {
  mode: "create" | "edit";
  id?: string;
  fromProposal?: string;
  defaults?: {
    code?: string;
    name: string;
    industry: string;
    scaleHeadcount: number;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    status: string;
    remark: string;
  };
}) {
  const router = useRouter();
  const { error, pending, saved, submit } = useSubmit();
  return (
    <form
      className="grid gap-4 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void submit(
          () => (mode === "create" ? createEnterpriseAction(form) : updateEnterpriseAction(id!, form)),
          (data) => {
            if (mode === "create" && data?.id) {
              router.push(fromProposal ? `/enterprises/${data.id}/plans/new?fromProposal=${fromProposal}` : `/enterprises/${data.id}`);
            }
          },
        );
      }}
    >
      {fromProposal ? <input type="hidden" name="fromProposal" value={fromProposal} /> : null}
      <FormError message={error} />
      <FormNote message={saved && mode === "edit" ? "已保存" : null} />
      {mode === "create" ? (
        <Field label="编号" hint="留空则自动生成，如 ZY-A1B2">
          <Input name="code" defaultValue={defaults?.code} />
        </Field>
      ) : (
        <Field label="编号">
          <Input value={defaults?.code} disabled />
        </Field>
      )}
      <Field label="企业名称" required>
        <Input name="name" required defaultValue={defaults?.name} />
      </Field>
      <Field label="行业">
        <select name="industry" className={selectClass} defaultValue={defaults?.industry ?? ""}>
          <option value="">未填</option>
          {INDUSTRIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </Field>
      <Field label="规模（人数）" required>
        <Input name="scaleHeadcount" type="number" min={1} required defaultValue={defaults?.scaleHeadcount ?? 100} />
      </Field>
      <Field label="对接人" required>
        <Input name="contactName" required defaultValue={defaults?.contactName} />
      </Field>
      <Field label="电话" required>
        <Input name="contactPhone" required defaultValue={defaults?.contactPhone} />
      </Field>
      <Field label="邮箱">
        <Input name="contactEmail" type="email" defaultValue={defaults?.contactEmail} />
      </Field>
      <Field label="状态" required hint="潜在即意向客户。建议：潜在 → 已签约 → 暂停 / 终止。">
        <select name="status" className={selectClass} defaultValue={defaults?.status ?? "potential"}>
          {options(ENTERPRISE_STATUS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="备注" className="md:col-span-2">
        <Textarea name="remark" defaultValue={defaults?.remark} rows={4} />
      </Field>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中…" : mode === "create" ? "创建企业" : "保存企业"}
        </Button>
      </div>
    </form>
  );
}

export function DeleteEnterpriseButton({ id }: { id: string }) {
  const router = useRouter();
  const { error, pending, submit } = useSubmit();
  return (
    <div className="mt-3">
      <FormError message={error} />
      <Button
        type="button"
        variant="destructive"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("删除后不可恢复。仅空企业可以删除。")) return;
          void submit(() => deleteEnterpriseAction(id), () => router.push("/enterprises"));
        }}
      >
        删除企业
      </Button>
    </div>
  );
}

export function PlanForm({
  mode,
  id,
  enterpriseId,
  defaults,
  fromProposal,
}: {
  mode: "create" | "edit";
  id?: string;
  enterpriseId: string;
  fromProposal?: { id: string; code: string };
  defaults?: {
    code?: string;
    planVersion: string;
    disabilityFundBase: string;
    disabilityFundGap: string;
    monthlyServiceFee: string;
    startDate: string;
    endDate: string;
    signStatus: string;
    remark: string;
  };
}) {
  const router = useRouter();
  const { error, pending, saved, submit } = useSubmit();
  return (
    <form
      className="grid gap-4 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void submit(
          () => (mode === "create" ? createPlanAction(form) : updatePlanAction(id!, form)),
          (data) => {
            if (mode === "create" && data?.id) router.push(`/plans/${data.id}`);
          },
        );
      }}
    >
      <input type="hidden" name="enterpriseId" value={enterpriseId} />
      {fromProposal ? <input type="hidden" name="fromProposal" value={fromProposal.id} /> : null}
      <FormError message={error} />
      <FormNote message={saved && mode === "edit" ? "已保存" : null} />
      <div className="md:col-span-2 rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
        {fromProposal
          ? `已按残保金方案书 ${fromProposal.code} 预填：基数为减缴前应缴，缺口为当前实际应缴，月服务费 = 服务费 × 建议新增人数。保存后方案书标记为「已转签单」。`
          : "产品线固定为「合规交付 + 单岗位」。成本测算可先在「方案书」里自动生成，再转为签单方案；也可以把手工测算说明写在备注。"}
      </div>
      {mode === "create" ? (
        <Field label="编号" hint="留空自动生成">
          <Input name="code" />
        </Field>
      ) : (
        <Field label="编号">
          <Input value={defaults?.code} disabled />
        </Field>
      )}
      <Field label="方案版本" required hint="例如 V1 / 2026Q4">
        <Input name="planVersion" required defaultValue={defaults?.planVersion} />
      </Field>
      <Field label="残保金基数（元）" required>
        <Input name="disabilityFundBase" required defaultValue={defaults?.disabilityFundBase} inputMode="decimal" />
      </Field>
      <Field label="残保金缺口（元）" required hint="应缴或可优化口径请在备注写明。">
        <Input name="disabilityFundGap" required defaultValue={defaults?.disabilityFundGap} inputMode="decimal" />
      </Field>
      <Field label="月服务费（元）" required>
        <Input name="monthlyServiceFee" required defaultValue={defaults?.monthlyServiceFee} inputMode="decimal" />
      </Field>
      <Field label="服务起" required>
        <Input name="startDate" type="date" required defaultValue={defaults?.startDate} />
      </Field>
      <Field label="服务止" required>
        <Input name="endDate" type="date" required defaultValue={defaults?.endDate} />
      </Field>
      <Field label="签约状态" required hint="建议：草稿 → 待签 → 已签约 → 执行中 → 已结束。作废用于终止方案。">
        <select name="signStatus" className={selectClass} defaultValue={defaults?.signStatus ?? "draft"}>
          {options(SIGN_STATUS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="备注" className="md:col-span-2">
        <Textarea name="remark" rows={4} defaultValue={defaults?.remark} />
      </Field>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中…" : mode === "create" ? "创建方案" : "保存方案"}
        </Button>
      </div>
    </form>
  );
}

export function PlanFileForm({ planId }: { planId: string }) {
  const { error, pending, saved, submit } = useSubmit();
  return (
    <form
      className="mt-4 grid gap-3 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        void submit(() => attachPlanFilesAction(planId, new FormData(form)), () => form.reset());
      }}
    >
      <h2 className="font-medium">手工测算表 / 方案附件</h2>
      <FormError message={error} />
      <FormNote message={saved ? "已挂到方案上" : null} />
      <FilePicker />
      <Button type="submit" disabled={pending} variant="secondary">
        {pending ? "保存中…" : "挂接附件"}
      </Button>
    </form>
  );
}

export function DeletePlanButton({ id, enterpriseId }: { id: string; enterpriseId: string }) {
  const router = useRouter();
  const { error, pending, submit } = useSubmit();
  return (
    <div className="mt-3">
      <FormError message={error} />
      <Button
        type="button"
        variant="destructive"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("仅没有岗位的方案可以删除。")) return;
          void submit(() => deletePlanAction(id, enterpriseId), () => router.push(`/enterprises/${enterpriseId}`));
        }}
      >
        删除方案
      </Button>
    </div>
  );
}

export function PositionForm({
  mode,
  id,
  enterprises,
  defaults,
}: {
  mode: "create" | "edit";
  id?: string;
  enterprises: { id: string; name: string; code: string; plans: { id: string; code: string; planVersion: string }[] }[];
  defaults?: {
    enterpriseId: string;
    planId: string;
    name: string;
    headcount: number;
    deliveryStandard: string;
    qaRules: string;
    unitPrice: string;
    settlementCycle: string;
    status: string;
    code?: string;
  };
}) {
  const router = useRouter();
  const { error, warning, pending, saved, submit } = useSubmit();
  const [enterpriseId, setEnterpriseId] = useState(defaults?.enterpriseId ?? enterprises[0]?.id ?? "");
  const plans = useMemo(
    () => enterprises.find((item) => item.id === enterpriseId)?.plans ?? [],
    [enterprises, enterpriseId],
  );
  return (
    <form
      className="grid gap-4 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void submit(
          () => (mode === "create" ? createPositionAction(form) : updatePositionAction(id!, form)),
          (data) => {
            if (mode === "create" && data && "id" in data && data.id) router.push(`/positions/${data.id}`);
          },
        );
      }}
    >
      <FormError message={error} />
      <FormNote message={warning} />
      <FormNote message={saved && mode === "edit" && !warning ? "已保存" : null} />
      <div className="md:col-span-2 text-xs leading-5 text-muted-foreground">
        本期岗位类型固定为 AI 内容编排（AI_CONTENT_OPS），按篇/条可计量。停用后不能新建任务；进行中的任务不受影响。
      </div>
      {mode === "create" ? (
        <Field label="编号" hint="留空自动生成">
          <Input name="code" />
        </Field>
      ) : (
        <Field label="编号">
          <Input value={defaults?.code} disabled />
        </Field>
      )}
      <Field label="企业" required>
        <select
          name="enterpriseId"
          className={selectClass}
          value={enterpriseId}
          disabled={mode === "edit"}
          onChange={(event) => setEnterpriseId(event.target.value)}
        >
          {enterprises.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}（{item.code}）
            </option>
          ))}
        </select>
      </Field>
      <Field label="所属方案" required>
        <select name="planId" className={selectClass} defaultValue={defaults?.planId}>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.code} · {plan.planVersion}
            </option>
          ))}
        </select>
      </Field>
      <Field label="岗位名称" required>
        <Input name="name" required defaultValue={defaults?.name ?? "AI 内容编排助理"} />
      </Field>
      <Field label="编制人数" required>
        <Input name="headcount" type="number" min={1} required defaultValue={defaults?.headcount ?? 1} />
      </Field>
      <Field label="单价（元）" required hint="按结算周期理解：人月、每件或人周。">
        <Input name="unitPrice" required defaultValue={defaults?.unitPrice} inputMode="decimal" />
      </Field>
      <Field label="结算周期" required>
        <select name="settlementCycle" className={selectClass} defaultValue={defaults?.settlementCycle ?? "per_piece"}>
          {options(SETTLEMENT_CYCLE).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="状态" required>
        <select name="status" className={selectClass} defaultValue={defaults?.status ?? "draft"}>
          {options(POSITION_STATUS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="交付标准" required className="md:col-span-2" hint="写成可量化的句子，例如每周条数和字段完整率。">
        <Textarea name="deliveryStandard" required rows={4} defaultValue={defaults?.deliveryStandard} />
      </Field>
      <Field label="质检规则" required className="md:col-span-2" hint="一行一条，质检时会变成勾选项。">
        <Textarea name="qaRules" required rows={5} defaultValue={defaults?.qaRules} />
      </Field>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending || plans.length === 0}>
          {pending ? "保存中…" : mode === "create" ? "创建岗位" : "保存岗位"}
        </Button>
      </div>
    </form>
  );
}

export function DeletePositionButton({ id }: { id: string }) {
  const router = useRouter();
  const { error, pending, submit } = useSubmit();
  return (
    <div className="mt-3">
      <FormError message={error} />
      <Button
        type="button"
        variant="destructive"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("仅没有任务和在岗人才的岗位可以删除。")) return;
          void submit(() => deletePositionAction(id), () => router.push("/positions"));
        }}
      >
        删除岗位
      </Button>
    </div>
  );
}

export function TalentForm({
  mode,
  id,
  defaults,
}: {
  mode: "create" | "edit";
  id?: string;
  defaults?: {
    code?: string;
    name: string;
    disabilityCertNo: string;
    disabilityType: string;
    disabilityLevel: string;
    phone: string;
    skillTags: string;
    trainingProgress: string;
    trainingPercent: number;
    status: string;
  };
}) {
  const router = useRouter();
  const { error, pending, saved, submit } = useSubmit();
  const statuses = Object.entries(TALENT_STATUS).filter(([value]) => value !== "on_duty" || defaults?.status === "on_duty");
  return (
    <form
      className="grid gap-4 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void submit(
          () => (mode === "create" ? createTalentAction(form) : updateTalentAction(id!, form)),
          (data) => {
            if (mode === "create" && data?.id) router.push(`/talents/${data.id}`);
          },
        );
      }}
    >
      <FormError message={error} />
      <FormNote message={saved && mode === "edit" ? "已保存" : null} />
      <p className="md:col-span-2 text-xs leading-5 text-muted-foreground">
        残疾证号在演示库中明文保存，仅运营可见完整号码。生产环境需要加密存储。在岗请用下方的上岗绑定，不要在这里直接改成在岗。
      </p>
      {mode === "create" ? (
        <Field label="编号" hint="留空自动生成">
          <Input name="code" />
        </Field>
      ) : (
        <Field label="编号">
          <Input value={defaults?.code} disabled />
        </Field>
      )}
      <Field label="姓名" required>
        <Input name="name" required defaultValue={defaults?.name} />
      </Field>
      <Field label="残疾证号" required>
        <Input name="disabilityCertNo" required defaultValue={defaults?.disabilityCertNo} />
      </Field>
      <Field label="残疾类别" required>
        <select name="disabilityType" className={selectClass} defaultValue={defaults?.disabilityType ?? "肢体"}>
          {DISABILITY_TYPES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </Field>
      <Field label="等级">
        <select name="disabilityLevel" className={selectClass} defaultValue={defaults?.disabilityLevel ?? ""}>
          <option value="">未填</option>
          {DISABILITY_LEVELS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </Field>
      <Field label="联系电话" required>
        <Input name="phone" required defaultValue={defaults?.phone} />
      </Field>
      <Field label="技能标签" hint="用逗号或空格分隔">
        <Input name="skillTags" defaultValue={defaults?.skillTags} placeholder="文案, 电商, 表格" />
      </Field>
      <Field label="培训进度" required>
        <select name="trainingProgress" className={selectClass} defaultValue={defaults?.trainingProgress ?? "not_started"}>
          {options(TRAINING_PROGRESS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="培训百分比">
        <Input name="trainingPercent" type="number" min={0} max={100} defaultValue={defaults?.trainingPercent ?? 0} />
      </Field>
      <Field label="状态" required>
        <select name="status" className={selectClass} defaultValue={defaults?.status ?? "candidate"}>
          {statuses.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中…" : mode === "create" ? "创建人才" : "保存档案"}
        </Button>
      </div>
    </form>
  );
}

export function BindForm({
  talentId,
  positions,
}: {
  talentId: string;
  positions: { id: string; name: string; code: string; headcount: number; enterpriseName: string }[];
}) {
  const { error, warning, pending, submit } = useSubmit();
  return (
    <form
      className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(() => bindTalentAction(talentId, new FormData(event.currentTarget)));
      }}
    >
      <h2 className="font-medium">上岗绑定</h2>
      <p className="text-xs leading-5 text-muted-foreground">
        同一时段主岗只有一家企业。培训未结业默认不能上岗，运营可强制并留下审计。超过编制会提示，但仍允许保存。
      </p>
      <FormError message={error} />
      <FormNote message={warning} />
      <Field label="启用岗位" required>
        <select name="positionId" className={selectClass} required>
          {positions.map((position) => (
            <option key={position.id} value={position.id}>
              {position.enterpriseName} · {position.name}（编制 {position.headcount}）
            </option>
          ))}
        </select>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="force" />
        强制上岗（培训未结业或类型不匹配时）
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || positions.length === 0}>
          确认上岗
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => {
            if (!window.confirm("离岗后状态会回到可上岗或培训中。")) return;
            void submit(() => unbindTalentAction(talentId));
          }}
        >
          离岗
        </Button>
      </div>
    </form>
  );
}

export function DeleteTalentButton({ id }: { id: string }) {
  const router = useRouter();
  const { error, pending, submit } = useSubmit();
  return (
    <div>
      <FormError message={error} />
      <Button
        type="button"
        variant="destructive"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("仅没有任务、台账和账号的人才可以删除。")) return;
          void submit(() => deleteTalentAction(id), () => router.push("/talents"));
        }}
      >
        删除档案
      </Button>
    </div>
  );
}

export function LedgerCreateForm({
  enterprises,
  talents,
  defaultMonth,
}: {
  enterprises: { id: string; name: string; code: string }[];
  talents: { id: string; name: string; code: string }[];
  defaultMonth: string;
}) {
  const router = useRouter();
  const { error, pending, submit } = useSubmit();
  return (
    <form
      className="grid gap-4 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(
          () => createLedgerAction(new FormData(event.currentTarget)),
          (data) => {
            if (data?.id) router.push(`/ledgers/${data.id}`);
          },
        );
      }}
    >
      <FormError message={error} />
      <p className="md:col-span-2 text-xs text-muted-foreground">同一人同一个月只能有一条台账。合同、社保、发薪、个税/发票在详情里上传扫描件或 PDF。</p>
      <Field label="企业" required>
        <select name="enterpriseId" className={selectClass} required>
          {enterprises.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="人才" required>
        <select name="talentId" className={selectClass} required>
          {talents.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}（{item.code}）
            </option>
          ))}
        </select>
      </Field>
      <Field label="归属月" required>
        <Input name="yearMonth" type="month" required defaultValue={defaultMonth} />
      </Field>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          建立台账
        </Button>
      </div>
    </form>
  );
}

export function LedgerCheckForm({
  id,
  checkStatus,
  anomalyNote,
}: {
  id: string;
  checkStatus: string;
  anomalyNote: string;
}) {
  const { error, pending, saved, submit } = useSubmit();
  return (
    <form
      className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(() => updateLedgerAction(id, new FormData(event.currentTarget)));
      }}
    >
      <h2 className="font-medium">核对</h2>
      <FormError message={error} />
      <FormNote message={saved ? "核对状态已更新" : null} />
      <Field label="核对状态" required>
        <select name="checkStatus" className={selectClass} defaultValue={checkStatus}>
          {options(LEDGER_STATUS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="异常备注" hint="状态为异常时必填。">
        <Textarea name="anomalyNote" rows={3} defaultValue={anomalyNote} />
      </Field>
      <Button type="submit" disabled={pending}>
        保存核对
      </Button>
    </form>
  );
}

export function UserCreateForm({
  enterprises,
  talents,
}: {
  enterprises: { id: string; name: string }[];
  talents: { id: string; name: string; code: string }[];
}) {
  const { error, pending, saved, submit } = useSubmit();
  const [role, setRole] = useState("ops");
  return (
    <form
      className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        void submit(() => createUserAction(new FormData(form)), () => form.reset());
      }}
    >
      <h2 className="font-medium">新建账号</h2>
      <FormError message={error} />
      <FormNote message={saved ? "账号已创建" : null} />
      <Field label="登录名" required>
        <Input name="loginName" required placeholder="zhang.san" />
      </Field>
      <Field label="显示名" required>
        <Input name="displayName" required />
      </Field>
      <Field label="初始密码" required hint="至少 8 位">
        <Input name="password" type="text" required minLength={8} />
      </Field>
      <Field label="角色" required>
        <select name="role" className={selectClass} value={role} onChange={(event) => setRole(event.target.value)}>
          {options(ROLE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      {role === "enterprise" ? (
        <Field label="所属企业" required>
          <select name="enterpriseId" className={selectClass} required>
            {enterprises.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      {role === "worker" ? (
        <Field label="绑定人才" required>
          <select name="talentId" className={selectClass} required>
            {talents.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}（{item.code}）
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <Button type="submit" disabled={pending}>
        创建
      </Button>
    </form>
  );
}

export function PasswordResetForm({ userId }: { userId: string }) {
  const { error, pending, saved, submit } = useSubmit();
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        void submit(() => resetPasswordAction(userId, new FormData(form)), () => form.reset());
      }}
    >
      <Input name="password" type="text" placeholder="新密码" minLength={8} required className="w-36" />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        重置密码
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
      {saved ? <span className="text-xs text-muted-foreground">已重置</span> : null}
    </form>
  );
}

export function UserStatusButton({ userId, status }: { userId: string; status: string }) {
  const { error, pending, submit } = useSubmit();
  const next = status === "active" ? "disabled" : "active";
  return (
    <div>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => void submit(() => setUserStatusAction(userId, next))}>
        {status === "active" ? "停用" : "启用"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
