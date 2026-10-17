import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { ReadOnlyBanner } from "@/components/field";
import { StatusBadge } from "@/components/status-badge";
import { TaskActions } from "@/components/task-forms";
import { fileSize, formatDateTime, qaItems } from "@/lib/format";
import { QA_RESULT, ROLE_LABEL, TASK_ACTION, TASK_STATUS } from "@/lib/labels";
import { getTask, reassignOptions } from "@/server/tasks";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "任务详情" };

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const task = await expose(() => getTask(actor, id));
  const talents = actor.role === "ops" ? await reassignOptions(actor) : [];
  const current = task.deliveries.find((item) => item.id === task.currentDeliveryId) ?? task.deliveries.at(-1);
  const rules = qaItems(task.position.qaRules);
  return (
    <div>
      <PageHeader
        eyebrow={`${task.code} · ${task.enterprise.name}`}
        title={task.title}
        description={task.position.name}
        actions={<StatusBadge map={TASK_STATUS} value={task.status} />}
      />
      {actor.role === "enterprise" ? <ReadOnlyBanner /> : null}
      <dl className="mb-4 grid gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-zy-line shadow-zy sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">执行人</dt>
          <dd className="mt-1">
            {actor.role === "ops" ? (
              <Link href={`/talents/${task.assignee.id}`} className="text-primary hover:underline">
                {task.assignee.name}
              </Link>
            ) : (
              task.assignee.name
            )}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">计划</dt>
          <dd className="mt-1">
            {formatDateTime(task.planStartAt)}
            <span className="block text-xs text-muted-foreground">至 {formatDateTime(task.planEndAt)}</span>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">实际开始</dt>
          <dd className="mt-1">{formatDateTime(task.actualStartAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">实际结束</dt>
          <dd className="mt-1">{formatDateTime(task.actualEndAt)}</dd>
        </div>
      </dl>
      {actor.role === "ops" && task.forceAssigned ? (
        <p className="mb-4 rounded-lg bg-accent px-3 py-2 text-sm">这是强制派发。原因在内部备注里，企业端和执行端看不到。</p>
      ) : null}
      {actor.role === "ops" || actor.role === "worker" ? (
        <TaskActions
          role={actor.role}
          qaItems={rules}
          talents={talents}
          task={{
            id: task.id,
            status: task.status,
            title: task.title,
            description: task.description,
            planStartAt: task.planStartAt,
            planEndAt: task.planEndAt,
          }}
        />
      ) : null}
      <details className="mb-6 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy" open>
        <summary className="cursor-pointer py-2 font-medium">任务要求、交付标准、质检规则</summary>
        <div className="mt-3 grid gap-4 text-sm leading-6 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">任务要求</p>
            <p className="mt-1 whitespace-pre-wrap">{task.description}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">交付标准</p>
            <p className="mt-1 whitespace-pre-wrap">{task.position.deliveryStandard}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">质检规则</p>
            <p className="mt-1 whitespace-pre-wrap">{task.position.qaRules}</p>
          </div>
        </div>
      </details>
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h2 className="mb-3 font-bold text-zy-deep">追溯时间线</h2>
          <ol className="rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy">
            {task.logs.map((log, index) => (
              <li key={log.id} className="grid grid-cols-[16px_1fr] gap-3">
                <div className="relative">
                  <span className="absolute top-1.5 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-primary ring-4 ring-card" />
                  {index < task.logs.length - 1 ? <span className="absolute top-4 bottom-0 left-1/2 w-px -translate-x-1/2 bg-border" /> : null}
                </div>
                <div className="pb-6">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium">{TASK_ACTION[log.action] ?? log.action}</span>
                    {log.internal ? <span className="text-xs text-muted-foreground">内部</span> : null}
                    <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {log.actorName} · {ROLE_LABEL[log.actorRole] ?? log.actorRole}
                    {log.fromStatus && log.toStatus && log.fromStatus !== log.toStatus
                      ? ` · ${TASK_STATUS[log.fromStatus] ?? log.fromStatus} → ${TASK_STATUS[log.toStatus] ?? log.toStatus}`
                      : ""}
                  </p>
                  {log.comment ? <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{log.comment}</p> : null}
                  {log.changedFields.length > 0 ? (
                    <ul className="mt-1 text-xs text-muted-foreground">
                      {log.changedFields.map((field) => (
                        <li key={field.field}>
                          {field.field}：{field.old || "空"} → {field.new || "空"}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {log.deliveryVersion ? (
                    <a href={`#delivery-v${log.deliveryVersion}`} className="mt-1 inline-block text-sm text-primary hover:underline">
                      查看交付 v{log.deliveryVersion}
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
            {task.logs.length === 0 ? <p className="text-sm text-muted-foreground">还没有操作记录。</p> : null}
          </ol>
        </section>
        <section className="lg:col-span-2">
          <h2 className="mb-3 font-bold text-zy-deep">交付物</h2>
          {task.deliveries.length === 0 ? (
            <p className="rounded-xl bg-card p-4 text-sm text-muted-foreground ring-1 ring-zy-line shadow-zy">还没有提交。</p>
          ) : (
            <Tabs defaultValue={String(current?.versionNo ?? 1)} className="rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy">
              <TabsList className="flex h-auto flex-wrap">
                {task.deliveries.map((delivery) => (
                  <TabsTrigger key={delivery.id} value={String(delivery.versionNo)} className="min-h-9 px-3 sm:min-h-0">
                    v{delivery.versionNo}
                    {delivery.id === task.currentDeliveryId ? " 当前" : ""}
                  </TabsTrigger>
                ))}
              </TabsList>
              {task.deliveries.map((delivery) => (
                <TabsContent key={delivery.id} value={String(delivery.versionNo)} id={`delivery-v${delivery.versionNo}`}>
                  <p className="text-xs text-muted-foreground">
                    {delivery.submittedBy} · {formatDateTime(delivery.submittedAt)}
                    {delivery.proxySubmit ? " · 代提交" : ""}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{delivery.summary}</p>
                  {delivery.links.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-sm">
                      {delivery.links.map((link) => (
                        <li key={link}>
                          <a href={link} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {delivery.files.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {delivery.files.map((file) => (
                        <li key={file.id} className="text-sm">
                          <a href={`/api/files/${file.id}`} className="text-primary hover:underline">
                            {file.name}
                          </a>
                          <span className="ml-2 text-xs text-muted-foreground">{fileSize(file.size)}</span>
                          {file.mime.startsWith("image/") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={`/api/files/${file.id}`} alt={file.name} className="mt-2 max-h-40 rounded-lg border border-border" />
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </TabsContent>
              ))}
            </Tabs>
          )}
          <h2 className="mt-6 mb-3 font-bold text-zy-deep">质检意见</h2>
          <div className="grid gap-3">
            {task.deliveries.filter((item) => item.qaResult !== "pending" || item.qaComment).length === 0 ? (
              <p className="rounded-xl bg-card p-4 text-sm text-muted-foreground ring-1 ring-zy-line shadow-zy">还没有质检结论。</p>
            ) : (
              task.deliveries
                .filter((item) => item.qaResult !== "pending" || item.qaComment)
                .map((delivery) => (
                  <article key={delivery.id} className="rounded-xl bg-card p-4 text-sm ring-1 ring-zy-line shadow-zy">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">v{delivery.versionNo}</span>
                      <StatusBadge map={QA_RESULT} value={delivery.qaResult} />
                    </div>
                    <p className="mt-2 whitespace-pre-wrap leading-6">{delivery.qaComment || "未填写文字意见"}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {delivery.qaBy ?? "—"} · {formatDateTime(delivery.qaAt)}
                    </p>
                    {delivery.qaChecklist.length > 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">已勾选：{delivery.qaChecklist.join("、")}</p>
                    ) : null}
                  </article>
                ))
            )}
          </div>
        </section>
      </div>
      <section className="mt-8">
        <h2 className="mb-3 font-bold text-zy-deep">操作日志</h2>
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-zy-line shadow-zy">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/70 text-left text-muted-foreground">
              <tr>
                {["时间", "谁", "动作", "状态", "字段", "备注"].map((head) => (
                  <th key={head} className="px-3 py-2 font-medium">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...task.logs].reverse().map((log) => (
                <tr key={log.id} className="border-t border-border align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{formatDateTime(log.createdAt)}</td>
                  <td className="px-3 py-2">
                    {log.actorName}
                    <span className="block text-xs text-muted-foreground">{ROLE_LABEL[log.actorRole] ?? log.actorRole}</span>
                  </td>
                  <td className="px-3 py-2">{TASK_ACTION[log.action] ?? log.action}</td>
                  <td className="px-3 py-2 text-xs">
                    {log.fromStatus ? TASK_STATUS[log.fromStatus] ?? log.fromStatus : "—"} → {log.toStatus ? TASK_STATUS[log.toStatus] ?? log.toStatus : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {log.changedFields.map((field) => `${field.field}: ${field.old || "空"} → ${field.new || "空"}`).join("；") || "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-pre-wrap">{log.comment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
