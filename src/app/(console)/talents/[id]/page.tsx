import { BindForm, DeleteTalentButton, TalentForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { parseStringArray } from "@/lib/format";
import { TALENT_STATUS, TRAINING_PROGRESS } from "@/lib/labels";
import { bindOptions, getTalent } from "@/server/repo";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "人才档案" };

export default async function TalentPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const talent = await expose(() => getTalent(actor, id));
  const positions = actor.role === "ops" ? await bindOptions(actor) : [];
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={talent.code}
        title={talent.name}
        description={
          talent.currentEnterprise
            ? `在岗：${talent.currentEnterprise.name} / ${talent.currentPosition?.name ?? ""}`
            : "尚未上岗"
        }
        actions={
          <>
            <StatusBadge map={TALENT_STATUS} value={talent.status} />
            <StatusBadge map={TRAINING_PROGRESS} value={talent.trainingProgress} />
          </>
        }
      />
      {actor.role === "ops" ? (
        <TalentForm
          mode="edit"
          id={talent.id}
          defaults={{
            code: talent.code,
            name: talent.name,
            disabilityCertNo: talent.disabilityCertNo,
            disabilityType: talent.disabilityType,
            disabilityLevel: talent.disabilityLevel ?? "",
            phone: talent.phone,
            skillTags: parseStringArray(talent.skillTags).join("，"),
            trainingProgress: talent.trainingProgress,
            trainingPercent: talent.trainingPercent,
            status: talent.status,
          }}
        />
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {actor.role === "ops" ? (
          <BindForm
            talentId={talent.id}
            positions={positions.map((position) => ({
              id: position.id,
              name: position.name,
              code: position.code,
              headcount: position.headcount,
              enterpriseName: position.enterprise.name,
            }))}
          />
        ) : null}
        <section className="rounded-xl bg-card p-4 text-sm ring-1 ring-zy-line shadow-zy">
          <h2 className="font-bold text-zy-deep">登录账号</h2>
          <p className="mt-2 text-muted-foreground">
            {talent.account ? `${talent.account.loginName}（${talent.account.status === "active" ? "启用" : "停用"}）` : "还没有执行端账号。到「账号」页绑定这位人才。"}
          </p>
          {actor.role === "ops" ? (
            <div className="mt-4">
              <DeleteTalentButton id={talent.id} />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
