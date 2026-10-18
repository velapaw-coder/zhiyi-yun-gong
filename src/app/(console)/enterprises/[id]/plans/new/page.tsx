import { PlanForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { getEnterprise } from "@/server/repo";
import { assertOps } from "@/server/access";
import { expose } from "@/server/page";
import { getProposal, planDefaultsFromProposal } from "@/server/proposals";
import { requireActor } from "@/server/session";
import { one } from "@/lib/format";

export const metadata = { title: "新建方案" };

export default async function NewPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  await expose(() => assertOps(actor, "新建方案页"));
  const { id } = await params;
  const sp = await searchParams;
  const enterprise = await expose(() => getEnterprise(actor, id));
  const proposalId = one(sp.fromProposal);
  const proposal = proposalId ? await expose(() => getProposal(actor, proposalId)) : null;
  const usable = proposal && proposal.status !== "converted" && (!proposal.enterpriseId || proposal.enterpriseId === enterprise.id);
  const defaults = usable ? { code: "", ...planDefaultsFromProposal(proposal, new Date()) } : undefined;
  return (
    <div>
      <PageHeader
        eyebrow={enterprise.name}
        title={usable ? "由方案书转为签单方案" : "新建方案"}
        description="残保金基数、缺口和月服务费按元填写。签约状态可以逐步流转。"
      />
      <PlanForm mode="create" enterpriseId={enterprise.id} defaults={defaults} fromProposal={usable ? { id: proposal.id, code: proposal.code } : undefined} />
    </div>
  );
}
