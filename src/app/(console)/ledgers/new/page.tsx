import { LedgerCreateForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { currentYearMonth } from "@/lib/format";
import { ledgerFormOptions } from "@/server/repo";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "新建台账" };

export default async function NewLedgerPage() {
  const actor = await requireActor();
  const options = await expose(() => ledgerFormOptions(actor));
  return (
    <div>
      <PageHeader eyebrow="台账" title="新建月度台账" description="一个人一个月一条。材料在下一页按四流分别上传。" />
      <LedgerCreateForm enterprises={options.enterprises} talents={options.talents} defaultMonth={currentYearMonth()} />
    </div>
  );
}
