import { TalentForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { assertOps } from "@/server/access";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "新建人才" };

export default async function NewTalentPage() {
  const actor = await requireActor();
  await expose(() => assertOps(actor, "新建人才页"));
  return (
    <div>
      <PageHeader eyebrow="人才" title="新建人才" description="先建档案。培训结业后再到详情页上岗，并在账号页开通执行端登录。" />
      <TalentForm mode="create" />
    </div>
  );
}
