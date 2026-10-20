"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand";
import { useCalcDraft } from "@/components/levy/calc-store";
import { draftToInput, regionName, type LevyDraft } from "@/components/levy/fields";
import { LevyReport } from "@/components/levy/report";
import { calculateLevy, yuan, type LevyResult } from "@/lib/levy";

const PLANS = ["希望先了解整体方案", "套餐 A · 合规版", "套餐 B · 增长版", "套餐 C · ESG 版"];
const CN_MOBILE = /^1[3-9]\d{9}$/;

const inputClass =
  "w-full rounded-lg border border-[#cbd8de] bg-white px-3 py-2.5 text-base text-zy-text sm:text-sm outline-none transition placeholder:text-[#8a9aa3] focus:border-zy-cyan focus:ring-3 focus:ring-zy-cyan/20";

type Done = { company: string; result: LevyResult | null; draft: LevyDraft | null; date: string };

export function LeadForm() {
  const pathname = usePathname();
  const calc = useCalcDraft();
  const [attach, setAttach] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  const hasCalc = Boolean(calc.draft && calc.touched);
  const preview = hasCalc && calc.draft ? calculateLevy(draftToInput(calc.draft)) : null;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const phone = String(form.get("phone") ?? "").replace(/[\s-]/g, "").replace(/^\+?86/, "");
    if (!CN_MOBILE.test(phone)) {
      setError("请填写正确的 11 位手机号码");
      return;
    }
    const draft = hasCalc && attach ? calc.draft : null;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          company: form.get("company"),
          contact: form.get("person"),
          phone,
          plan: form.get("plan"),
          note: form.get("note"),
          website: form.get("website"),
          source: pathname,
          calc: draft,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; result?: LevyResult | null };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "提交失败，请稍后重试");
        return;
      }
      setDone({ company: String(form.get("company") ?? "").trim(), result: data.result ?? null, draft, date: new Date().toLocaleDateString("zh-CN") });
    } catch {
      setError("网络异常，请检查网络后重试");
    } finally {
      setBusy(false);
    }
  }

  function printReport() {
    document.body.classList.add("zy-print-lead");
    const clean = () => document.body.classList.remove("zy-print-lead");
    window.addEventListener("afterprint", clean, { once: true });
    window.print();
    // 安卓 App 里 print 是异步的系统打印，由 App 在打印结束后触发 afterprint
    if (!/ZhiyiApp/.test(navigator.userAgent)) setTimeout(clean, 1000);
  }

  if (done) {
    return (
      <div className="zy-surface p-6 md:p-8" data-testid="lead-done">
        <p className="text-lg font-bold text-zy-deep">✓ 已提交，顾问将在 1 个工作日内联系您</p>
        <p className="mt-2 text-sm leading-6 text-zy-muted">
          {done.company}，感谢您的信任。{done.result ? "您的测算参数和结果已一并提交，顾问会据此复核并出具定制方案书。" : "如需先看看贵司的残保金情况，可以用上方的计算器测算。"}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {done.result ? (
            <button
              type="button"
              onClick={printReport}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-zy-blue px-5 text-sm font-bold text-white hover:bg-zy-deep"
            >
              下载 / 打印测算报告
            </button>
          ) : null}
          <button type="button" onClick={() => setDone(null)} className="inline-flex min-h-12 items-center px-3 text-sm font-semibold text-zy-blue hover:text-zy-cyan">
            再提交一条
          </button>
        </div>
        {done.result ? <p className="mt-3 text-xs text-zy-muted">在打印窗口选择「另存为 PDF」即可保存报告。</p> : null}
        {done.result
          ? createPortal(
              <div id="zy-lead-print" className="proposal-doc">
                <div className="zy-hero-bg mb-5 flex items-center gap-3 rounded-2xl p-5 text-white">
                  <BrandMark tone="glass" />
                  <div className="leading-tight">
                    <p className="font-bold tracking-wide">智翼云工 · 残保金测算报告</p>
                    <p className="text-[10px] tracking-[0.08em] text-white/60">SMARTWING CLOUDWORK</p>
                  </div>
                  <div className="ml-auto text-right text-sm">
                    <p className="font-bold">{done.company}</p>
                    <p className="text-xs text-white/70">
                      {done.draft ? regionName(done.draft) : ""} · {done.date}
                    </p>
                  </div>
                </div>
                <LevyReport result={done.result} />
                <p className="mt-5 text-xs leading-5 text-[#697d87]">本报告由智翼云工残保金计算器按现行政策自动测算，仅供参考，以当地残联和税务部门核定为准。zhiyiyungong.com</p>
              </div>,
              document.body,
            )
          : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="zy-surface p-6 md:p-8" data-testid="lead-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-zy-deep">
          企业名称 *
          <input name="company" required maxLength={80} placeholder="请输入公司名称" className={inputClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-zy-deep">
          联系人 *
          <input name="person" required maxLength={30} placeholder="请输入姓名" className={inputClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-zy-deep">
          手机号码 *
          <input name="phone" type="tel" inputMode="numeric" required maxLength={16} placeholder="11 位手机号" className={inputClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-zy-deep">
          感兴趣的服务
          <select name="plan" className={inputClass} defaultValue={PLANS[0]}>
            {PLANS.map((plan) => (
              <option key={plan}>{plan}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-zy-deep sm:col-span-2">
          主要需求
          <textarea
            name="note"
            maxLength={600}
            rows={4}
            placeholder="例如：企业规模、属地、用工需求、希望交付的数字化工作等"
            className={`${inputClass} resize-y`}
          />
        </label>
        {/* 蜜罐字段：真人看不到 */}
        <label aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          网站
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {preview ? (
        <label className="mt-4 flex items-start gap-2 rounded-lg bg-zy-pale p-3 text-xs leading-5 text-zy-deep">
          <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} className="mt-0.5 size-4" data-testid="lead-attach" />
          <span>
            一并提交刚才的测算：{calc.draft?.employees} 人，当前年应缴残保金 ¥{yuan(preview.current.levyFen)}，建议新增安置 {preview.recommended.newPersons} 人
          </span>
        </label>
      ) : null}
      <p className="mt-4 text-xs leading-5 text-[#697d87]">
        提交后，以上信息{preview && attach ? "和测算数据" : ""}会保存到智翼云工服务器，仅用于顾问联系您、出具方案书，不会出售或提供给第三方。如需删除，可联系顾问处理。
      </p>
      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-zy-blue px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-zy-deep disabled:opacity-60"
      >
        {busy ? "提交中…" : "提交，预约定制方案书 →"}
      </button>
      {error ? (
        <p role="alert" className="mt-3 text-xs leading-5 text-zy-rose">
          {error}
        </p>
      ) : null}
    </form>
  );
}
