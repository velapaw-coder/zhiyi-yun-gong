import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { ReadOnlyBanner } from "@/components/field";
import { StatusBadge } from "@/components/status-badge";
import { ServiceFeeForm } from "@/components/proposal-forms";
import { fenToYuan, one, pageCount, parsePage } from "@/lib/format";
import { REGIONS } from "@/lib/levy";
import { PROPOSAL_STATUS, getServiceFeeFen, listProposals } from "@/server/proposals";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "方案书" };

export default async function ProposalsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requireActor();
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const paging = parsePage(one(sp.page));
  const { rows, total } = await expose(() => listProposals(actor, { q, ...paging }));
  const ops = actor.role === "ops";
  const fee = ops ? await getServiceFeeFen() : 0;
  return (
    <div>
      <PageHeader
        eyebrow="残保金"
        title="方案书"
        description={ops ? "为企业测算残保金、给出安置建议，导出 PDF 发给客户；客户确认后一键转为签单方案。" : "运营为贵司出具的残保金测算方案书。"}
      />
      {ops ? (
        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <ServiceFeeForm serviceFeeYuan={fee / 100} />
          <Button asChild size="lg">
            <Link href="/proposals/new">
              <Plus /> 新建方案书
            </Link>
          </Button>
        </div>
      ) : (
        <ReadOnlyBanner />
      )}
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <Input name="q" defaultValue={q} placeholder="企业名称 / 编号" className="w-full sm:w-64" />
        <Button type="submit" variant="secondary">
          搜索
        </Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="还没有方案书" hint={ops ? "点「新建方案书」，填几项参数即可生成。" : "运营出具方案书后会显示在这里。"} />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-zy-line shadow-zy">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/70 text-left text-muted-foreground">
              <tr>
                {["方案书", "企业", "地区", "当前年应缴", "建议新增", "年净节省", "状态", "日期"].map((head) => (
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
                    <Link href={`/proposals/${row.id}`} className="font-medium text-primary hover:underline">
                      {row.code}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{row.companyName}</td>
                  <td className="px-3 py-3">{REGIONS.find((r) => r.code === row.region)?.name.replace(/（.*）/, "") ?? row.region}</td>
                  <td className="num px-3 py-3">{fenToYuan(row.levyFen)}</td>
                  <td className="num px-3 py-3">{row.newPersons} 人</td>
                  <td className="num px-3 py-3">{fenToYuan(row.netFen)}</td>
                  <td className="px-3 py-3">
                    <StatusBadge map={PROPOSAL_STATUS} value={row.status} />
                  </td>
                  <td className="num px-3 py-3">{row.createdAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={paging.page} pages={pageCount(total)} params={{ q }} />
    </div>
  );
}
