"use client";

import { useState } from "react";

const PLANS = ["希望先了解整体方案", "套餐 A · 合规版", "套餐 B · 增长版", "套餐 C · ESG 版"];

const inputClass =
  "w-full rounded-lg border border-[#cbd8de] bg-white px-3 py-2.5 text-base text-zy-text sm:text-sm outline-none transition placeholder:text-[#8a9aa3] focus:border-zy-cyan focus:ring-3 focus:ring-zy-cyan/20";

export function LeadForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = [
      "智翼云工合作咨询",
      `企业名称：${String(form.get("company") ?? "").trim()}`,
      `联系人：${String(form.get("person") ?? "").trim()}`,
      `联系电话：${String(form.get("phone") ?? "").trim()}`,
      `感兴趣的服务：${String(form.get("plan") ?? "")}`,
      `主要需求：${String(form.get("note") ?? "").trim()}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setFallback(null);
      setMessage("已复制咨询内容，请粘贴到您使用的沟通渠道发送。");
    } catch {
      setMessage("浏览器未允许自动复制，请手动复制以下内容：");
      setFallback(text);
    }
  }

  return (
    <form onSubmit={onSubmit} className="zy-surface p-6 md:p-8">
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
          联系电话 *
          <input name="phone" type="tel" required minLength={6} maxLength={25} placeholder="电话 / 手机号码" className={inputClass} />
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
      </div>
      <p className="mt-4 text-xs leading-5 text-[#697d87]">
        当前页面不会上传表单信息。点击下方按钮可复制咨询内容，再通过您确认的正式联系方式发送。
      </p>
      <button
        type="submit"
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-zy-blue px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-zy-deep"
      >
        复制合作咨询内容 →
      </button>
      {message ? (
        <p role="status" aria-live="polite" className="mt-3 text-xs leading-5 text-zy-teal">
          {message}
        </p>
      ) : null}
      {fallback ? <pre className="mt-2 rounded-lg bg-zy-pale p-3 text-xs whitespace-pre-wrap text-zy-deep">{fallback}</pre> : null}
    </form>
  );
}
