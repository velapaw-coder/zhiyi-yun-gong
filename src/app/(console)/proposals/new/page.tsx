import { PageHeader } from "@/components/page-header";
import { ProposalForm } from "@/components/proposal-forms";
import { assertOps } from "@/server/access";
import { prisma } from "@/server/db";
import { expose } from "@/server/page";
import { getServiceFeeFen } from "@/server/proposals";
import { requireActor } from "@/server/session";
import { one } from "@/lib/format";

export const metadata = { title: "新建方案书" };

export default async function NewProposalPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requireActor();
  await expose(() => assertOps(actor, "新建方案书页"));
  const sp = await searchParams;
  const [enterprises, fee] = await Promise.all([
    prisma.enterprise.findMany({ select: { id: true, name: true, scaleHeadcount: true }, orderBy: { name: "asc" }, take: 500 }),
    getServiceFeeFen(),
  ]);
  return (
    <div>
      <PageHeader eyebrow="方案书" title="新建残保金方案书" description="左边填参数，右边实时出结果。保存时服务端会按同一套规则重新计算。" />
      <ProposalForm enterprises={enterprises} serviceFeeYuan={fee / 100} initialEnterpriseId={one(sp.enterpriseId)} />
    </div>
  );
}
