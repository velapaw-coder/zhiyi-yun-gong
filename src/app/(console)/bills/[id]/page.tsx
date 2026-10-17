import Link from "next/link";
import { BillOps } from "@/components/bill-forms";
import { PageHeader } from "@/components/page-header";
import { ReadOnlyBanner } from "@/components/field";
import { StatusBadge } from "@/components/status-badge";
import { fenToYuan } from "@/lib/format";
import { BILL_STATUS, INVOICE_STATUS, PAYMENT_STATUS } from "@/lib/labels";
import { getBill } from "@/server/billing";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "账单详情" };

export default async function BillPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const bill = await expose(() => getBill(actor, id));
  const ops = actor.role === "ops";
  const adjustmentSum = bill.adjustmentList.reduce((sum, item) => sum + item.amount, 0);
  return (
    <div>
      <PageHeader
        eyebrow={`${bill.code} · ${bill.enterprise.name}`}
        title={`${bill.yearMonth} 月账单`}
        description={bill.pricingNote ?? ""}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge map={BILL_STATUS} value={bill.status} />
            <StatusBadge map={INVOICE_STATUS} value={bill.invoiceStatus} />
            <StatusBadge map={PAYMENT_STATUS} value={bill.paymentStatus} />
          </div>
        }
      />
      {ops ? null : <ReadOnlyBanner />}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          ["岗位费", bill.positionFeeTotal],
          ["平台服务费", bill.platformServiceFee],
          ["增减项", adjustmentSum],
          ["应付合计", bill.totalAmount],
        ].map(([label, amount]) => (
          <div key={String(label)} className="rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="num mt-1 text-xl font-semibold">{fenToYuan(Number(amount))}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-zy-line shadow-zy">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-muted/70 text-left text-muted-foreground">
            <tr>
              {["岗位", "数量", "单位", "单价", "金额", "计算说明"].map((head) => (
                <th key={head} className="px-3 py-2 font-medium">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bill.lineItems.map((line) => (
              <tr key={line.id} className="border-t border-border align-top">
                <td className="px-3 py-3">{line.positionName}</td>
                <td className="num px-3 py-3">{line.quantity}</td>
                <td className="px-3 py-3">{line.unit}</td>
                <td className="num px-3 py-3">{fenToYuan(line.unitPrice)}</td>
                <td className="num px-3 py-3">{fenToYuan(line.amount)}</td>
                <td className="px-3 py-3 text-xs leading-5 text-muted-foreground">{line.remark}</td>
              </tr>
            ))}
            {bill.lineItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-sm text-muted-foreground">
                  没有启用岗位的明细，账单可能只含平台服务费。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {bill.adjustmentList.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm">
          {bill.adjustmentList.map((item, index) => (
            <li key={`${item.name}-${index}`}>
              增减项 {item.name}：<span className="num">{fenToYuan(item.amount)}</span>
              {item.remark ? <span className="text-muted-foreground"> · {item.remark}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>发票号：{bill.invoiceNo || "—"}</div>
        <div>
          已回款：<span className="num">{fenToYuan(bill.paidAmount)}</span> 元
        </div>
      </dl>
      {bill.remark ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{bill.remark}</p> : null}
      {ops ? (
        <div className="mt-6">
          <BillOps
            id={bill.id}
            status={bill.status}
            invoiceStatus={bill.invoiceStatus}
            invoiceNo={bill.invoiceNo ?? ""}
            paymentStatus={bill.paymentStatus}
            paidAmount={bill.paidAmount}
            adjustments={bill.adjustmentList}
            enterpriseId={bill.enterpriseId}
            yearMonth={bill.yearMonth}
          />
        </div>
      ) : null}
      <p className="mt-4 text-sm">
        <Link href="/bills" className="text-primary hover:underline">
          返回账单
        </Link>
      </p>
    </div>
  );
}
