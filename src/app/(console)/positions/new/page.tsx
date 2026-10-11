import { PositionForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { positionFormOptions } from "@/server/repo";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "新建岗位" };

export default async function NewPositionPage() {
  const actor = await requireActor();
  const enterprises = await expose(() => positionFormOptions(actor));
  return (
    <div>
      <PageHeader eyebrow="岗位" title="新建岗位" description="先选企业和方案。交付标准要能数得清，质检规则一行一条。" />
      <PositionForm mode="create" enterprises={enterprises} />
    </div>
  );
}
