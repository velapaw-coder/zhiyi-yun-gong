import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { fenToYuan, formatDateTime } from "@/lib/format";
import {
  AUDIT_ACTION,
  BILL_STATUS,
  INVOICE_STATUS,
  PAYMENT_STATUS,
  TASK_STATUS,
} from "@/lib/labels";
import { getDashboard } from "@/server/repo";
import { requireActor } from "@/server/session";

export const metadata = { title: "工作台" };

export default async function HomePage() {
  const actor = await requireActor();
  const data = await getDashboard(actor);

  if (data.kind === "ops") {
    const cards = [
      { label: "待质检", value: data.pendingQa, href: "/tasks?status=submitted", accent: "before:bg-zy-gold", ink: "text-[#8a5d0c]" },
      { label: "逾期待办", value: data.overdue, href: "/tasks?overdue=1", accent: "before:bg-zy-rose", ink: "text-zy-rose" },
      { label: "返工中", value: data.rework, href: "/tasks?status=rework", accent: "before:bg-[#e07a3a]", ink: "text-[#a24a12]" },
      { label: "台账异常", value: data.anomaly, href: "/ledgers?checkStatus=anomaly", accent: "before:bg-zy-cyan", ink: "text-zy-teal" },
      { label: "本月已验收", value: data.acceptedMonth, href: "/tasks?status=accepted", accent: "before:bg-zy-green", ink: "text-zy-green" },
    ];
    return (
      <div>
        <PageHeader
          eyebrow="运营工作台"
          title={`你好，${actor.displayName}`}
          description="先处理待质检和逾期，再看台账异常。站内待办在这里，短信通知不在本期。"
          actions={
            <Button asChild>
              <Link href="/tasks/new">派发任务</Link>
            </Button>
          }
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className={`relative overflow-hidden rounded-xl bg-card p-4 pt-5 ring-1 ring-zy-line shadow-zy transition before:absolute before:inset-x-0 before:top-0 before:h-1 hover:-translate-y-0.5 hover:ring-zy-cyan/60 ${card.accent}`}
            >
              <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
              <p className={`num mt-2 text-3xl font-bold ${card.ink}`}>{card.value}</p>
            </Link>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 font-bold text-zy-deep">最近任务</h2>
            <div className="divide-y divide-border rounded-xl bg-card ring-1 ring-zy-line shadow-zy">
              {data.recentTasks.map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/60">
                  <span>
                    <span className="font-medium">{task.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {task.enterprise.name} · {task.assignee.name}
                    </span>
                  </span>
                  <StatusBadge map={TASK_STATUS} value={task.status} />
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-bold text-zy-deep">最近写操作</h2>
            <div className="divide-y divide-border rounded-xl bg-card ring-1 ring-zy-line shadow-zy">
              {data.recentLogs.map((log) => (
                <div key={log.id} className="px-4 py-3 text-sm">
                  <p>
                    {log.actor.displayName} · {AUDIT_ACTION[log.action] ?? log.action}
                    <span className="text-muted-foreground"> · {log.entityType}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</p>
                </div>
              ))}
              {data.recentLogs.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">还没有审计记录。</p> : null}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (data.kind === "enterprise") {
    return (
      <div>
        <PageHeader
          eyebrow="企业门户"
          title={data.enterprise?.name ?? "未绑定企业"}
          description="这里只显示本企业的岗位、任务、台账和已出账账单。不能改，也看不到其他企业。"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.counts.map((item) => (
            <Link key={item.status} href={`/tasks?status=${item.status}`} className="rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy">
              <p className="text-xs text-muted-foreground">{TASK_STATUS[item.status] ?? item.status}</p>
              <p className="num mt-2 text-3xl font-bold text-zy-blue">{item._count._all}</p>
            </Link>
          ))}
          {data.counts.length === 0 ? <p className="text-sm text-muted-foreground">本企业还没有任务。</p> : null}
        </div>
        <section className="mt-6 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy">
          <h2 className="font-bold text-zy-deep">最近一张可见账单</h2>
          {data.bill ? (
            <Link href={`/bills/${data.bill.id}`} className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-medium">{data.bill.yearMonth}</span>
              <span className="num">应付 {fenToYuan(data.bill.totalAmount)} 元</span>
              <StatusBadge map={BILL_STATUS} value={data.bill.status} />
              <StatusBadge map={INVOICE_STATUS} value={data.bill.invoiceStatus} />
              <StatusBadge map={PAYMENT_STATUS} value={data.bill.paymentStatus} />
            </Link>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">还没有已出账或已确认的账单。草稿账单对企业不可见。</p>
          )}
        </section>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="执行端" title={`${actor.displayName}的待办`} description="只显示派给你的任务。领取、提交、按质检意见返工，都在任务详情里完成。" />
      <div className="mb-4 flex flex-wrap gap-2">
        {data.counts.map((item) => (
          <Link key={item.status} href={`/tasks?status=${item.status}`} className="inline-flex min-h-9 items-center rounded-full bg-card px-3.5 text-sm ring-1 ring-zy-line shadow-zy">
            {TASK_STATUS[item.status] ?? item.status} {item._count._all}
          </Link>
        ))}
      </div>
      <div className="grid gap-3">
        {data.tasks.map((task) => (
          <Link key={task.id} href={`/tasks/${task.id}`} className="rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy hover:ring-primary/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {task.enterprise.name} · {task.position.name} · 截止 {formatDateTime(task.planEndAt)}
                </p>
              </div>
              <StatusBadge map={TASK_STATUS} value={task.status} />
            </div>
          </Link>
        ))}
        {data.tasks.length === 0 ? <p className="text-sm text-muted-foreground">当前没有需要你处理的任务。</p> : null}
      </div>
    </div>
  );
}
