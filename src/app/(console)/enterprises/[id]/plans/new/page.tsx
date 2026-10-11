import { PlanForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { getEnterprise } from "@/server/repo";
import { assertOps } from "@/server/access";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "新建方案" };

export default async function NewPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  await expose(() => assertOps(actor, "新建方案页"));
  const { id } = await params;
  const enterprise = await expose(() => getEnterprise(actor, id));
  return (
    <div>
      <PageHeader eyebrow={enterprise.name} title="新建方案" description="残保金基数、缺口和月服务费按元填写。签约状态可以逐步流转。" />
      <PlanForm mode="create" enterpriseId={enterprise.id} />
    </div>
  );
}
