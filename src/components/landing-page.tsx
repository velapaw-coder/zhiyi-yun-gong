import Link from "next/link";

const NAV = [
  { href: "#story", label: "两笔账" },
  { href: "#structure", label: "底座与飞轮" },
  { href: "#flows", label: "五流" },
  { href: "#editions", label: "套餐" },
  { href: "#consult", label: "咨询合作" },
];

export function LandingPage({ signedIn }: { signedIn: boolean }) {
  const consoleHref = signedIn ? "/workbench" : "/login";

  return (
    <div className="min-h-screen bg-white text-[#16232B]">
      <header className="sticky top-0 z-20 border-b border-[#D5DEE4] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-2">
          <Link href="/" className="shrink-0" aria-label="智翼云工 SmartWing Cloudwork">
            <img src="/brand/smartwing-logo.png" alt="智翼云工 SmartWing Cloudwork" className="h-14 w-auto md:h-16" />
          </Link>
          <nav className="ml-auto hidden items-center gap-5 text-sm text-[#4A5B66] lg:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-[#0A4D68]">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <a href="#consult" className="hidden rounded-full px-3 py-2 text-sm text-[#0A4D68] sm:inline">
              咨询合作
            </a>
            <Link href={consoleHref} className="rounded-full bg-[#0A4D68] px-4 py-2 text-sm font-medium text-white hover:bg-[#063345]">
              进入控制台 / 登录
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 md:grid-cols-[1.15fr_0.85fr] md:py-16">
            <div>
              <img src="/brand/smartwing-logo.png" alt="" className="mb-6 h-20 w-auto md:h-24" />
              <p className="text-sm font-medium tracking-wide text-[#0A4D68]">以科技赋翼，让合规生长</p>
              <div className="mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-[#0FA3C4] to-[#0A4D68]" />
              <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-tight text-[#063345] md:text-5xl">
                把合规责任转化为增长动能
              </h1>
              <p className="mt-4 text-sm text-[#4A5B66]">
                智翼云工 / SmartWing Cloudwork · 企业包容性劳动力与 AI 增长共创平台
              </p>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#4A5B66]">
                深圳市智翼云工科技有限公司。卖的不是名额，也不是人头，是可审计的确定性成果：五流合一的合规底座，加上按月验收的 AI 数字员工工单包。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={consoleHref} className="rounded-full bg-[#0A4D68] px-5 py-2.5 text-sm font-semibold text-white">
                  进入控制台 / 登录
                </Link>
                <a href="#consult" className="rounded-full border border-[#0A4D68] px-5 py-2.5 text-sm font-medium text-[#0A4D68]">
                  咨询合作
                </a>
              </div>
            </div>
            <div className="rounded-3xl bg-[#063345] p-6 text-white md:p-8">
              <p className="text-xs tracking-[0.16em] text-[#E3EEF3]">企业决策者</p>
              <p className="mt-3 text-lg font-medium leading-8">贵司每年为一件事付出数百万，却从没拥有过这件事。</p>
              <p className="mt-4 text-sm leading-7 text-[#E3EEF3]">
                残保金的问题从来不是钱，是买不到真实用工。五流合一加上 SLA 工单包，把这笔刚性支出变成一条说得清回报的产出线。
              </p>
              <p className="mt-5 text-xs leading-5 text-[#E3EEF3]">合规减负约 65%（测算口径）。具体核定以属地残联、税务机关为准，不构成减免承诺。</p>
            </div>
          </div>
        </section>

        <section id="story" className="border-y border-[#D5DEE4] bg-[#F8FAFB]">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <p className="text-xs tracking-[0.16em] text-[#0B7C95]">两笔账</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-semibold text-[#063345]">企业有预算，买不到真实用工</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-[#D5DEE4] bg-white p-6">
                <h3 className="text-lg font-semibold text-[#0A4D68]">第一笔账</h3>
                <p className="mt-3 text-sm leading-7 text-[#4A5B66]">
                  一位千人规模制造企业的 CFO，每年秋天在预算表上划过一行：残疾人就业保障金，四百多万。这笔钱不买设备，不买客户，也写不进经营分析。一个足够健康的企业，为这件事付出巨款，却从未真正拥有这件事。
                </p>
              </article>
              <article className="rounded-2xl border border-[#D5DEE4] bg-white p-6">
                <h3 className="text-lg font-semibold text-[#0A4D68]">第二笔账</h3>
                <p className="mt-3 text-sm leading-7 text-[#4A5B66]">
                  同一天，一位听障同事第 47 次收到简历筛选的拒绝。打字 120 字／分钟，图片瑕疵辨识长期稳定在 99% 以上，连着八小时作业不掉线。简历里没有「能承受商务应酬」。门槛建在身体条件上，不在技能上。
                </p>
              </article>
            </div>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[#16232B]">
              把两笔账放在一起：企业有钱，买不到真实用工；人才有能，没有被证明的用工。中间缺的不是善意，是一套把「她真的在干活」变成可审计证据的系统。智翼云工，从这套系统开始。
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["约 65%", "客户合规减负幅度", "测算口径。对外保留「约」，不以属地核定结果作承诺。"],
              ["500 元 / 人 / 月", "套餐 A 定价锚点", "低门槛进场。买的是可测量的合规减负，不是名额。"],
              ["五流", "可导出的真实生产档案", "劳动合同、社保、薪酬、成果、数字行为。"],
            ].map(([figure, title, note]) => (
              <article key={figure} className="rounded-2xl bg-[#E3EEF3] p-6">
                <p className="text-3xl font-semibold text-[#0A4D68]">{figure}</p>
                <h3 className="mt-2 font-semibold text-[#063345]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#4A5B66]">{note}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="structure" className="bg-[#063345] text-white">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <p className="text-xs tracking-[0.16em] text-[#0FA3C4]">一底座 · 一飞轮 · 一阶梯</p>
            <h2 className="mt-2 text-3xl font-semibold">故事和商业结构是同一套</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ["一底座", "五流合一合规底座", "劳动合同、社保、薪酬、成果、数字行为全存证，可导出真实生产档案。这是真用工的证明，也是品类壁垒。"],
                ["一飞轮", "AI 数字员工 × SLA 工单包", "智翼学院培养 L1–L4 认证人才，增长中台把需求拆成标准工单包。客户买到的是按月达成的结果，不是一个人。"],
                ["一阶梯", "A 合规 / B 增长 / C ESG", "A 让企业进得来，B 让经营赚得到，C 让成果说得出去。本期控制台先跑通合规交付与一种可计量岗位。"],
              ].map(([kicker, title, text]) => (
                <article key={kicker} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-xs text-[#0FA3C4]">{kicker}</p>
                  <h3 className="mt-2 text-xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#E3EEF3]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="flows" className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-xs tracking-[0.16em] text-[#0B7C95]">五流合一</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#063345]">每一次点击、每一份交付，都可举证</h2>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["01", "劳动合同流", "真实劳动关系，可导出在职记录。"],
              ["02", "社保流", "在职缴纳可核验，拒绝挂靠。"],
              ["03", "薪酬流", "银行代发，真发薪，不做账。"],
              ["04", "成果流", "工单包产出可验收、可归档。"],
              ["05", "数字行为流", "操作与交付过程留在证据链上。"],
            ].map(([index, title, text]) => (
              <li key={index} className="rounded-2xl border border-[#D5DEE4] bg-white p-4">
                <span className="text-sm font-semibold text-[#0A4D68]">{index}</span>
                <h3 className="mt-2 font-semibold text-[#0A4D68]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#4A5B66]">{text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-3xl text-sm leading-7 text-[#4A5B66]">
            别人卖合规，我们卖合规带来的产能。别人卖人头，我们卖成果。未达标的月度工单包按 10%–20% 扣减，买的是按月达成的结果。
          </p>
        </section>

        <section id="editions" className="border-y border-[#D5DEE4] bg-[#F8FAFB]">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <p className="text-xs tracking-[0.16em] text-[#0B7C95]">A / B / C</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#063345]">同一份年框里的三级套餐</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ["套餐 A · 合规版", "现金流基石", "500 元/人/月", ["低门槛进场", "合规减负可测量", "五流底座先立住"]],
                ["套餐 B · 增长版", "核心旗舰", "SLA 工单包", ["专属 AI 增长作战", "按月交付可验收", "本期先做一种可计量岗位"]],
                ["套餐 C · ESG 版", "标杆战略", "第二期", ["S 维度数据可披露", "联合挂牌", "本期控制台不做素材库"]],
              ].map(([name, role, price, points]) => (
                <article key={name} className="rounded-2xl border border-[#D5DEE4] bg-white p-6">
                  <h3 className="text-xl font-semibold text-[#063345]">{name}</h3>
                  <p className="mt-1 text-sm text-[#0B7C95]">{role}</p>
                  <p className="mt-4 text-lg font-semibold text-[#0A4D68]">{price}</p>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-[#4A5B66]">
                    {(points as string[]).map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-xs tracking-[0.16em] text-[#0B7C95]">四根支柱</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#063345]">真用工、真干活、真发薪</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ["合规可证", "五流合一，随时导出真实生产档案。拒绝挂靠和假用工。"],
              ["交付确定", "按月输出标准工单包。买成果，不买人头。"],
              ["技能赋能", "智翼学院 L1–L4。门槛从身体换成技能，翼不是替人飞。"],
              ["价值可量", "合规减负约 65%（测算口径），旁边是说得清的业务产出。"],
            ].map(([title, text], index) => (
              <article key={title} className="rounded-2xl bg-[#0A4D68] p-6 text-white">
                <p className="text-xs text-[#0FA3C4]">0{index + 1}</p>
                <h3 className="mt-2 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#E3EEF3]">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-[#D5DEE4] bg-[#F8FAFB]">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center">
            <p className="text-lg leading-8 text-[#16232B]">我们相信，尊严不需要被同情，只需要被证明。</p>
            <p className="mt-3 text-lg leading-8 text-[#16232B]">我们不做名额生意。我们把真实的工作、真实的工资、真实的产出，放在同一个证据链上。</p>
            <p className="mt-6 text-xl font-semibold text-[#0A4D68]">以科技赋翼，让合规生长。</p>
          </div>
        </section>

        <section id="consult" className="px-5 py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl bg-gradient-to-br from-[#0FA3C4] to-[#063345] px-6 py-10 text-white md:flex-row md:items-center md:justify-between md:px-10">
            <div>
              <p className="text-xs tracking-[0.16em] text-white/80">咨询合作</p>
              <h2 className="mt-2 text-3xl font-semibold">90 天，跑通第一批真用工、真产出</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/90">
                已有账号直接进入控制台。新合作从方案沟通开始：先立五流底座，再按套餐 A 的 500 元/人/月进场，增长工单按月验收。
              </p>
            </div>
            <Link href={consoleHref} className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0A4D68]">
              进入控制台 / 登录
            </Link>
          </div>
          <p className="mx-auto mt-6 max-w-6xl text-xs leading-5 text-[#4A5B66]">
            深圳市智翼云工科技有限公司 · 智翼云工 / SmartWing Cloudwork。合规减负约 65% 为测算口径，以属地残联、税务机关最终核定为准。
          </p>
        </section>
      </main>
    </div>
  );
}
