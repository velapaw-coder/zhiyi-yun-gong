import Link from "next/link";
import { DeletePlanButton, PlanFileForm, PlanForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { ReadOnlyBanner } from "@/components/field";
import { StatusBadge } from "@/components/status-badge";
import { fenToYuan, fileSize, formatDate, toDateInput } from "@/lib/format";
import { PRODUCT_LINE_LABEL, SIGN_STATUS } from "@/lib/labels";
import { getPlan } from "@/server/repo";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "方案详情" };

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const plan = await expose(() => getPlan(actor, id));
  const ops = actor.role === "ops";
  return (
    <div>
      <PageHeader
        eyebrow={`${plan.enterprise.name} · ${plan.code}`}
        title={plan.planVersion}
        description={`${PRODUCT_LINE_LABEL}。服务期 ${formatDate(plan.startDate)} 至 ${formatDate(plan.endDate)}。`}
        actions={
          <Link href={`/enterprises/${plan.enterpriseId}`} className="text-sm text-primary hover:underline">
            返回企业
          </Link>
        }
      />
      <div className="mb-4">
        <StatusBadge map={SIGN_STATUS} value={plan.signStatus} />
      </div>
      {ops ? (
        <PlanForm
          mode="edit"
          id={plan.id}
          enterpriseId={plan.enterpriseId}
          defaults={{
            code: plan.code,
            planVersion: plan.planVersion,
            disabilityFundBase: fenToYuan(plan.disabilityFundBase),
            disabilityFundGap: fenToYuan(plan.disabilityFundGap),
            monthlyServiceFee: fenToYuan(plan.monthlyServiceFee),
            startDate: toDateInput(plan.startDate),
            endDate: toDateInput(plan.endDate),
            signStatus: plan.signStatus,
            remark: plan.remark ?? "",
          }}
        />
      ) : (
        <div>
          <ReadOnlyBanner />
          <dl className="grid gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10 sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">残保金基数</dt>
              <dd className="num mt-1">{fenToYuan(plan.disabilityFundBase)} 元</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">残保金缺口</dt>
              <dd className="num mt-1">{fenToYuan(plan.disabilityFundGap)} 元</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">月服务费</dt>
              <dd className="num mt-1">{fenToYuan(plan.monthlyServiceFee)} 元</dd>
            </div>
          </dl>
          {plan.remark ? <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{plan.remark}</p> : null}
        </div>
      )}
      <section className="mt-6">
        <h2 className="mb-2 font-medium">附件</h2>
        <ul className="space-y-2 text-sm">
          {plan.files.map((file) => (
            <li key={file.id}>
              <a className="text-primary hover:underline" href={`/api/files/${file.id}`}>
                {file.originalName}
              </a>
              <span className="ml-2 text-xs text-muted-foreground">{fileSize(file.size)}</span>
            </li>
          ))}
          {plan.files.length === 0 ? <li className="text-muted-foreground">还没有测算表或方案附件。</li> : null}
        </ul>
        {ops ? <PlanFileForm planId={plan.id} /> : null}
        {ops ? <DeletePlanButton id={plan.id} enterpriseId={plan.enterpriseId} /> : null}
      </section>
    </div>
  );
}
