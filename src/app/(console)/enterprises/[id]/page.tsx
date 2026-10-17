import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ReadOnlyBanner } from "@/components/field";
import { StatusBadge } from "@/components/status-badge";
import { fenToYuan, formatDate } from "@/lib/format";
import { ENTERPRISE_STATUS, POSITION_STATUS, PRODUCT_LINE_LABEL, SETTLEMENT_CYCLE, SIGN_STATUS } from "@/lib/labels";
import { getEnterprise } from "@/server/repo";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "企业详情" };

export default async function EnterpriseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const enterprise = await expose(() => getEnterprise(actor, id));
  const ops = actor.role === "ops";
  return (
    <div>
      <PageHeader
        eyebrow={enterprise.code}
        title={enterprise.name}
        description={`${enterprise.industry || "行业未填"} · ${enterprise.scaleHeadcount} 人 · 对接人 ${enterprise.contactName} ${enterprise.contactPhone}`}
        actions={
          ops ? (
            <>
              <Button variant="outline" asChild>
                <Link href={`/enterprises/${enterprise.id}/edit`}>编辑企业</Link>
              </Button>
              <Button asChild>
                <Link href={`/enterprises/${enterprise.id}/plans/new`}>新建方案</Link>
              </Button>
            </>
          ) : null
        }
      />
      {ops ? null : <ReadOnlyBanner />}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <StatusBadge map={ENTERPRISE_STATUS} value={enterprise.status} />
        {enterprise.contactEmail ? <span className="text-muted-foreground">{enterprise.contactEmail}</span> : null}
      </div>
      {enterprise.remark ? <p className="mb-6 whitespace-pre-wrap text-sm leading-6">{enterprise.remark}</p> : null}
      <section>
        <h2 className="mb-3 font-bold text-zy-deep">方案</h2>
        <div className="grid gap-3">
          {enterprise.plans.map((plan) => (
            <Link key={plan.id} href={`/plans/${plan.id}`} className="rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy hover:ring-primary/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {plan.code} · {plan.planVersion}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {PRODUCT_LINE_LABEL} · {formatDate(plan.startDate)} 至 {formatDate(plan.endDate)} · {plan._count.positions} 个岗位
                  </p>
                </div>
                <StatusBadge map={SIGN_STATUS} value={plan.signStatus} />
              </div>
              <p className="num mt-3 text-sm">
                残保金基数 {fenToYuan(plan.disabilityFundBase)} · 缺口 {fenToYuan(plan.disabilityFundGap)} · 月服务费 {fenToYuan(plan.monthlyServiceFee)}
              </p>
            </Link>
          ))}
          {enterprise.plans.length === 0 ? <p className="text-sm text-muted-foreground">还没有方案。</p> : null}
        </div>
      </section>
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-zy-deep">岗位</h2>
          <Link href={`/positions?enterpriseId=${enterprise.id}`} className="text-sm text-primary hover:underline">
            在岗位列表中查看
          </Link>
        </div>
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-zy-line shadow-zy">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/70 text-left text-muted-foreground">
              <tr>
                {["岗位", "方案", "编制", "单价", "结算", "状态"].map((head) => (
                  <th key={head} className="px-3 py-2 font-medium">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enterprise.positions.map((position) => (
                <tr key={position.id} className="border-t border-border">
                  <td className="px-3 py-3">
                    <Link href={`/positions/${position.id}`} className="font-medium text-primary hover:underline">
                      {position.name}
                    </Link>
                    <span className="block font-mono text-xs text-muted-foreground">{position.code}</span>
                  </td>
                  <td className="px-3 py-3">{position.plan.planVersion}</td>
                  <td className="num px-3 py-3">{position.headcount}</td>
                  <td className="num px-3 py-3">{fenToYuan(position.unitPrice)}</td>
                  <td className="px-3 py-3">{SETTLEMENT_CYCLE[position.settlementCycle]}</td>
                  <td className="px-3 py-3">
                    <StatusBadge map={POSITION_STATUS} value={position.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
