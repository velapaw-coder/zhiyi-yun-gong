import { EnterpriseForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { requireActor } from "@/server/session";
import { assertOps } from "@/server/access";
import { expose } from "@/server/page";
import { one } from "@/lib/format";

export const metadata = { title: "新建企业" };

export default async function NewEnterprisePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requireActor();
  await expose(() => assertOps(actor, "打开新建企业"));
  const sp = await searchParams;
  const fromProposal = one(sp.fromProposal) || undefined;
  const headcount = Number.parseInt(one(sp.headcount), 10);
  const defaults = fromProposal
    ? {
        name: one(sp.name).slice(0, 80),
        industry: "",
        scaleHeadcount: Number.isFinite(headcount) && headcount > 0 ? headcount : 100,
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        status: "potential",
        remark: "",
      }
    : undefined;
  return (
    <div>
      <PageHeader
        eyebrow="企业"
        title="新建企业"
        description={fromProposal ? "方案书的客户还没有企业档案。先补齐对接人和电话，保存后直接进入签单方案。" : "必填企业名、规模、对接人和电话。签约细节在方案里。"}
      />
      <EnterpriseForm mode="create" defaults={defaults} fromProposal={fromProposal} />
    </div>
  );
}
