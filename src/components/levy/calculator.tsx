"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { calculateLevy, summaryText } from "@/lib/levy";
import { DEFAULT_DRAFT, LevyFields, draftToInput, regionName, type LevyDraft } from "@/components/levy/fields";
import { LevyReport } from "@/components/levy/report";
import { markCalcTouched, setCalcDraft } from "@/components/levy/calc-store";

/**
 * 公开的残保金计算器。全部在浏览器里算，页面本身是静态的；
 * 服务费默认值从 /api/calc-config 读一次（运营后台可改），读不到就用 500。
 */
export function LevyCalculator({ compact = false }: { compact?: boolean }) {
  const [draft, setDraft] = useState<LevyDraft>(DEFAULT_DRAFT);
  const [copied, setCopied] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const result = useMemo(() => calculateLevy(draftToInput(draft)), [draft]);

  const [touched, setTouched] = useState(false);
  useEffect(() => {
    setCalcDraft(draft, touched);
  }, [draft, touched]);
  const edit = (next: LevyDraft) => {
    setTouched(true);
    setDraft(next);
  };

  useEffect(() => {
    let alive = true;
    fetch("/api/calc-config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { serviceFeeYuan?: number } | null) => {
        if (!alive || !data || typeof data.serviceFeeYuan !== "number") return;
        setDraft((d) => ({ ...d, serviceFee: String(data.serviceFeeYuan) }));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  async function copy() {
    const text = summaryText(result, undefined, regionName(draft));
    try {
      await navigator.clipboard.writeText(text);
      setFallback(null);
      setCopied("已复制测算结果，可粘贴到咨询表单或发给我们。");
    } catch {
      setCopied("浏览器未允许自动复制，请手动复制：");
      setFallback(text);
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[0.82fr_1.18fr]" data-testid="levy-calculator">
      <div className="zy-surface p-5 md:p-6 lg:sticky lg:top-24">
        <h3 className="mb-4 flex items-center justify-between text-base font-bold text-zy-deep">
          企业参数
          <button type="button" onClick={() => setDraft(DEFAULT_DRAFT)} className="min-h-9 rounded-md px-2 text-xs font-semibold text-zy-teal hover:bg-zy-pale">
            恢复示例
          </button>
        </h3>
        <LevyFields draft={draft} onChange={edit} feeEditable={false} />
      </div>
      <div className="grid min-w-0 gap-4">
        <LevyReport result={result} compact={compact} />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg bg-zy-blue px-5 text-sm font-bold text-white transition hover:bg-zy-deep sm:flex-none"
          >
            复制测算结果
          </button>
          <a
            href="#contact"
            onClick={() => {
              setTouched(true);
              markCalcTouched();
            }}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg bg-zy-gold px-5 text-sm font-bold text-zy-deep transition hover:brightness-105 sm:flex-none"
          >
            预约定制方案书 →
          </a>
          {compact ? (
            <Link href="/calculator" className="inline-flex min-h-12 items-center px-2 text-sm font-semibold text-zy-blue hover:text-zy-cyan">
              查看完整测算与方案对比 →
            </Link>
          ) : null}
        </div>
        {copied ? (
          <p role="status" aria-live="polite" className="text-xs leading-5 text-zy-teal">
            {copied}
          </p>
        ) : null}
        {fallback ? <pre className="rounded-lg bg-zy-pale p-3 text-xs whitespace-pre-wrap text-zy-deep">{fallback}</pre> : null}
      </div>
    </div>
  );
}
