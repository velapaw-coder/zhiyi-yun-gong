"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError, FormNote, selectClass } from "@/components/field";
import { useSubmit } from "@/components/use-submit";
import {
  addAdjustmentAction,
  confirmBillAction,
  generateBillAction,
  issueBillAction,
  removeAdjustmentAction,
  updateInvoiceAction,
  updatePaymentAction,
  voidBillAction,
} from "@/server/actions";
import { INVOICE_STATUS, PAYMENT_STATUS } from "@/lib/labels";
import { fenToYuan } from "@/lib/format";

export function GenerateBillForm({
  enterprises,
  defaultMonth,
}: {
  enterprises: { id: string; name: string; code: string }[];
  defaultMonth: string;
}) {
  const router = useRouter();
  const { error, pending, submit } = useSubmit();
  return (
    <form
      className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy md:grid-cols-[1fr_180px_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(
          () => generateBillAction(new FormData(event.currentTarget)),
          (data) => {
            if (data?.id) router.push(`/bills/${data.id}`);
          },
        );
      }}
    >
      <FormError message={error} />
      <Field label="企业" required>
        <select name="enterpriseId" className={selectClass} required>
          {enterprises.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}（{item.code}）
            </option>
          ))}
        </select>
      </Field>
      <Field label="月份" required>
        <Input name="yearMonth" type="month" required defaultValue={defaultMonth} />
      </Field>
      <div className="flex items-end">
        <Button type="submit" disabled={pending}>
          {pending ? "生成中…" : "生成草稿"}
        </Button>
      </div>
      <p className="text-xs leading-5 text-muted-foreground md:col-span-3">
        已有草稿或作废账单会被重新生成。已出账、已确认的月份不能覆盖。岗位费按岗位结算周期计算：按件看当月已验收任务，按人月和按周看生成当时的在岗人数。
      </p>
    </form>
  );
}

export function BillOps({
  id,
  status,
  invoiceStatus,
  invoiceNo,
  paymentStatus,
  paidAmount,
  adjustments,
  enterpriseId,
  yearMonth,
}: {
  id: string;
  status: string;
  invoiceStatus: string;
  invoiceNo: string;
  paymentStatus: string;
  paidAmount: number;
  adjustments: { name: string; amount: number; remark: string }[];
  enterpriseId: string;
  yearMonth: string;
}) {
  const router = useRouter();
  const { error, pending, saved, submit } = useSubmit();
  return (
    <div className="grid gap-4">
      <FormError message={error} />
      <FormNote message={saved ? "已更新" : null} />
      {status === "draft" ? (
        <form
          className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            void submit(() => addAdjustmentAction(id, new FormData(form)), () => form.reset());
          }}
        >
          <h2 className="font-medium md:col-span-3">增减项</h2>
          <Field label="名称" required>
            <Input name="name" required placeholder="首单试跑减免" />
          </Field>
          <Field label="金额（元）" required hint="减免填负数">
            <Input name="amount" required inputMode="decimal" placeholder="-500" />
          </Field>
          <Field label="备注">
            <Input name="remark" />
          </Field>
          <div className="md:col-span-3 flex flex-wrap gap-2">
            <Button type="submit" variant="secondary" disabled={pending}>
              加入增减项
            </Button>
            <Button type="button" disabled={pending} onClick={() => void submit(() => issueBillAction(id))}>
              出账
            </Button>
          </div>
          {adjustments.length > 0 ? (
            <ul className="md:col-span-3 space-y-1 text-sm">
              {adjustments.map((item, index) => (
                <li key={`${item.name}-${index}`} className="flex items-center justify-between gap-3">
                  <span>
                    {item.name} <span className="num">{fenToYuan(item.amount)}</span>
                    {item.remark ? <span className="text-muted-foreground"> · {item.remark}</span> : null}
                  </span>
                  <button type="button" className="text-xs text-destructive" onClick={() => void submit(() => removeAdjustmentAction(id, index))}>
                    移除
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </form>
      ) : null}
      {status === "issued" ? (
        <div>
          <Button type="button" disabled={pending} onClick={() => void submit(() => confirmBillAction(id))}>
            确认账单
          </Button>
        </div>
      ) : null}
      {status === "issued" || status === "confirmed" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <form
            className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy"
            onSubmit={(event) => {
              event.preventDefault();
              void submit(() => updateInvoiceAction(id, new FormData(event.currentTarget)));
            }}
          >
            <h2 className="font-medium">开票</h2>
            <Field label="开票状态">
              <select name="invoiceStatus" className={selectClass} defaultValue={invoiceStatus}>
                {Object.entries(INVOICE_STATUS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="发票号">
              <Input name="invoiceNo" defaultValue={invoiceNo} />
            </Field>
            <Button type="submit" variant="secondary" disabled={pending}>
              保存开票
            </Button>
          </form>
          <form
            className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy"
            onSubmit={(event) => {
              event.preventDefault();
              void submit(() => updatePaymentAction(id, new FormData(event.currentTarget)));
            }}
          >
            <h2 className="font-medium">回款</h2>
            <Field label="回款状态">
              <select name="paymentStatus" className={selectClass} defaultValue={paymentStatus}>
                {Object.entries(PAYMENT_STATUS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="已回款金额（元）" hint="未回款填 0；已回款须等于应付合计。">
              <Input name="paidAmount" defaultValue={fenToYuan(paidAmount)} inputMode="decimal" />
            </Field>
            <Button type="submit" variant="secondary" disabled={pending}>
              保存回款
            </Button>
          </form>
        </div>
      ) : null}
      {status === "draft" || status === "voided" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit(
              () => generateBillAction(new FormData(event.currentTarget)),
              (data) => {
                if (data?.id) router.push(`/bills/${data.id}`);
              },
            );
          }}
        >
          <input type="hidden" name="enterpriseId" value={enterpriseId} />
          <input type="hidden" name="yearMonth" value={yearMonth} />
          <Button type="submit" variant="outline" disabled={pending}>
            按当前规则重新生成草稿
          </Button>
        </form>
      ) : null}
      {status !== "voided" ? (
        <form
          className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(() => voidBillAction(id, new FormData(event.currentTarget)));
          }}
        >
          <h2 className="font-medium">作废</h2>
          <Field label="原因" required>
            <Textarea name="remark" required rows={2} />
          </Field>
          <Button type="submit" variant="destructive" disabled={pending}>
            作废这张账单
          </Button>
        </form>
      ) : null}
    </div>
  );
}
