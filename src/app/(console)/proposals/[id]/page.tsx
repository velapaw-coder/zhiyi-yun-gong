import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { StatusBadge } from "@/components/status-badge";
import { ProposalActions } from "@/components/proposal-forms";
import { LevyReport } from "@/components/levy/report";
import { REGIONS, percentBp, yuan } from "@/lib/levy";
import { PROPOSAL_STATUS, getProposal } from "@/server/proposals";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "方案书" };

export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const p = await expose(() => getProposal(actor, id));
  const r = p.parsed;
  const input = p.inputValues;
  const region = REGIONS.find((x) => x.code === p.region);
  const convertHref = p.enterpriseId
    ? `/enterprises/${p.enterpriseId}/plans/new?fromProposal=${p.id}`
    : `/enterprises/new?fromProposal=${p.id}&name=${encodeURIComponent(p.companyName)}&headcount=${input.employees}`;
  const date = p.createdAt.toISOString().slice(0, 10);

  return (
    <div className="grid gap-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/proposals" className="text-sm text-primary">
          ← 方案书列表
        </Link>
        <ProposalActions
          id={p.id}
          status={p.status}
          canEdit={actor.role === "ops"}
          convertHref={convertHref}
          planHref={p.plan ? `/plans/${p.plan.id}` : null}
        />
      </div>

      <article className="proposal-doc grid gap-5 rounded-2xl bg-zy-paper print:bg-white" data-testid="proposal-doc">
        <header className="zy-hero-bg overflow-hidden rounded-2xl p-5 text-white md:p-8 print:rounded-none">
          <div className="flex items-center gap-3">
            <BrandMark tone="glass" />
            <div className="leading-tight">
              <p className="font-bold tracking-wide">智翼云工</p>
              <p className="text-[10px] tracking-[0.08em] text-white/60">SMARTWING CLOUDWORK</p>
            </div>
            <span className="ml-auto">
              <StatusBadge map={PROPOSAL_STATUS} value={p.status} />
            </span>
          </div>
          <p className="mt-6 text-xs font-bold tracking-[0.14em] text-[#9fe0ef]">残保金合规优化方案书 · {p.code}</p>
          <h1 className="mt-2 text-2xl leading-snug font-bold md:text-3xl">{p.companyName}</h1>
          <p className="mt-2 text-sm text-[#d4e7ef]">
            {region?.name.replace(/（.*）/, "") ?? p.region} · 安置比例 {percentBp(input.ratioBp, 1)} · 在职职工 {input.employees} 人 · 出具日期 {date}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["当前年应缴", `¥${yuan(r.current.levyFen)}`],
              ["建议新增安置", `${r.recommended.newPersons} 人`],
              ["年节省", `¥${yuan(r.recommended.savingFen)}`],
              ["年净节省", `¥${yuan(r.recommended.netFen)}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15">
                <p className="text-xs text-[#adcfd9]">{k}</p>
                <p className="num mt-1 text-lg font-bold md:text-xl">{v}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="rounded-xl bg-white p-4 ring-1 ring-zy-line md:p-5">
          <h2 className="font-bold text-zy-deep">01 · 企业参数</h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
            {[
              ["职工年平均工资", `¥${yuan(input.avgWageYuan * 100)}`],
              ["当地社会平均工资", input.socialAvgWageYuan ? `¥${yuan(input.socialAvgWageYuan * 100)}` : "未填"],
              ["当地最低工资", `¥${yuan(input.minWageYuan * 100)}/月`],
              ["安置人员月工资", `¥${yuan(input.monthlyWageYuan * 100)}/月`],
              ["企业社保", `¥${yuan(input.monthlySocialYuan * 100)}/月`],
              ["服务费", `¥${yuan(p.serviceFee)}/人/月`],
              ["已安置", `轻度 ${input.placedMild} · 重度 ${input.placedSevere}`],
              ["新增按", input.newKind === "severe" ? "重度（1 人按 2 人）" : "轻度"],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs text-zy-muted">{k}</dt>
                <dd className="num font-semibold text-zy-deep">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div>
          <h2 className="mb-3 font-bold text-zy-deep">02 · 测算结果与方案对比</h2>
          <LevyReport result={r} />
        </div>

        {p.remark ? (
          <section className="rounded-xl bg-white p-4 ring-1 ring-zy-line md:p-5">
            <h2 className="font-bold text-zy-deep">备注</h2>
            <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-zy-text">{p.remark}</p>
          </section>
        ) : null}

        <footer className="rounded-xl bg-zy-pale/70 p-4 text-xs leading-5 text-zy-muted md:p-5">
          <p>
            出具：深圳市智翼云工科技有限公司 · {p.createdBy.displayName} · {date}
            {p.enterprise ? ` · 企业档案 ${p.enterprise.code}` : ""}
            {p.plan ? ` · 已转签单方案 ${p.plan.code}` : ""}
          </p>
          <p className="mt-1">免责声明：本方案书基于企业提供的参数测算，减免金额以属地残联审核和税务机关核定为准。</p>
        </footer>
      </article>
    </div>
  );
}
