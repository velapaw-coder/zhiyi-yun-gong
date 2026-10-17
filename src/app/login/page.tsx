import Link from "next/link";
import { Suspense } from "react";
import { BrandMark, WingGlyph } from "@/components/brand";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "登录" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-zy-paper lg:grid-cols-[1.1fr_0.9fr]">
      <section className="zy-hero-bg relative hidden flex-col justify-between overflow-hidden px-12 py-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-40 -bottom-40 size-[560px] rounded-full border border-[rgba(227,167,51,.18)] shadow-[0_0_0_70px_rgba(15,163,196,.035),0_0_0_140px_rgba(15,163,196,.025)]" />
        <WingGlyph gradient className="pointer-events-none absolute right-16 bottom-24 size-56 opacity-30" />
        <Link href="/" className="relative flex items-center gap-3" aria-label="返回智翼云工首页">
          <BrandMark tone="glass" />
          <span className="leading-tight">
            <strong className="block text-lg tracking-wide">智翼云工</strong>
            <small className="block text-[10px] tracking-[0.08em] text-white/60">SMARTWING CLOUDWORK</small>
          </span>
        </Link>
        <div className="relative">
          <p className="inline-flex items-center gap-2.5 text-[13px] font-bold tracking-[0.14em] text-[#9fe0ef] before:h-0.5 before:w-7 before:bg-zy-gold">
            以科技赋翼，让合规生长
          </p>
          <h1 className="mt-5 max-w-md text-4xl leading-tight font-bold">
            把残保金支出，变成可以追查的<em className="text-zy-gold-soft not-italic">真实交付</em>。
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-[#d4e7ef]">
            合规交付加上一种可量化的 AI 内容编排岗位。从签约、派活、交活到对账，合同、社保、发薪、个税/发票四流留在同一条台账上。
          </p>
        </div>
        <ol className="relative grid max-w-md grid-cols-4 gap-3 text-sm">
          {["签单", "派活", "交活", "对账"].map((item, index) => (
            <li key={item} className="rounded-xl border border-[rgba(210,240,248,.17)] bg-white/[.075] px-3 py-3">
              <span className="text-xs font-bold text-zy-gold">0{index + 1}</span>
              <p className="mt-1 font-semibold">{item}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark />
            <strong className="text-lg text-zy-deep">智翼云工</strong>
          </Link>
          <p className="zy-kicker">统一登录入口</p>
          <h2 className="mt-3 text-2xl font-bold text-zy-deep">登录运营后台</h2>
          <p className="mt-1.5 mb-6 text-sm leading-6 text-muted-foreground">运营、企业客户、执行端使用同一个入口，进去后只看见自己该看的数据。</p>
          <div className="zy-surface p-6">
            <Suspense fallback={<p className="text-sm text-muted-foreground">正在打开登录…</p>}>
              <LoginForm />
            </Suspense>
          </div>
          <Link href="/" className="mt-4 inline-flex py-2 text-sm font-semibold text-zy-blue hover:text-zy-cyan">
            ← 返回首页
          </Link>
        </div>
      </section>
    </div>
  );
}
