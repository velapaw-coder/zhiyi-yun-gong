import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/brand";
import { LeadForm } from "@/components/lead-form";
import { LevyCalculator } from "@/components/levy/calculator";
import { POLICY_TIER_END } from "@/lib/levy";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "残保金计算器 · 智翼云工",
  description: "按 2026 年现行政策测算残疾人就业保障金：分档减缴、30 人以下免征、2 倍社平封顶、重度 1 人按 2 人计，给出安置建议、成本与投入产出。",
};

const RULES = [
  ["公式", "（上年在职职工人数 × 当地比例 − 实际安置人数）× 上年职工年平均工资。差额人数可以不是整数。"],
  ["比例", "国家底线 1.5%，各省可更高（如四川 1.6%）。以当地政府规定为准。"],
  ["分档减缴", `安置比例 ≥ 1% 未达标按 50% 缴；< 1% 按 90% 缴。执行至 ${POLICY_TIER_END}。`],
  ["小微免征", `在职职工 30 人（含）以下的企业免征，执行至 ${POLICY_TIER_END}。`],
  ["工资封顶", "职工年平均工资超过当地社会平均工资 2 倍的，按 2 倍计征。"],
  ["重度按 2 人", "持残疾人证 1–2 级（残疾军人证 1–3 级）的，1 人按 2 人计。"],
  ["计入条件", "签 1 年以上劳动合同、工资不低于当地最低工资、足额缴社保、残疾证在有效期内，并按时完成残联年审。"],
];

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-zy-paper text-zy-text">
      <header className="sticky top-0 z-30 border-b border-[#d8e4e9] bg-[rgba(248,250,251,0.94)] backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-[1160px] items-center gap-3 px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="返回智翼云工首页">
            <BrandMark className="size-9" />
            <span className="leading-tight">
              <strong className="block text-base font-bold text-zy-deep">智翼云工</strong>
              <small className="block text-[10px] tracking-[0.08em] text-[#617783]">残保金计算器</small>
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-sm font-semibold sm:gap-2">
            <Link href="/" className="hidden min-h-10 items-center rounded-lg px-3 text-[#38505a] hover:text-zy-cyan sm:inline-flex">
              首页
            </Link>
            <Link href="/login" className="inline-flex min-h-10 items-center rounded-lg border border-zy-line bg-white px-3 text-zy-blue hover:border-zy-cyan">
              登录
            </Link>
            <a href="#contact" className="inline-flex min-h-10 items-center rounded-lg bg-zy-blue px-3 font-bold text-white hover:bg-zy-deep">
              咨询
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="zy-hero-bg text-white">
          <div className="mx-auto max-w-[1160px] px-4 py-10 md:px-6 md:py-14">
            <p className="inline-flex items-center gap-2.5 text-[13px] font-bold tracking-[0.14em] text-[#9fe0ef] before:h-0.5 before:w-7 before:bg-zy-gold">
              2026 年现行政策 · 浏览器本地计算
            </p>
            <h1 className="mt-4 text-[30px] leading-snug font-bold md:text-[44px]">残疾人就业保障金计算器</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#d4e7ef] md:text-base">
              填几项企业参数，马上看到今年要缴多少、安置几人最划算、一年能省多少、投入产出比多少。数据不离开你的浏览器。
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1160px] px-4 py-8 md:px-6 md:py-12">
          <LevyCalculator />
        </section>

        <section className="border-t border-zy-line bg-white">
          <div className="mx-auto max-w-[1160px] px-4 py-10 md:px-6 md:py-14">
            <span className="zy-kicker">测算口径</span>
            <h2 className="mt-3 text-2xl font-bold text-zy-deep md:text-3xl">我们按这些规则算</h2>
            <dl className="mt-6 grid gap-3 md:grid-cols-2">
              {RULES.map(([k, v]) => (
                <div key={k} className="rounded-xl bg-zy-paper p-4 ring-1 ring-zy-line">
                  <dt className="font-bold text-zy-deep">{k}</dt>
                  <dd className="mt-1 text-sm leading-6 text-zy-muted">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs leading-5 text-zy-muted">
              依据：财税〔2015〕72号《残疾人就业保障金征收使用管理办法》、财政部公告2019年第98号、财政部公告2023年第8号及各省实施办法。测算仅供参考，以属地残联审核和税务机关核定为准。
            </p>
          </div>
        </section>

        <section id="contact" className="scroll-mt-20 py-10 md:py-14">
          <div className="mx-auto grid max-w-[1160px] items-start gap-8 px-4 md:px-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="zy-kicker">定制方案书</span>
              <h2 className="mt-3 text-2xl font-bold text-zy-deep md:text-3xl">把测算变成可执行的方案</h2>
              <p className="mt-3 leading-7 text-zy-muted">
                我们会按企业所在地的比例、社平工资和最低工资复核测算，给出安置人数、岗位与五流合规档案的方案书。可以先点「复制测算结果」，粘贴到右侧表单的「主要需求」里。
              </p>
            </div>
            <LeadForm />
          </div>
        </section>
      </main>

      <footer className="bg-zy-deeper py-6 text-center text-xs text-[#c5dbe5]">© 2026 深圳市智翼云工科技有限公司 · 残保金测算仅供参考</footer>
    </div>
  );
}
