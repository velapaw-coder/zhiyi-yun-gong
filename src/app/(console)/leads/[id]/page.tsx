import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { LeadEditor, LeadProposalButton } from "@/components/lead-actions";
import { LevyReport } from "@/components/levy/report";
import { REGIONS } from "@/lib/levy";
import { formatDateTime } from "@/lib/format";
import { LEAD_STATUS, getLead } from "@/server/leads";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "线索详情" };

const INPUT_LABEL: Array<[string, string, string?]> = [
  ["region", "地区"],
  ["employees", "在职职工", "人"],
  ["ratio", "安置比例", "%"],
  ["avgWage", "职工年平均工资", "元"],
  ["socialAvgWage", "社会平均工资", "元"],
  ["minWage", "最低工资", "元/月"],
  ["monthlyWage", "安置人员月工资", "元"],
  ["monthlySocial", "单位社保", "元/月"],
  ["placedMild", "已安置轻度", "人"],
  ["placedSevere", "已安置重度", "人"],
];

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const lead = await expose(() => getLead(actor, id));
  return (
    <div className="grid gap-5">
      <Link href="/leads" className="text-sm text-primary">
        ← 线索列表
      </Link>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="zy-surface p-5 md:p-6" data-testid="lead-detail">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-zy-deep">{lead.company}</h1>
            <StatusBadge map={LEAD_STATUS} value={lead.status} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-3">
            {[
              ["联系人", lead.contact],
              ["手机", lead.phone],
              ["意向", lead.plan ?? "—"],
              ["来源", lead.source === "/calculator" ? "计算器页" : "首页"],
              ["提交时间", formatDateTime(lead.createdAt)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-zy-muted">{k}</dt>
                <dd className="mt-0.5 font-medium text-zy-deep">{k === "手机" ? <a href={`tel:${v}`}>{v}</a> : v}</dd>
              </div>
            ))}
          </dl>
          {lead.note ? <p className="mt-4 rounded-lg bg-zy-pale p-3 text-sm leading-6 whitespace-pre-wrap text-zy-deep">{lead.note}</p> : null}
          {lead.input ? (
            <>
              <h2 className="mt-6 font-bold text-zy-deep">客户填写的测算参数</h2>
              <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
                {INPUT_LABEL.map(([k, label, unit]) => {
                  const raw = lead.input?.[k] ?? "";
                  const v = k === "region" ? (REGIONS.find((r) => r.code === raw)?.name ?? raw) : raw ? `${raw}${unit ? ` ${unit}` : ""}` : "—";
                  return (
                    <div key={k}>
                      <dt className="text-xs text-zy-muted">{label}</dt>
                      <dd className="num mt-0.5">{v}</dd>
                    </div>
                  );
                })}
              </dl>
            </>
          ) : (
            <p className="mt-6 text-sm text-zy-muted">客户没有附带测算数据。</p>
          )}
        </section>
        <aside className="grid content-start gap-4">
          <div className="zy-surface p-5">
            <LeadProposalButton id={lead.id} proposalId={lead.proposalId} hasCalc={Boolean(lead.input)} />
          </div>
          <div className="zy-surface p-5">
            <LeadEditor id={lead.id} status={lead.status} ownerNote={lead.ownerNote ?? ""} statuses={LEAD_STATUS} />
          </div>
        </aside>
      </div>
      {lead.result ? (
        <section className="grid gap-3">
          <h2 className="font-bold text-zy-deep">测算结果（服务端按现行规则重算）</h2>
          <LevyReport result={lead.result} />
        </section>
      ) : null}
    </div>
  );
}
