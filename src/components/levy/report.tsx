import { POLICY_TIER_END, TIER_LABEL, percentBp, yuan, type LevyResult, type Scenario, type Tier } from "@/lib/levy";

const TIER_TONE: Record<Tier, string> = {
  exempt: "bg-[#e7f5ee] text-[#1e6b48] ring-[#bfe3cf]",
  met: "bg-[#e7f5ee] text-[#1e6b48] ring-[#bfe3cf]",
  half: "bg-[#fbf3e2] text-[#7a5512] ring-[#efd9a8]",
  ninety: "bg-[#fbeceb] text-[#8f2d27] ring-[#efc7c4]",
};

export function TierBadge({ tier }: { tier: Tier }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${TIER_TONE[tier]}`}>{TIER_LABEL[tier]}</span>;
}

function Money({ fen, className = "" }: { fen: number; className?: string }) {
  return <span className={`num ${fen < 0 ? "text-zy-rose" : ""} ${className}`}>¥{yuan(fen)}</span>;
}

function Kpi({ label, children, note, tone = "text-zy-deep" }: { label: string; children: React.ReactNode; note?: string; tone?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-white p-4 ring-1 ring-zy-line">
      <p className="text-xs font-semibold text-zy-muted">{label}</p>
      <p className={`mt-1 truncate text-xl font-bold md:text-2xl ${tone}`}>{children}</p>
      {note ? <p className="mt-1 text-xs leading-5 text-zy-muted">{note}</p> : null}
    </div>
  );
}

function roiText(s: Scenario) {
  return s.roi === null ? "—" : `1 : ${s.roi.toFixed(2)}`;
}

export function LevyReport({ result, compact = false }: { result: LevyResult; compact?: boolean }) {
  const r = result;
  const rec = r.recommended;
  const full = r.scenarios.find((s) => s.key === "full");
  const onsite = r.scenarios.find((s) => s.key === "onsite");
  const mainScenarios = r.scenarios.filter((s) => s.key !== "onsite");

  return (
    <div className="@container grid gap-5" data-testid="levy-report">
      <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
        <Kpi label="当前年应缴残保金" tone="text-zy-rose" note={TIER_LABEL[r.current.tier]}>
          <Money fen={r.current.levyFen} />
        </Kpi>
        <Kpi label="建议新增安置" note={rec.newPersons > 0 ? (rec.kind === "severe" ? "重度，1 人按 2 人计" : "轻度") : "维持现状更划算"}>
          <span className="num" data-testid="rec-persons">{rec.newPersons}</span> 人
        </Kpi>
        <Kpi label="年节省残保金" tone="text-zy-green" note={`年安置成本 ¥${yuan(rec.costFen)}`}>
          <Money fen={rec.savingFen} />
        </Kpi>
        <Kpi label="年净节省" tone={rec.netFen >= 0 ? "text-zy-blue" : "text-zy-rose"} note={`投入产出 ${roiText(rec)}`}>
          <Money fen={rec.netFen} />
        </Kpi>
      </div>

      {r.warnings.length ? (
        <ul className="grid gap-1.5 rounded-xl bg-[#fbf3e2] p-4 text-xs leading-5 text-[#7a5512] ring-1 ring-[#efd9a8]">
          {r.warnings.map((w) => (
            <li key={w}>· {w}</li>
          ))}
        </ul>
      ) : null}

      <section className="rounded-xl bg-white p-4 ring-1 ring-zy-line md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-zy-deep">当前状态</h3>
          <TierBadge tier={r.current.tier} />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm @2xl:grid-cols-4">
          {[
            ["应安置人数", `${r.current.required.toFixed(2)} 人`],
            ["已安置（折算）", `${r.current.counted} 人`],
            ["实际安置比例", percentBp(r.current.placedRatioBp)],
            ["差额人数", `${r.current.gap.toFixed(2)} 人`],
            ["计征工资基数", `¥${yuan(r.wageBaseFen)}/年${r.capped ? "（2 倍社平封顶）" : ""}`],
            ["减缴前应缴", `¥${yuan(r.current.baseLevyFen)}`],
            ["实际应缴", `¥${yuan(r.current.levyFen)}`],
            ["单人月成本", `¥${yuan(r.monthlyPerPersonFen)}`],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-xs text-zy-muted">{k}</dt>
              <dd className="num font-semibold break-words text-zy-deep">{v}</dd>
            </div>
          ))}
        </dl>
        {!r.exempt && r.current.tier !== "met" && r.levyWithoutTierFen !== r.current.levyFen ? (
          <p className="mt-3 text-xs leading-5 text-zy-muted">
            分档减缴执行至 {POLICY_TIER_END}。若到期不再延续，按当前安置情况全额应缴约 <strong className="text-zy-deep">¥{yuan(r.levyWithoutTierFen)}</strong>/年。
          </p>
        ) : null}
      </section>

      {mainScenarios.length > 1 || onsite ? (
        <section className="overflow-hidden rounded-xl bg-white ring-1 ring-zy-line">
          <h3 className="px-4 pt-4 font-bold text-zy-deep md:px-5">方案对比</h3>
          <ul className="mt-3 grid gap-px bg-zy-line @3xl:hidden">
            {r.scenarios.map((s) => (
              <li key={s.key} className={`bg-white px-4 py-3 ${s.key === rec.key ? "bg-zy-pale/60" : ""}`} data-scenario-card={s.key}>
                <p className="font-semibold text-zy-deep">
                  {s.label}
                  {s.key === rec.key ? <span className="ml-2 inline-block rounded-full bg-zy-gold px-2 py-0.5 align-middle text-[11px] leading-4 font-bold whitespace-nowrap text-zy-deep">推荐</span> : null}
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <dt className="text-zy-muted">新增 / 比例</dt>
                  <dd className="num text-right">{s.newPersons} 人 · {percentBp(s.state.placedRatioBp)}</dd>
                  <dt className="text-zy-muted">安置后应缴</dt>
                  <dd className="text-right"><Money fen={s.state.levyFen} /></dd>
                  <dt className="text-zy-muted">年节省 / 年成本</dt>
                  <dd className="text-right"><Money fen={s.savingFen} className="text-zy-green" /> / <Money fen={s.costFen} /></dd>
                  <dt className="text-zy-muted">年净节省</dt>
                  <dd className="text-right font-bold"><Money fen={s.netFen} /></dd>
                  <dt className="text-zy-muted">投入产出</dt>
                  <dd className="num text-right">{roiText(s)}</dd>
                </dl>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto @3xl:block">
            <table className="mt-3 w-full min-w-[720px] text-sm" data-levy-table>
              <thead className="bg-[#f1f6f8] text-left text-xs text-zy-deep">
                <tr>
                  {["方案", "新增人数", "安置后比例", "安置后应缴", "年节省", "年成本", "年净节省", "投入产出"].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold first:pl-4 md:first:pl-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.scenarios.map((s) => (
                  <tr key={s.key} className={`border-t border-zy-line ${s.key === rec.key ? "bg-zy-pale/60" : ""}`} data-scenario={s.key}>
                    <td className="px-3 py-2.5 pl-4 font-semibold text-zy-deep md:pl-5">
                      {s.label}
                      {s.key === rec.key ? <span className="ml-2 inline-block rounded-full bg-zy-gold px-2 py-0.5 align-middle text-[11px] leading-4 font-bold whitespace-nowrap text-zy-deep">推荐</span> : null}
                    </td>
                    <td className="num px-3 py-2.5">{s.newPersons} 人</td>
                    <td className="num px-3 py-2.5">{percentBp(s.state.placedRatioBp)}</td>
                    <td className="px-3 py-2.5"><Money fen={s.state.levyFen} /></td>
                    <td className="px-3 py-2.5 text-zy-green"><Money fen={s.savingFen} /></td>
                    <td className="px-3 py-2.5"><Money fen={s.costFen} /></td>
                    <td className="px-3 py-2.5 font-bold"><Money fen={s.netFen} /></td>
                    <td className="num px-3 py-2.5">{roiText(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-4 py-3 text-xs leading-5 text-zy-muted md:px-5">
            年成本 = 新增人数 × 12 ×（月工资 + 企业社保 + 服务费）；轻度到岗方案按管理成本 200 元/人/月估算，不含服务费。推荐取年净节省最高的方案。
          </p>
        </section>
      ) : null}

      {compact ? null : (
        <>
          <section className="rounded-xl bg-white p-4 ring-1 ring-zy-line md:p-5">
            <h3 className="font-bold text-zy-deep">测算明细</h3>
            <ol className="mt-3 grid gap-2 text-sm leading-6 text-zy-text">
              <li>
                <span className="text-zy-muted">① 应安置人数 = </span>
                <span className="num">{r.input.employees} × {percentBp(r.input.ratioBp, 1)} = {r.current.required.toFixed(2)} 人</span>
              </li>
              <li>
                <span className="text-zy-muted">② 已安置折算 = </span>
                <span className="num">轻度 {r.input.placedMild} + 重度 {r.input.placedSevere} × 2 = {r.current.counted} 人</span>
              </li>
              <li>
                <span className="text-zy-muted">③ 计征工资 = </span>
                <span className="num">
                  {r.capped ? `min(¥${yuan(r.input.avgWageYuan * 100)}, 2 × ¥${yuan(r.input.socialAvgWageYuan * 100)}) = ` : ""}¥{yuan(r.wageBaseFen)}/年
                </span>
              </li>
              <li>
                <span className="text-zy-muted">④ 减缴前应缴 = </span>
                <span className="num">{r.current.gap.toFixed(2)} × ¥{yuan(r.wageBaseFen)} = ¥{yuan(r.current.baseLevyFen)}</span>
              </li>
              <li>
                <span className="text-zy-muted">⑤ 实际应缴 = </span>
                <span className="num">{TIER_LABEL[r.current.tier]} → ¥{yuan(r.current.levyFen)}</span>
              </li>
            </ol>
          </section>

          {!r.exempt ? (
            <section className="grid gap-3 @2xl:grid-cols-3">
              <article className="rounded-xl bg-white p-4 ring-1 ring-zy-line">
                <p className="text-xs font-bold tracking-wider text-zy-rose">方案一 · 不建议</p>
                <h4 className="mt-1 font-bold text-zy-deep">名义挂靠</h4>
                <p className="mt-2 text-sm leading-6 text-zy-muted">
                  没有真实岗位和工作成果，合同、工资、社保对不上。被认定虚假安置要追缴并加收每日 5‰ 滞纳金，还影响企业信用。
                </p>
              </article>
              <article className="rounded-xl bg-white p-4 ring-1 ring-zy-line">
                <p className="text-xs font-bold tracking-wider text-[#7a5512]">方案二 · 合规但管理重</p>
                <h4 className="mt-1 font-bold text-zy-deep">轻度残疾人到岗自管</h4>
                <p className="mt-2 text-sm leading-6 text-zy-muted">
                  {onsite ? (
                    <>
                      需 <strong className="text-zy-deep">{onsite.newPersons}</strong> 人到岗，年成本约 <strong className="text-zy-deep">¥{yuan(onsite.costFen)}</strong>，年净节省 <strong className="text-zy-deep">¥{yuan(onsite.netFen)}</strong>。
                    </>
                  ) : (
                    "当前已达标。"
                  )}
                  考勤、培训、安全管理都在企业侧，离职后指标容易断档。
                </p>
              </article>
              <article className="rounded-xl bg-zy-deep p-4 text-white">
                <p className="text-xs font-bold tracking-wider text-zy-gold-soft">方案三 · 智翼云工</p>
                <h4 className="mt-1 font-bold">智翼云工 · AI 数字岗位</h4>
                <p className="mt-2 text-sm leading-6 text-[#d4e7ef]">
                  {full ? (
                    <>
                      {full.kind === "severe" ? "重度" : "轻度"} {full.newPersons} 人足额达标，年成本约 ¥{yuan(full.costFen)}，年净节省 ¥{yuan(full.netFen)}。
                    </>
                  ) : (
                    "当前已达标，可继续用五流档案巩固合规。"
                  )}
                  合同、社保、薪酬、成果、数字行为五流留痕，可随时接受残联与税务核验。
                </p>
              </article>
            </section>
          ) : null}
        </>
      )}

      <p className="text-xs leading-5 text-zy-muted">
        依据：财税〔2015〕72号、财政部公告2019年第98号、财政部公告2023年第8号（分档减缴与 30 人以下企业免征执行至 {POLICY_TIER_END}）。本测算仅供参考，以属地残联审核和税务机关核定为准。
      </p>
    </div>
  );
}
