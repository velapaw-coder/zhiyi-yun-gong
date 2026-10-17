import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { ReadOnlyBanner, selectClass } from "@/components/field";
import { StatusBadge } from "@/components/status-badge";
import { fenToYuan, one, pageCount, parsePage } from "@/lib/format";
import { POSITION_STATUS, SETTLEMENT_CYCLE } from "@/lib/labels";
import { listPositions } from "@/server/repo";
import { prisma } from "@/server/db";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "岗位" };

export default async function PositionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const status = one(sp.status);
  const enterpriseId = actor.role === "enterprise" ? actor.enterpriseId ?? "" : one(sp.enterpriseId);
  const paging = parsePage(one(sp.page));
  const { rows, total } = await expose(() => listPositions(actor, { q, status, enterpriseId, ...paging }));
  const enterprises = actor.role === "ops" ? await prisma.enterprise.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) : [];
  return (
    <div>
      <PageHeader
        eyebrow="配置"
        title="岗位"
        description="本期只有 AI 内容编排一种岗位类型。编制、交付标准、质检规则、单价和结算周期都在岗位上。"
        actions={
          actor.role === "ops" ? (
            <Button asChild>
              <Link href="/positions/new">新建岗位</Link>
            </Button>
          ) : null
        }
      />
      {actor.role === "enterprise" ? <ReadOnlyBanner /> : null}
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <Input name="q" defaultValue={q} placeholder="搜索岗位" className="w-full sm:w-48" />
        {actor.role === "ops" ? (
          <select name="enterpriseId" className={`${selectClass} min-w-0 flex-1 basis-32 sm:flex-none sm:basis-auto sm:w-48!`} defaultValue={enterpriseId}>
            <option value="">全部企业</option>
            {enterprises.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        ) : null}
        <select name="status" className={`${selectClass} min-w-0 flex-1 basis-32 sm:flex-none sm:basis-auto sm:w-32!`} defaultValue={status}>
          <option value="">全部状态</option>
          {Object.entries(POSITION_STATUS).map(([value, label]) => (
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
        <EmptyState title="没有岗位" hint="启用岗位之后才能派发任务。" />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-zy-line shadow-zy">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/70 text-left text-muted-foreground">
              <tr>
                {["岗位", "企业", "方案", "编制", "单价", "结算", "状态"].map((head) => (
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
                    <Link href={`/positions/${row.id}`} className="font-medium text-primary hover:underline">
                      {row.name}
                    </Link>
                    <span className="block font-mono text-xs text-muted-foreground">{row.code}</span>
                  </td>
                  <td className="px-3 py-3">{row.enterprise.name}</td>
                  <td className="px-3 py-3">{row.plan.planVersion}</td>
                  <td className="num px-3 py-3">{row.headcount}</td>
                  <td className="num px-3 py-3">{fenToYuan(row.unitPrice)}</td>
                  <td className="px-3 py-3">{SETTLEMENT_CYCLE[row.settlementCycle]}</td>
                  <td className="px-3 py-3">
                    <StatusBadge map={POSITION_STATUS} value={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={paging.page} pages={pageCount(total)} params={{ q, status, enterpriseId }} />
    </div>
  );
}
