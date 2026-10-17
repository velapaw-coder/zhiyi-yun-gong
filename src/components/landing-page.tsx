import Link from "next/link";
import { BrandMark, WingGlyph } from "@/components/brand";
import { LeadForm } from "@/components/lead-form";

const NAV = [
  { href: "#why", label: "企业价值" },
  { href: "#how", label: "解决方案" },
  { href: "#services", label: "产品服务" },
  { href: "#evidence", label: "合规体系" },
  { href: "#platform", label: "平台" },
  { href: "#contact", label: "合作咨询" },
];

const PAINS = [
  ["▥", "残保金支出压力", "在合规经营前提下，寻求更有效率的残障就业与成本管理路径。"],
  ["♙", "传统招聘难", "岗位匹配、人才培养和长期管理，需要专业化支持。"],
  ["◇", "合规风险高", "劳动关系、薪酬、社保与真实工作记录必须能相互印证。"],
  ["↗", "数字化增长缺口", "重复性业务尚未标准化，AI 工具还没形成稳定的产出。"],
];

const STRUCTURE = [
  ["一底座", "五流合一合规底座", "劳动合同、社保、薪酬、成果、数字行为全存证，可导出真实生产档案。这是真用工的证明，也是品类壁垒。"],
  ["一飞轮", "AI 数字员工 × SLA 工单包", "智翼学院培养 L1–L4 认证人才，增长中台把需求拆成标准工单包。客户买到的是按月达成的结果，不是一个人。"],
  ["一阶梯", "A 合规 / B 增长 / C ESG", "A 让企业进得来，B 让经营赚得到，C 让成果说得出去。本期控制台先跑通合规交付与一种可计量岗位。"],
];

const STEPS = [
  ["企业需求诊断", "梳理合规现状、岗位条件、数字化任务与可交付目标。"],
  ["岗位匹配与培养", "匹配适岗人才，以技能训练与 AI 工具赋能工作。"],
  ["AI 数字工位配置", "拆解标准任务，建立人机协同流程与工作记录。"],
  ["真实工作交付", "以工单、质检、验收与 SLA 管理实际业务产出。"],
  ["经营成果复盘", "形成交付报告、真实就业档案与持续优化建议。"],
];

const OFFERS: Array<{ code: string; name: string; role: string; price: string; tagline: string; points: string[]; featured?: boolean }> = [
  {
    code: "A / COMPLIANCE",
    name: "合规版",
    role: "现金流基石",
    price: "500 元 / 人 / 月",
    tagline: "建立可验证的用工基础",
    points: ["残障就业需求与岗位适配评估", "劳动关系、社保及薪酬流程协同", "真实工作记录与档案管理", "合规减负可测量，五流底座先立住"],
  },
  {
    code: "B / AI GROWTH · 核心方案",
    name: "增长版",
    role: "核心旗舰",
    price: "SLA 工单包",
    tagline: "把 AI 数字岗位转化为业务产出",
    points: ["包含基础用工管理协同", "AI 数字岗位搭建与培训", "内容整理、客户资料、商品信息等工单", "按月验收，未达标按 10%–20% 扣减"],
    featured: true,
  },
  {
    code: "C / ESG",
    name: "ESG 版",
    role: "标杆战略 · 第二期",
    price: "联合挂牌",
    tagline: "沉淀真实可追溯的社会价值",
    points: ["包容性就业项目设计与运营", "真实就业及能力提升数据归档", "S 维度数据可披露", "品牌共创与社会责任传播素材"],
  },
];

const INDUSTRIES = [
  ["▦", "制造业企业"],
  ["◎", "跨境电商 / 外贸企业"],
  ["▣", "品牌 / 连锁企业"],
  ["♧", "中大型服务企业"],
];

const VALUES = [
  ["降本", "优化合规经营路径、岗位配置及重复性任务成本。"],
  ["增长", "通过 AI 辅助工作和工单体系释放增量产能。"],
  ["合规", "建立可追溯的劳动关系与真实生产记录。"],
  ["品牌", "沉淀真实就业成果与 ESG 社会责任素材。"],
];

const FLOWS = [
  ["01", "劳动合同流", "真实劳动关系，可导出在职记录。"],
  ["02", "社保流", "在职缴纳可核验，拒绝挂靠。"],
  ["03", "薪酬流", "银行代发，真发薪，不做账。"],
  ["04", "成果流", "工单包产出可验收、可归档。"],
  ["05", "数字行为流", "操作与交付过程留在证据链上。"],
];

