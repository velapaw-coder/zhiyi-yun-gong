import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { StatusBadge } from "@/components/status-badge";
import { selectClass } from "@/components/field";
import { one, pageCount, parsePage } from "@/lib/format";
import { ENTERPRISE_STATUS } from "@/lib/labels";
import { listEnterprises } from "@/server/repo";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "企业" };

export default async function EnterprisesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const status = one(sp.status);
  const paging = parsePage(one(sp.page));
  const { rows, total } = await expose(() => listEnterprises(actor, { q, status, ...paging }));
  const params = { q, status };
  return (
    <div>
      <PageHeader
        eyebrow="签单"
        title="企业"
        description="先建企业，再进详情签方案。搜索名称、编号或对接人。"
        actions={
          <Button asChild>
            <Link href="/enterprises/new">新建企业</Link>
          </Button>
        }
      />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <Input name="q" defaultValue={q} placeholder="搜索企业" className="w-56" />
        <select name="status" className={`${selectClass} w-36!`} defaultValue={status}>
          <option value="">全部状态</option>
          {Object.entries(ENTERPRISE_STATUS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          筛选
        </Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="没有匹配的企业" hint="换个关键词，或新建第一家签约客户。" />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-zy-line shadow-zy">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/70 text-left text-muted-foreground">
              <tr>
                {["编号", "企业", "行业", "规模", "对接人", "状态", "方案 / 岗位"].map((head) => (
                  <th key={head} className="px-3 py-2 font-medium">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-3 font-mono text-xs">{row.code}</td>
                  <td className="px-3 py-3">
                    <Link href={`/enterprises/${row.id}`} className="font-medium text-primary hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{row.industry || "—"}</td>
                  <td className="num px-3 py-3">{row.scaleHeadcount}</td>
                  <td className="px-3 py-3">
                    {row.contactName}
                    <span className="block text-xs text-muted-foreground">{row.contactPhone}</span>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge map={ENTERPRISE_STATUS} value={row.status} />
                  </td>
                  <td className="num px-3 py-3">
                    {row._count.plans} / {row._count.positions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={paging.page} pages={pageCount(total)} params={params} />
    </div>
  );
}
