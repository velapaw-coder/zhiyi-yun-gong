import Link from "next/link";
import { DeletePositionButton, PositionForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { ReadOnlyBanner } from "@/components/field";
import { StatusBadge } from "@/components/status-badge";
import { fenToYuan } from "@/lib/format";
import { POSITION_STATUS, SETTLEMENT_CYCLE } from "@/lib/labels";
import { getPosition, positionFormOptions } from "@/server/repo";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "岗位详情" };

export default async function PositionPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const position = await expose(() => getPosition(actor, id));
  const ops = actor.role === "ops";
  const enterprises = ops ? await positionFormOptions(actor) : [];
  return (
    <div>
      <PageHeader
        eyebrow={`${position.enterprise.name} · ${position.code}`}
        title={position.name}
        description={`类型 AI 内容编排。在岗 ${position.talents.length} / 编制 ${position.headcount}。未结束任务 ${position.openTasks} 条。`}
        actions={
          <StatusBadge map={POSITION_STATUS} value={position.status} />
        }
      />
      {ops ? (
        <>
          {position.status === "inactive" && position.openTasks > 0 ? (
            <p className="mb-4 rounded-lg bg-accent px-3 py-2 text-sm">
              岗位已停用，仍有 {position.openTasks} 条未结束任务可以继续交付，但不能新建任务。
            </p>
          ) : null}
          <PositionForm
            mode="edit"
            id={position.id}
            enterprises={enterprises.filter((item) => item.id === position.enterpriseId)}
            defaults={{
              enterpriseId: position.enterpriseId,
              planId: position.planId,
              name: position.name,
              headcount: position.headcount,
              deliveryStandard: position.deliveryStandard,
              qaRules: position.qaRules,
              unitPrice: fenToYuan(position.unitPrice),
              settlementCycle: position.settlementCycle,
              status: position.status,
              code: position.code,
            }}
          />
          <DeletePositionButton id={position.id} />
        </>
      ) : (
        <div>
          <ReadOnlyBanner />
          <dl className="grid gap-4 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
            <div>
              <dt className="text-muted-foreground">结算</dt>
              <dd className="mt-1">
                {SETTLEMENT_CYCLE[position.settlementCycle]} · {fenToYuan(position.unitPrice)} 元
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">交付标准</dt>
              <dd className="mt-1 whitespace-pre-wrap leading-6">{position.deliveryStandard}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">质检规则</dt>
              <dd className="mt-1 whitespace-pre-wrap leading-6">{position.qaRules}</dd>
            </div>
          </dl>
        </div>
      )}
      <p className="mt-4 text-sm">
        <Link href={`/plans/${position.planId}`} className="text-primary hover:underline">
          查看方案 {position.plan.code}
        </Link>
      </p>
    </div>
  );
}