const PILLARS = [
  ["合规可证", "五流合一，随时导出真实生产档案。拒绝挂靠和假用工。"],
  ["交付确定", "按月输出标准工单包。买成果，不买人头。"],
  ["技能赋能", "智翼学院 L1–L4。门槛从身体换成技能，翼不是替人飞。"],
  ["价值可量", "合规减负约 65%（测算口径），旁边是说得清的业务产出。"],
];

const ROLES = [
  ["运营", "全平台", "签约企业、配置岗位、派发任务、质检验收、核对台账、出具账单，所有写操作进审计。", "bg-zy-gold"],
  ["企业客户", "只读门户", "只看本企业的方案、岗位、任务进度、五流台账和已出账账单，看不到其他企业。", "bg-zy-cyan"],
  ["执行端", "我的任务", "领取派给自己的任务，提交成果，按质检意见返工，维护自己的档案。", "bg-zy-green"],
];

function Section({
  id,
  kicker,
  title,
  lede,
  tone = "paper",
  children,
}: {
  id?: string;
  kicker: string;
  title: React.ReactNode;
  lede?: string;
  tone?: "paper" | "white";
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-20 py-16 md:py-22 ${tone === "white" ? "bg-white" : "bg-zy-paper"}`}>
      <div className="mx-auto max-w-[1160px] px-6">
        <div className="mb-9 flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
          <div>
            <span className="zy-kicker">{kicker}</span>
            <h2 className="mt-3 text-[28px] leading-snug font-bold text-zy-deep md:text-[36px]">{title}</h2>
          </div>
          {lede ? <p className="max-w-md text-[15px] leading-7 text-zy-muted">{lede}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export function LandingPage() {
  // 页面是静态的；已登录用户访问 /login 会被 proxy 转到 /workbench。
  const consoleHref = "/login";
  const consoleLabel = "登录 / 进入控制台";

  return (
    <div className="min-h-screen bg-zy-paper text-zy-text">
      <a href="#main" className="absolute -left-[9999px] top-0 z-50 bg-white p-2 focus:left-2">
        跳至主要内容
      </a>
      <div className="bg-zy-deep py-1.5 text-xs text-[#deecf1]">
        <div className="mx-auto flex max-w-[1160px] justify-between gap-4 px-6">
          <span>以科技赋翼，让合规生长</span>
          <span className="hidden sm:inline">真实用工 · 真实交付 · 可核验证据</span>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-[#d8e4e9] bg-[rgba(248,250,251,0.94)] backdrop-blur-md">
        <div className="mx-auto flex min-h-[72px] max-w-[1160px] items-center gap-5 px-6">
          <Link href="/" aria-label="智翼云工 SmartWing Cloudwork 首页" className="shrink-0">
            <img src="/brand/smartwing-lockup.png" alt="智翼云工 SmartWing Cloudwork" className="h-11 w-auto mix-blend-multiply md:h-12" />
          </Link>
          <nav aria-label="主导航" className="ml-auto hidden items-center gap-7 text-sm font-semibold text-[#38505a] lg:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-zy-cyan">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-2">
            <Link
              href={consoleHref}
              className="hidden rounded-lg border border-zy-line bg-white px-4 py-2.5 text-sm font-semibold text-zy-blue transition hover:border-zy-cyan sm:inline-flex"
            >
              {consoleLabel}
            </Link>
            <a
              href="#contact"
              className="inline-flex rounded-lg bg-zy-blue px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-zy-deep"
            >
              预约方案咨询 →
            </a>
            <details className="relative lg:hidden">
              <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-lg text-xl text-zy-deep [&::-webkit-details-marker]:hidden" aria-label="打开导航">
                ☰
              </summary>
              <nav className="absolute right-0 top-12 flex w-52 flex-col rounded-xl border border-zy-line bg-white p-2 text-sm font-semibold text-[#38505a] shadow-lg">
                {NAV.map((item) => (
                  <a key={item.href} href={item.href} className="rounded-lg px-3 py-2.5 hover:bg-zy-pale">
                    {item.label}
                  </a>
                ))}
                <Link href={consoleHref} className="rounded-lg px-3 py-2.5 text-zy-blue hover:bg-zy-pale">
                  {consoleLabel}
                </Link>
              </nav>
            </details>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="zy-hero-bg relative overflow-hidden text-white">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,.045)_40.1%,transparent_40.5%,transparent_62%,rgba(255,255,255,.05)_62.1%,transparent_62.4%)]" />
          <div className="pointer-events-none absolute -right-44 top-5 size-[690px] rounded-full border border-[rgba(227,167,51,.18)] shadow-[0_0_0_80px_rgba(15,163,196,.035),0_0_0_160px_rgba(15,163,196,.025)]" />
          <div className="relative mx-auto grid max-w-[1160px] items-center gap-10 px-6 pt-16 pb-28 md:min-h-[600px] lg:grid-cols-[1.18fr_0.82fr]">
            <div>
              <p className="inline-flex items-center gap-2.5 text-[13px] font-bold tracking-[0.14em] text-[#9fe0ef] before:h-0.5 before:w-7 before:bg-zy-gold">
                企业包容性劳动力与 AI 增长服务商
              </p>
              <h1 className="my-6 text-[38px] leading-[1.3] font-bold tracking-tight md:text-[56px]">
                把合规成本
                <br />
                变成企业的
                <br />
                <em className="text-zy-gold-soft not-italic">增长生产力</em>
              </h1>
              <p className="max-w-[640px] text-base leading-8 text-[#d4e7ef] md:text-lg">
                以真实劳动关系为基础，以 AI 数字岗位为载体，以标准工单和可验收成果为交付。卖的不是名额，也不是人头，是可审计的确定性成果。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#contact" className="inline-flex min-h-12 items-center rounded-lg bg-zy-gold px-6 text-sm font-bold text-[#172a34] transition hover:-translate-y-0.5 hover:brightness-105">
                  获取企业专属方案 ↗
                </a>
                <a href="#how" className="inline-flex min-h-12 items-center rounded-lg border border-[#82b5c6] px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/5">
                  了解解决方案 ↓
                </a>
                <Link href={consoleHref} className="inline-flex min-h-12 items-center rounded-lg px-4 text-sm font-semibold text-[#9fe0ef] hover:text-white">
                  {consoleLabel} →
                </Link>
              </div>
              <div className="mt-12 grid gap-3 sm:grid-cols-3">
                {[
                  ["五流合一", "劳动合同 · 社保 · 薪酬 · 成果 · 数字行为"],
                  ["真实岗位", "岗位拆解 · AI 培训 · 人机协同"],
                  ["按成果交付", "标准工单 · 质量验收 · 可追溯档案"],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-xl border border-[rgba(210,240,248,.17)] bg-white/[.075] p-4">
                    <strong className="block text-base">{title}</strong>
                    <span className="text-xs text-[#adcfd9]">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden min-h-[420px] items-center justify-center lg:flex" aria-hidden>
              <div className="absolute size-[360px] rotate-[-25deg] skew-y-[-12deg] rounded-full border border-[rgba(168,235,241,.3)]" />
              <div className="absolute size-[275px] rotate-[-25deg] skew-y-[-12deg] rounded-full border border-[rgba(227,167,51,.35)]" />
              <div className="absolute size-[190px] rotate-[-25deg] skew-y-[-12deg] rounded-full border border-[rgba(168,235,241,.3)]" />
              <WingGlyph gradient className="relative size-[250px] drop-shadow-[0_18px_35px_rgba(0,0,0,.25)]" />
              <span className="absolute bottom-3 text-[13px] tracking-[0.2em] text-[#d5edf4]">WINGS FOR COMPLIANCE · GROWTH FOR ALL</span>
            </div>
          </div>
        </section>

        {/* 数字锚点，压在 hero 底部 */}
        <div className="relative z-10 mx-auto -mt-16 max-w-[1160px] px-6">
          <div className="grid gap-px overflow-hidden rounded-2xl bg-zy-line shadow-[0_12px_40px_rgba(8,65,89,.10)] md:grid-cols-3">
            {[
              ["约 65%", "客户合规减负幅度", "测算口径。对外保留「约」，不以属地核定结果作承诺。", "text-zy-green"],
              ["500 元 / 人 / 月", "套餐 A 定价锚点", "低门槛进场。买的是可测量的合规减负，不是名额。", "text-zy-blue"],
              ["五流", "可导出的真实生产档案", "劳动合同、社保、薪酬、成果、数字行为。", "text-[#b37f1c]"],
            ].map(([figure, title, note, color]) => (
              <article key={figure} className="bg-white p-6">
                <p className={`text-3xl font-bold ${color}`}>{figure}</p>
                <h3 className="mt-2 font-bold text-zy-deep">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-zy-muted">{note}</p>
              </article>
            ))}
          </div>
        </div>

        {/* 01 */}
        <Section id="why" kicker="01 / 企业为什么需要我们" title={<>企业的合规责任，<br />也可以成为新的生产力</>} lede="仅仅完成合规动作还不够。企业更需要真实岗位、可验证成果和可持续的经营价值。">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PAINS.map(([icon, title, text]) => (
              <article key={title} className="zy-surface p-7">
                <div className="grid size-13 place-items-center rounded-2xl bg-zy-pale text-2xl text-zy-blue">{icon}</div>
                <h3 className="mt-4 mb-2 text-lg font-bold text-zy-deep">{title}</h3>
                <p className="text-sm leading-6 text-zy-muted">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              ["第一笔账 · 企业", "一位千人规模制造企业的 CFO，每年秋天在预算表上划过一行：残疾人就业保障金，四百多万。这笔钱不买设备，不买客户，也写不进经营分析。一个足够健康的企业，为这件事付出巨款，却从未真正拥有这件事。"],
              ["第二笔账 · 人才", "同一天，一位听障同事第 47 次收到简历筛选的拒绝。打字 120 字／分钟，图片瑕疵辨识长期稳定在 99% 以上，连着八小时作业不掉线。简历里没有「能承受商务应酬」。门槛建在身体条件上，不在技能上。"],
            ].map(([title, text], index) => (
              <article key={title} className={`rounded-2xl border-l-4 bg-white p-6 shadow-zy ring-1 ring-zy-line ${index === 0 ? "border-l-zy-gold" : "border-l-zy-cyan"}`}>
                <h3 className="text-base font-bold text-zy-blue">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-zy-muted">{text}</p>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-base leading-8 font-semibold text-zy-blue">
            企业有钱，买不到真实用工；人才有能，没有被证明的用工。中间缺的不是善意，是一套把「她真的在干活」变成可审计证据的系统。
          </p>
        </Section>

        {/* 02 */}
        <Section id="how" tone="white" kicker="02 / 一底座 · 一飞轮 · 一阶梯" title="从合规用工到 AI 增长交付" lede="以五流合一为基础，连接岗位、技能、任务与验收，构建可以持续运营的工作体系。">
          <div className="grid gap-4 md:grid-cols-3">
            {STRUCTURE.map(([kicker, title, text], index) => (
              <article key={kicker} className="relative overflow-hidden rounded-2xl bg-zy-deep p-7 text-white">
                <span className={`absolute inset-x-0 top-0 h-1 ${["bg-zy-cyan", "bg-zy-gold", "bg-zy-green"][index]}`} />
                <p className="text-xs font-bold tracking-[0.14em] text-[#9fe0ef]">{kicker}</p>
                <h3 className="mt-2 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#cae0e9]">{text}</p>
              </article>
            ))}
          </div>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map(([title, text], index) => (
              <li key={title} className="relative rounded-2xl border border-zy-line bg-zy-paper px-5 py-6">
                <span className="text-xs font-extrabold tracking-[0.14em] text-zy-cyan">STEP 0{index + 1}</span>
                <h3 className="mt-3 mb-2 text-base leading-snug font-bold text-zy-deep">{title}</h3>
                <p className="text-[13px] leading-6 text-zy-muted">{text}</p>
                {index < STEPS.length - 1 ? (
                  <span className="absolute top-10 -right-3.5 z-10 hidden text-xl text-zy-cyan lg:block">→</span>
                ) : null}
              </li>
            ))}
          </ol>
          <p className="mt-8 rounded-xl bg-zy-pale px-5 py-5 text-center font-bold text-zy-blue">
            我们交付的不是“名额”，而是有真实劳动关系、有真实工作的可核验生产力。
          </p>
        </Section>

        {/* 03 */}
        <Section id="services" kicker="03 / 三大产品方案" title="同一份年框里的三级套餐" lede="从合规经营起步，逐步延伸到业务交付与 ESG 管理。具体方案与费用以诊断和合同为准。">
          <div className="grid gap-5 md:grid-cols-3">
            {OFFERS.map((offer) => (
              <article key={offer.name} className={`zy-surface flex flex-col overflow-hidden ${offer.featured ? "ring-2 ring-zy-gold md:-translate-y-2" : ""}`}>
                <div className={`p-7 text-white ${offer.featured ? "bg-[linear-gradient(110deg,#9e7523,#e3a733)]" : "bg-zy-blue"}`}>
                  <small className="text-xs opacity-85">{offer.code}</small>
                  <h3 className="mt-2 text-2xl font-bold">
                    {offer.name}
                    <span className="ml-2 align-middle text-xs font-semibold opacity-80">{offer.role}</span>
                  </h3>
                  <p className="mt-1 text-sm opacity-90">{offer.tagline}</p>
                  <p className="mt-4 text-lg font-bold">{offer.price}</p>
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <ul className="mb-6">
                    {offer.points.map((point) => (
                      <li key={point} className="relative border-b border-[#edf1f4] py-2.5 pl-7 text-sm">
                        <span className="absolute left-0 font-bold text-zy-green">✓</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                  <a href="#contact" className="mt-auto inline-flex min-h-11 items-center justify-center rounded-lg bg-zy-blue text-sm font-bold text-white transition hover:bg-zy-deep">
                    咨询{offer.name} →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </Section>

        {/* 04 + 05 */}
        <Section tone="white" kicker="04 / 适用企业" title="面向有真实岗位与数字化需求的企业" lede="具体服务须结合企业规模、属地要求、用工方式和实际业务需求评估。">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {INDUSTRIES.map(([icon, name]) => (
              <div key={name} className="rounded-xl border border-zy-line bg-zy-paper px-4 py-6 text-center font-bold text-zy-blue">
                <span className="mb-2 block text-3xl">{icon}</span>
                {name}
              </div>
            ))}
          </div>
          <div className="mt-14">
            <span className="zy-kicker">05 / 企业获得什么</span>
            <h3 className="mt-3 text-2xl font-bold text-zy-deep md:text-[30px]">一项合作，四个维度的价值</h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map(([title, text], index) => (
                <div key={title} className={`border-t-[3px] pt-4 ${["border-zy-green", "border-zy-cyan", "border-zy-blue", "border-zy-gold"][index]}`}>
                  <strong className="mb-2 block text-xl text-zy-deep">{title}</strong>
                  <p className="text-sm leading-6 text-zy-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* 06 */}
        <section id="evidence" className="scroll-mt-20 bg-zy-deep py-16 text-white md:py-22">
          <div className="mx-auto max-w-[1160px] px-6">
            <div className="mb-9 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="zy-kicker text-[#a5dfe9]!">06 / 合规与交付底座</span>
                <h2 className="mt-3 text-[28px] leading-snug font-bold md:text-[36px]">五流合一，每一次点击、每一份交付都可举证</h2>
              </div>
              <p className="max-w-md text-[15px] leading-7 text-[#cae0e9]">坚持真用工、真干活、真发薪；岗位与交付证据共同形成可核验档案。</p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {FLOWS.map(([index, title, text]) => (
                <li key={index} className="rounded-xl border border-white/20 bg-white/[.055] px-4 py-5 text-center">
                  <span className="block text-2xl font-bold text-zy-gold">{index}</span>
                  <p className="mt-1 font-bold">{title}</p>
                  <p className="mt-1.5 text-xs leading-5 text-[#b9d3dd]">{text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map(([title, text], index) => (
                <article key={title} className="rounded-xl bg-white/[.04] p-5 ring-1 ring-white/10">
                  <p className="text-xs font-bold text-zy-cyan">0{index + 1}</p>
                  <h3 className="mt-1 text-lg font-bold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#cae0e9]">{text}</p>
                </article>
              ))}
            </div>
            <p className="mt-8 text-[13px] leading-6 text-[#c6dce6]">
              合规说明：不提供虚假用工、挂靠或无真实业务的名额服务。残保金的计算与减免依各地现行规定及企业实际安置情况确定，合规减负约 65% 为测算口径，以属地残联、税务机关最终核定为准，不构成减免承诺。实际服务能力、交付内容和验收标准以签约方案为准。
            </p>
          </div>
        </section>

        {/* 07 平台 */}
        <Section id="platform" tone="white" kicker="07 / 一个平台 · 三种角色" title="签单、派活、交活、对账，留在同一条台账上" lede="运营、企业客户、执行端使用同一个入口，进去后只看见自己该看的数据。">
          <div className="grid gap-4 md:grid-cols-3">
            {ROLES.map(([name, scope, text, bar]) => (
              <article key={name} className="zy-surface relative overflow-hidden p-7">
                <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} />
                <p className="text-xs font-bold tracking-[0.12em] text-zy-teal">{scope}</p>
                <h3 className="mt-1 text-xl font-bold text-zy-deep">{name}</h3>
                <p className="mt-3 text-sm leading-7 text-zy-muted">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-2xl bg-[linear-gradient(110deg,#0a4d68,#0fa3c4)] p-7 text-white md:flex-row md:items-center">
            <ol className="flex flex-wrap gap-2 text-sm font-semibold">
              {["签单", "派活", "交活", "对账"].map((item, index) => (
                <li key={item} className="rounded-full bg-white/12 px-4 py-1.5 ring-1 ring-white/20">
                  <span className="mr-1.5 text-zy-gold-soft">0{index + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
            <Link href={consoleHref} className="inline-flex min-h-11 shrink-0 items-center rounded-lg bg-white px-6 text-sm font-bold text-zy-blue transition hover:-translate-y-0.5">
              {consoleLabel} →
            </Link>
          </div>
        </Section>

        {/* 宣言 */}
        <section className="border-y border-zy-line bg-zy-pale/60">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <BrandMark className="mx-auto mb-6 size-12" />
            <p className="text-lg leading-8 text-zy-text">我们相信，尊严不需要被同情，只需要被证明。</p>
            <p className="mt-2 text-lg leading-8 text-zy-text">我们不做名额生意。我们把真实的工作、真实的工资、真实的产出，放在同一个证据链上。</p>
            <p className="mt-6 text-xl font-bold text-zy-blue">以科技赋翼，让合规生长。</p>
          </div>
        </section>

        {/* 08 */}
        <section id="contact" className="scroll-mt-20 py-16 md:py-22">
          <div className="mx-auto grid max-w-[1160px] items-start gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="zy-kicker">08 / 开始合作</span>
              <h2 className="mt-4 text-[30px] leading-snug font-bold text-zy-deep md:text-[38px]">
                让合规责任，
                <br />
                成为下一步增长的起点
              </h2>
              <p className="mt-4 leading-7 text-zy-muted">90 天，跑通第一批真用工、真产出。先立五流底座，再按套餐 A 的 500 元/人/月进场，增长工单按月验收。</p>
              <p className="mt-4 leading-7 text-zy-muted">
                <strong className="text-zy-deep">适合沟通的议题：</strong>残障就业与岗位适配、AI 数字员工、工单交付、ESG 共创。
              </p>
              <p className="mt-4 text-sm text-zy-muted">运营主体：深圳市智翼云工科技有限公司</p>
              <Link href={consoleHref} className="mt-6 inline-flex text-sm font-bold text-zy-blue hover:text-zy-cyan">
                已有账号？{consoleLabel} →
              </Link>
            </div>
            <LeadForm />
          </div>
        </section>
      </main>

      <footer className="bg-zy-deeper pt-12 pb-6 text-[#c5dbe5]">
        <div className="mx-auto max-w-[1160px] px-6">
          <div className="flex flex-wrap justify-between gap-8">
            <div className="flex items-start gap-3">
              <BrandMark tone="glass" />
              <div>
                <h3 className="font-bold text-white">智翼云工 · SmartWing Cloudwork</h3>
                <p className="mt-1 text-[13px]">以科技赋翼，让合规生长</p>
                <p className="text-[13px]">企业包容性劳动力与 AI 增长共创平台</p>
              </div>
            </div>
            <nav className="flex flex-wrap gap-6 text-[13px]">
              {NAV.map((item) => (
                <a key={item.href} href={item.href} className="hover:text-white">
                  {item.label}
                </a>
              ))}
              <Link href={consoleHref} className="hover:text-white">
                {consoleLabel}
              </Link>
            </nav>
          </div>
          <div className="mt-9 border-t border-[#285061] pt-5 text-xs">
            © 2026 深圳市智翼云工科技有限公司 · 网站展示版（备案、隐私政策和正式联系方式上线前补充）
          </div>
        </div>
      </footer>

      <a href="#contact" className="fixed right-5 bottom-5 z-20 inline-flex min-h-12 items-center rounded-lg bg-zy-gold px-5 text-sm font-bold text-[#172a34] shadow-[0_9px_28px_#033a4a44] transition hover:-translate-y-0.5">
        合作咨询 ↗
      </a>
    </div>
  );
}
