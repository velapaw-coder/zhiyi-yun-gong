import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { selectClass } from "@/components/field";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, one, pageCount, parsePage } from "@/lib/format";
import { TASK_COLUMNS, TASK_STATUS } from "@/lib/labels";
import { listTasks } from "@/server/tasks";
import { prisma } from "@/server/db";
import { requireActor } from "@/server/session";

export const metadata = { title: "任务" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const status = one(sp.status);
  const overdue = one(sp.overdue) === "1";
  const view = one(sp.view) === "list" ? "list" : "board";
  const enterpriseId = actor.role === "ops" ? one(sp.enterpriseId) : "";
  const paging = parsePage(one(sp.page));
  const { rows, total, truncated } = await listTasks(actor, {
    q,
    status,
    enterpriseId,
    overdue,
    view,
    skip: paging.skip,
    pageSize: paging.pageSize,
  });
  const enterprises =
    actor.role === "ops"
      ? await prisma.enterprise.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      : [];
  const params = { q, status, enterpriseId, overdue: overdue ? "1" : "", view: view === "list" ? "list" : "" };
  const title = actor.role === "worker" ? "我的任务" : "任务看板";
  return (
    <div>
      <PageHeader
        eyebrow="交付"
        title={title}
        description={
          actor.role === "worker"
            ? "只看派给你的任务。点进详情领取、提交或按意见返工。"
            : actor.role === "enterprise"
              ? "本企业任务只读。打开详情可以看交付内容和时间线。"
              : "按状态推进：派发、领取、提交、质检、返工、验收。"
        }
        actions={
          actor.role === "ops" ? (
            <Button asChild>
              <Link href="/tasks/new">派发任务</Link>
            </Button>
          ) : null
        }
      />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <Input name="q" defaultValue={q} placeholder="标题、编号或执行人" className="w-52" />
        {actor.role === "ops" ? (
          <select name="enterpriseId" className={`${selectClass} w-44!`} defaultValue={enterpriseId}>
            <option value="">全部企业</option>
            {enterprises.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        ) : null}
        <select name="status" className={`${selectClass} w-32!`} defaultValue={status}>
          <option value="">全部状态</option>
          {Object.entries(TASK_STATUS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="flex h-9 items-center gap-2 rounded-lg border border-input bg-white px-2.5 text-sm">
          <input type="checkbox" name="overdue" value="1" defaultChecked={overdue} />
          只看逾期
        </label>
        <input type="hidden" name="view" value={view} />
        <Button type="submit" variant="secondary">
          筛选
        </Button>
        <Button variant="outline" asChild>
          <Link href={view === "list" ? `/tasks${status || q || enterpriseId || overdue ? "?" : ""}${new URLSearchParams(Object.entries({ q, status, enterpriseId, overdue: overdue ? "1" : "" }).filter(([, value]) => value)).toString()}` : `/tasks?${new URLSearchParams({ ...Object.fromEntries(Object.entries({ q, status, enterpriseId, overdue: overdue ? "1" : "" }).filter(([, value]) => value)), view: "list" }).toString()}`}>
            {view === "list" ? "看板" : "列表"}
          </Link>
        </Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="这个筛选下没有任务" hint="放宽状态，或由运营派发新任务。" />
      ) : view === "board" ? (
        <div>
          {truncated ? <p className="mb-2 text-xs text-muted-foreground">看板最多显示 200 条，其余请用列表。</p> : null}
          <div className="flex gap-3 overflow-x-auto pb-3">
            {TASK_COLUMNS.map((column) => {
              const cards = rows.filter((row) => row.status === column);
              return (
                <section key={column} className="w-72 shrink-0">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <h2 className="text-sm font-bold text-zy-deep">{TASK_STATUS[column]}</h2>
                    <span className="num text-xs text-muted-foreground">{cards.length}</span>
                  </div>
                  <div className="grid gap-2">
                    {cards.map((card) => (
                      <Link key={card.id} href={`/tasks/${card.id}`} className="rounded-xl bg-card p-3 ring-1 ring-zy-line shadow-zy hover:ring-primary/40">
                        <p className="text-sm font-medium leading-5">{card.title}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {card.code}
                          {actor.role === "ops" ? ` · ${card.enterpriseName}` : ""} · {card.assigneeName}
                        </p>
                        <p className={`mt-1 text-xs ${card.overdue ? "text-destructive" : "text-muted-foreground"}`}>
                          截止 {formatDateTime(card.planEndAt)}
                          {card.overdue ? " · 逾期" : ""}
                        </p>
                      </Link>
                    ))}
                    {cards.length === 0 ? <p className="px-1 text-xs text-muted-foreground">空</p> : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-zy-line shadow-zy">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/70 text-left text-muted-foreground">
              <tr>
                {["任务", "企业", "岗位", "执行人", "截止", "状态"].map((head) => (
                  <th key={head} className="px-3 py-2 font-medium">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-3">
                    <Link href={`/tasks/${row.id}`} className="font-medium text-primary hover:underline">
                      {row.title}
                    </Link>
                    <span className="block font-mono text-xs text-muted-foreground">{row.code}</span>
                  </td>
                  <td className="px-3 py-3">{row.enterpriseName}</td>
                  <td className="px-3 py-3">{row.positionName}</td>
                  <td className="px-3 py-3">{row.assigneeName}</td>
                  <td className={`px-3 py-3 ${row.overdue ? "text-destructive" : ""}`}>{formatDateTime(row.planEndAt)}</td>
                  <td className="px-3 py-3">
                    <StatusBadge map={TASK_STATUS} value={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3">
            <Pager page={paging.page} pages={pageCount(total)} params={params} />
          </div>
        </div>
      )}
    </div>
  );
}
