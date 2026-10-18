import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { formatDateTime, one, pageCount, parsePage } from "@/lib/format";
import { AUDIT_ACTION, ROLE_LABEL } from "@/lib/labels";
import { listAudit, listLoginLogs, listSecurityLogs } from "@/server/repo";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";
import type { ChangedField } from "@/server/types";

export const metadata = { title: "审计" };

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const sp = await searchParams;
  const kind = one(sp.kind) || "audit";
  const entityType = one(sp.entityType);
  const paging = parsePage(one(sp.page));
  const tabs = [
    { kind: "audit", label: "业务变更" },
    { kind: "login", label: "登录" },
    { kind: "security", label: "越权" },
  ];
  return (
    <div>
      <PageHeader
        eyebrow="留痕"
        title="审计"
        description="关键写操作记在这里。任务过程日志在任务详情里，只追加、不能删。保留期按 24 个月规划，本期不自动清理。"
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button key={tab.kind} variant={kind === tab.kind ? "default" : "outline"} size="sm" asChild>
            <Link href={`/audit?kind=${tab.kind}`}>{tab.label}</Link>
          </Button>
        ))}
      </div>
      {kind === "login" ? <LoginTable actorReady={actor.id} paging={paging} /> : null}
      {kind === "security" ? <SecurityTable paging={paging} /> : null}
      {kind === "audit" ? (
        <AuditTable entityType={entityType} paging={paging} />
      ) : null}
    </div>
  );

  async function AuditTable({
    entityType: type,
    paging: page,
  }: {
    entityType: string;
    paging: { page: number; pageSize: number; skip: number };
  }) {
    const { rows, total } = await expose(() => listAudit(actor, { entityType: type, ...page }));
    return (
      <div>
        <form method="get" className="mb-3 flex gap-2">
          <input type="hidden" name="kind" value="audit" />
          <select name="entityType" defaultValue={type} className="h-8 rounded-lg border border-input bg-card px-2 text-sm">
            <option value="">全部对象</option>
            {["enterprise", "plan", "proposal", "position", "talent", "task", "ledger", "bill", "user", "setting"].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary" size="sm">
            筛选
          </Button>
        </form>
        {rows.length === 0 ? (
          <EmptyState title="还没有这类审计" />
        ) : (
          <LogTable
            headers={["时间", "谁", "对象", "动作", "变更", "备注"]}
            rows={rows.map((row) => [
              formatDateTime(row.createdAt),
              `${row.actor.displayName} · ${ROLE_LABEL[row.actorRole] ?? row.actorRole}`,
              `${row.entityType} ${row.entityId.slice(0, 8)}`,
              AUDIT_ACTION[row.action] ?? row.action,
              formatChanges(row.changedFields),
              row.comment ?? "—",
            ])}
          />
        )}
        <Pager page={page.page} pages={pageCount(total)} params={{ kind: "audit", entityType: type }} />
      </div>
    );
  }

  async function LoginTable({
    paging: page,
  }: {
    actorReady: string;
    paging: { page: number; pageSize: number; skip: number };
  }) {
    const { rows, total } = await expose(() => listLoginLogs(actor, page));
    return (
      <div>
        {rows.length === 0 ? (
          <EmptyState title="还没有登录记录" />
        ) : (
          <LogTable
            headers={["时间", "登录名", "结果", "说明"]}
            rows={rows.map((row) => [formatDateTime(row.createdAt), row.loginName, row.success ? "成功" : "失败", row.detail ?? "—"])}
          />
        )}
        <Pager page={page.page} pages={pageCount(total)} params={{ kind: "login" }} />
      </div>
    );
  }

  async function SecurityTable({
    paging: page,
  }: {
    paging: { page: number; pageSize: number; skip: number };
  }) {
    const { rows, total } = await expose(() => listSecurityLogs(actor, page));
    return (
      <div>
        {rows.length === 0 ? (
          <EmptyState title="还没有越权记录" hint="用错误的企业或任务链接试一次，这里会出现 403。" />
        ) : (
          <LogTable
            headers={["时间", "账号", "说明"]}
            rows={rows.map((row) => [
              formatDateTime(row.createdAt),
              row.actor ? `${row.actor.displayName} · ${row.actor.loginName}` : "未登录",
              row.detail ?? "—",
            ])}
          />
        )}
        <Pager page={page.page} pages={pageCount(total)} params={{ kind: "security" }} />
      </div>
    );
  }
}

function formatChanges(raw: string | null) {
  if (!raw) return "—";
  try {
    const fields = JSON.parse(raw) as ChangedField[];
    return fields.map((field) => `${field.field}: ${field.old || "空"} → ${field.new || "空"}`).join("；");
  } catch {
    return raw;
  }
}

function LogTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-zy-line shadow-zy">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/70 text-left text-muted-foreground">
          <tr>
            {headers.map((head) => (
              <th key={head} className="px-3 py-2 font-medium">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-border align-top">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2 whitespace-pre-wrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
