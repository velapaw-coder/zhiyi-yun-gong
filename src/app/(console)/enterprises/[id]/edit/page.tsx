import { DeleteEnterpriseButton, EnterpriseForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { getEnterprise } from "@/server/repo";
import { expose } from "@/server/page";
import { assertOps } from "@/server/access";
import { requireActor } from "@/server/session";

export const metadata = { title: "编辑企业" };

export default async function EditEnterprisePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  await expose(() => assertOps(actor, "编辑企业页"));
  const { id } = await params;
  const enterprise = await expose(() => getEnterprise(actor, id));
  return (
    <div>
      <PageHeader eyebrow={enterprise.code} title={`编辑 ${enterprise.name}`} />
      <EnterpriseForm
        mode="edit"
        id={enterprise.id}
        defaults={{
          code: enterprise.code,
          name: enterprise.name,
          industry: enterprise.industry ?? "",
          scaleHeadcount: enterprise.scaleHeadcount,
          contactName: enterprise.contactName,
          contactPhone: enterprise.contactPhone,
          contactEmail: enterprise.contactEmail ?? "",
          status: enterprise.status,
          remark: enterprise.remark ?? "",
        }}
      />
      <DeleteEnterpriseButton id={enterprise.id} />
    </div>
  );
}
