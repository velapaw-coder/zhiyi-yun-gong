"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/field";
import { useSubmit } from "@/components/use-submit";
import { proposalFromLeadAction, updateLeadAction } from "@/server/actions";

const selectClass =
  "h-11 w-full rounded-lg border border-[#cbd8de] bg-white px-3 text-base text-zy-text outline-none focus:border-zy-cyan focus:ring-3 focus:ring-zy-cyan/20 sm:h-10 sm:text-sm";

export function LeadEditor({ id, status, ownerNote, statuses }: { id: string; status: string; ownerNote: string; statuses: Record<string, string> }) {
  const { error, pending, saved, submit } = useSubmit();
  return (
    <form
      className="grid gap-3"
      data-testid="lead-editor"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        void submit(() => updateLeadAction(id, form));
      }}
    >
      <label className="grid gap-1.5 text-sm font-semibold text-zy-deep">
        状态
        <select name="status" defaultValue={status} className={selectClass} key={status}>
          {Object.entries(statuses).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-zy-deep">
        跟进备注
        <textarea
          name="ownerNote"
          defaultValue={ownerNote}
          rows={4}
          maxLength={2000}
          placeholder="例如：10/21 电话沟通，对方关心重度安置的岗位类型"
          className="w-full rounded-lg border border-[#cbd8de] bg-white px-3 py-2.5 text-base outline-none focus:border-zy-cyan sm:text-sm"
        />
      </label>
      <FormError message={error} />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          保存
        </Button>
        {saved ? <span className="text-xs text-zy-teal">已保存</span> : null}
      </div>
    </form>
  );
}

export function LeadProposalButton({ id, proposalId, hasCalc }: { id: string; proposalId: string | null; hasCalc: boolean }) {
  const router = useRouter();
  const { error, pending, submit } = useSubmit();
  if (proposalId) {
    return (
      <Button asChild variant="outline">
        <Link href={`/proposals/${proposalId}`}>
          <FileText /> 查看方案书 →
        </Link>
      </Button>
    );
  }
  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="gold"
        disabled={pending || !hasCalc}
        data-testid="lead-make-proposal"
        onClick={() => void submit(() => proposalFromLeadAction(id), (data) => data?.id && router.push(`/proposals/${data.id}`))}
      >
        <FileText /> 一键生成方案书
      </Button>
      {!hasCalc ? (
        <p className="text-xs text-zy-muted">
          没有测算数据，请到 <Link href="/proposals/new" className="text-primary underline">新建方案书</Link> 手动填写。
        </p>
      ) : null}
      <FormError message={error} />
    </div>
  );
}
