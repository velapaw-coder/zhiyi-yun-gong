import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { maskCert, maskPhone, parseStringArray } from "@/lib/format";
import { TALENT_STATUS, TRAINING_PROGRESS } from "@/lib/labels";
import { myProfile } from "@/server/repo";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "我的档案" };

export default async function MePage() {
  const actor = await requireActor();
  const talent = await expose(() => myProfile(actor));
  return (
    <div>
      <PageHeader
        eyebrow="执行端"
        title={talent.name}
        description="这是你的基础档案，只能查看。证件号按规则只显示后四位。"
        actions={
          <>
            <StatusBadge map={TALENT_STATUS} value={talent.status} />
            <StatusBadge map={TRAINING_PROGRESS} value={talent.trainingProgress} />
          </>
        }
      />
      <dl className="grid gap-4 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">编号</dt>
          <dd className="mt-1 font-mono">{talent.code}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">电话</dt>
          <dd className="mt-1">{talent.phone}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">残疾类别</dt>
          <dd className="mt-1">
            {talent.disabilityType}
            {talent.disabilityLevel ? ` · ${talent.disabilityLevel}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">残疾证号</dt>
          <dd className="mt-1 font-mono">{maskCert(talent.disabilityCertNo)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">培训</dt>
          <dd className="mt-1">{talent.trainingPercent}%</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">技能</dt>
          <dd className="mt-1">{parseStringArray(talent.skillTags).join("、") || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">在岗企业</dt>
          <dd className="mt-1">{talent.currentEnterprise?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">在岗岗位</dt>
          <dd className="mt-1">{talent.currentPosition?.name ?? "—"}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">对外联系电话脱敏示例：{maskPhone(talent.phone)}。你本人在这里仍能看到完整号码。</p>
    </div>
  );
}
