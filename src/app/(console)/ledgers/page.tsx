import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { ReadOnlyBanner, selectClass } from "@/components/field";
import { StatusBadge } from "@/components/status-badge";
import { currentYearMonth, one, pageCount, parsePage } from "@/lib/format";
import { LEDGER_SLOTS, LEDGER_STATUS } from "@/lib/labels";
import { listLedgers } from "@/server/repo";
import { prisma } from "@/server/db";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "月度台账" };

export default async function LedgersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const yearMonth = one(sp.yearMonth);
  const checkStatus = one(sp.checkStatus);
  const enterpriseId = actor.role === "ops" ? one(sp.enterpriseId) : "";
  const paging = parsePage(one(sp.page));
  const { rows, total } = await expose(() =>
    listLedgers(actor, { q, yearMonth, checkStatus, enterpriseId, ...paging }),
  );
  const enterprises = actor.role === "ops" ? await prisma.enterprise.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) : [];
  return (
    <div>
      <PageHeader
        eyebrow="四流合一"
        title="月度台账"
        description="按人和月归档合同、社保、发薪、个税/发票。官方申报接口不在本期，这里只做上传和核对。"
        actions={
          actor.role === "ops" ? (
            <Button asChild>
              <Link href="/ledgers/new">新建台账</Link>
            </Button>
          ) : null
        }
      />
      {actor.role === "enterprise" ? <ReadOnlyBanner /> : null}
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <Input name="q" defaultValue={q} placeholder="人才姓名" className="w-40" />
        <Input name="yearMonth" type="month" defaultValue={yearMonth || currentYearMonth()} className="w-40" />
        {actor.role === "ops" ? (
          <select name="enterpriseId" className={`${selectClass} w-44!`} defaultValue={enterpriseId}>
            <option value="">全部企业</option>
            {enterprises.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        ) : null}
        <select name="checkStatus" className={`${selectClass} w-32!`} defaultValue={checkStatus}>
          <option value="">全部核对</option>
          {Object.entries(LEDGER_STATUS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          筛选
        </Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="这个月还没有台账" hint="运营可以按人按月建档，再把四类凭证传上去。" />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-zy-line shadow-zy">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/70 text-left text-muted-foreground">
              <tr>
                {["月份", "企业", "人才", "合同", "社保", "发薪", "个税/发票", "核对"].map((head) => (
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
                    <Link href={`/ledgers/${row.id}`} className="font-medium text-primary hover:underline">
                      {row.yearMonth}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{row.enterprise.name}</td>
                  <td className="px-3 py-3">{row.talent.name}</td>
                  {LEDGER_SLOTS.map((slot) => (
                    <td key={slot} className="num px-3 py-3">
                      {row.files.filter((file) => file.ledgerSlot === slot).length}
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <StatusBadge map={LEDGER_STATUS} value={row.checkStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={paging.page} pages={pageCount(total)} params={{ q, yearMonth, checkStatus, enterpriseId }} />
    </div>
  );
}
