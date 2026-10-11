import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GenerateBillForm } from "@/components/bill-forms";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { ReadOnlyBanner, selectClass } from "@/components/field";
import { StatusBadge } from "@/components/status-badge";
import { currentYearMonth, fenToYuan, one, pageCount, parsePage } from "@/lib/format";
import { BILL_STATUS, INVOICE_STATUS, PAYMENT_STATUS } from "@/lib/labels";
import { enterprisesForBilling, listBills } from "@/server/billing";
import { prisma } from "@/server/db";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "账单" };

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const sp = await searchParams;
  const yearMonth = one(sp.yearMonth);
  const enterpriseId = actor.role === "ops" ? one(sp.enterpriseId) : "";
  const paging = parsePage(one(sp.page));
  const { rows, total } = await expose(() => listBills(actor, { yearMonth, enterpriseId, ...paging }));
  const enterprises = actor.role === "ops" ? await enterprisesForBilling(actor) : [];
  const filterEnterprises = actor.role === "ops" ? await prisma.enterprise.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) : [];
  return (
    <div>
      <PageHeader
        eyebrow="对账结算"
        title="账单"
        description={
          actor.role === "ops"
            ? "草稿只给运营看。出账之后企业才能看到。一张企业一个月只有一张账单。"
            : "这里只显示已出账或已确认的账单。"
        }
      />
      {actor.role === "enterprise" ? <ReadOnlyBanner /> : null}
      {actor.role === "ops" ? (
        <div className="mb-6">
          <GenerateBillForm enterprises={enterprises} defaultMonth={yearMonth || currentYearMonth()} />
        </div>
      ) : null}
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <Input name="yearMonth" type="month" defaultValue={yearMonth} className="w-40" />
        {actor.role === "ops" ? (
          <select name="enterpriseId" className={`${selectClass} w-48`} defaultValue={enterpriseId}>
            <option value="">全部企业</option>
            {filterEnterprises.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        ) : null}
        <Button type="submit" variant="secondary">
          筛选
        </Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="没有可见账单" hint={actor.role === "ops" ? "选择企业和月份，生成一份草稿。" : "运营出账后，账单会出现在这里。"} />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/70 text-left text-muted-foreground">
              <tr>
                {["账单", "企业", "月份", "应付", "状态", "开票", "回款"].map((head) => (
                  <th key={head} className="px-3 py-2 font-medium">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-3">
                    <Link href={`/bills/${row.id}`} className="font-medium text-primary hover:underline">
                      {row.code}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{row.enterprise.name}</td>
                  <td className="px-3 py-3">{row.yearMonth}</td>
                  <td className="num px-3 py-3">{fenToYuan(row.totalAmount)}</td>
                  <td className="px-3 py-3">
                    <StatusBadge map={BILL_STATUS} value={row.status} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge map={INVOICE_STATUS} value={row.invoiceStatus} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge map={PAYMENT_STATUS} value={row.paymentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={paging.page} pages={pageCount(total)} params={{ yearMonth, enterpriseId }} />
    </div>
  );
}
