import { EnterpriseForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { requireActor } from "@/server/session";
import { assertOps } from "@/server/access";
import { expose } from "@/server/page";

export const metadata = { title: "新建企业" };

export default async function NewEnterprisePage() {
  const actor = await requireActor();
  await expose(() => assertOps(actor, "打开新建企业"));
  return (
    <div>
      <PageHeader eyebrow="企业" title="新建企业" description="必填企业名、规模、对接人和电话。签约细节在方案里。" />
      <EnterpriseForm mode="create" />
    </div>
  );
}
