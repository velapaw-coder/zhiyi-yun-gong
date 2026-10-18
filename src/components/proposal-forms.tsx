"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileDown, Send, Trash2, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError, FormNote } from "@/components/field";
import { useSubmit } from "@/components/use-submit";
import { DEFAULT_DRAFT, LevyFields, draftToInput, type LevyDraft } from "@/components/levy/fields";
import { LevyReport } from "@/components/levy/report";
import { calculateLevy } from "@/lib/levy";
import { createProposalAction, deleteProposalAction, setProposalStatusAction, setServiceFeeAction } from "@/server/actions";

const selectClass =
  "h-11 w-full min-w-0 rounded-lg border border-[#cbd8de] bg-white px-3 text-base text-zy-text outline-none focus:border-zy-cyan focus:ring-3 focus:ring-zy-cyan/20 sm:h-10 sm:text-sm";

export function ProposalForm({
  enterprises,
  serviceFeeYuan,
  initialEnterpriseId,
}: {
  enterprises: Array<{ id: string; name: string; scaleHeadcount: number }>;
  serviceFeeYuan: number;
  initialEnterpriseId?: string;
}) {
  const router = useRouter();
  const { error, pending, submit } = useSubmit();
  const initial = enterprises.find((e) => e.id === initialEnterpriseId);
  const [enterpriseId, setEnterpriseId] = useState(initial?.id ?? "");
  const [draft, setDraft] = useState<LevyDraft>({
    ...DEFAULT_DRAFT,
    serviceFee: String(serviceFeeYuan),
    employees: initial ? String(initial.scaleHeadcount) : DEFAULT_DRAFT.employees,
  });
  const result = useMemo(() => calculateLevy(draftToInput(draft)), [draft]);

  return (
    <form
      className="grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void submit(
          () => createProposalAction(form),
          (data) => {
            if (data?.id) router.push(`/proposals/${data.id}`);
          },
        );
      }}
    >
      <div className="grid gap-5 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy md:p-5">
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid min-w-0 content-start gap-1.5 text-sm font-semibold text-zy-deep">
            选择企业
            <select
              name="enterpriseId"
              value={enterpriseId}
              className={selectClass}
              onChange={(event) => {
                const next = enterprises.find((e) => e.id === event.target.value);
                setEnterpriseId(event.target.value);
                if (next) setDraft((d) => ({ ...d, employees: String(next.scaleHeadcount) }));
              }}
            >
              <option value="">新客户（手填名称）</option>
              {enterprises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid min-w-0 content-start gap-1.5 text-sm font-semibold text-zy-deep">
            企业名称{enterpriseId ? "" : " *"}
            <Input name="companyName" placeholder={enterpriseId ? "已选企业，可不填" : "营业执照全称"} disabled={Boolean(enterpriseId)} maxLength={80} />
          </label>
        </div>
        <LevyFields draft={draft} onChange={setDraft} feeEditable />
        <label className="grid gap-1.5 text-sm font-semibold text-zy-deep">
          备注
          <textarea
            name="remark"
            rows={3}
            maxLength={2000}
            placeholder="例如：数据来源、客户关注点、属地口径说明"
            className="w-full rounded-lg border border-[#cbd8de] bg-white px-3 py-2 text-base outline-none focus:border-zy-cyan focus:ring-3 focus:ring-zy-cyan/20 sm:text-sm"
          />
        </label>
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? "保存中…" : "保存方案书"}
        </Button>
      </div>
      <div className="min-w-0">
        <p className="mb-3 text-sm font-semibold text-zy-deep">实时预览</p>
        <LevyReport result={result} compact />
      </div>
    </form>
  );
}

export function ProposalActions({
  id,
  status,
  canEdit,
  convertHref,
  planHref,
}: {
  id: string;
  status: string;
  canEdit: boolean;
  convertHref: string;
  planHref: string | null;
}) {
  const router = useRouter();
  const { error, pending, submit } = useSubmit();
  return (
    <div className="no-print grid gap-2">
      <FormError message={error} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => window.print()} className="flex-1 sm:flex-none">
          <FileDown /> 导出 PDF
        </Button>
        {canEdit && status !== "converted" ? (
          <>
            <Button asChild variant="gold" className="flex-1 sm:flex-none">
              <Link href={convertHref}>
                <ArrowRightLeft /> 转为签单方案
              </Link>
            </Button>
            {status === "draft" ? (
              <Button type="button" variant="outline" disabled={pending} onClick={() => void submit(() => setProposalStatusAction(id, "sent"))}>
                <Send /> 标记已发送
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              className="text-zy-rose"
              onClick={() => {
                if (!window.confirm("删除这份方案书？")) return;
                void submit(
                  () => deleteProposalAction(id),
                  () => router.push("/proposals"),
                );
              }}
            >
              <Trash2 /> 删除
            </Button>
          </>
        ) : null}
        {planHref ? (
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link href={planHref}>查看签单方案 →</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ServiceFeeForm({ serviceFeeYuan }: { serviceFeeYuan: number }) {
  const { error, pending, saved, submit } = useSubmit();
  return (
    <form
      className="flex flex-wrap items-end gap-2 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void submit(() => setServiceFeeAction(form));
      }}
    >
      <label className="grid min-w-0 flex-1 gap-1.5 text-sm font-semibold text-zy-deep sm:flex-none">
        计算器默认服务费（元/人/月）
        <Input name="serviceFee" type="number" min={0} step="1" defaultValue={serviceFeeYuan} className="sm:w-48" />
      </label>
      <Button type="submit" variant="secondary" disabled={pending}>
        保存
      </Button>
      <p className="basis-full text-xs text-zy-muted">首页计算器和新建方案书都用这个默认值。</p>
      <div className="basis-full">
        <FormError message={error} />
        <FormNote message={saved ? "已保存" : null} />
      </div>
    </form>
  );
}
