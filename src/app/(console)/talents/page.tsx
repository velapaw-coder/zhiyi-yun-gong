import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { selectClass } from "@/components/field";
import { StatusBadge } from "@/components/status-badge";
import { maskCert, one, pageCount, parsePage } from "@/lib/format";
import { TALENT_STATUS, TRAINING_PROGRESS } from "@/lib/labels";
import { listTalents } from "@/server/repo";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "人才" };

export default async function TalentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const status = one(sp.status);
  const paging = parsePage(one(sp.page));
  const { rows, total } = await expose(() => listTalents(actor, { q, status, ...paging }));
  return (
    <div>
      <PageHeader
        eyebrow="人才与培训"
        title="人才"
        description="残疾证完整号码只在运营端显示。企业门户默认不提供在岗名单。"
        actions={
          <Button asChild>
            <Link href="/talents/new">新建人才</Link>
          </Button>
        }
      />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <Input name="q" defaultValue={q} placeholder="姓名、编号或电话" className="w-full sm:w-56" />
        <select name="status" className={`${selectClass} min-w-0 flex-1 basis-32 sm:flex-none sm:basis-auto sm:w-36!`} defaultValue={status}>
          <option value="">全部状态</option>
          {Object.entries(TALENT_STATUS).map(([value, label]) => (
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
        <EmptyState title="没有人才档案" hint="录入后完成培训，再绑定到企业岗位。" />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-zy-line shadow-zy">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/70 text-left text-muted-foreground">
              <tr>
                {["姓名", "类别", "证号", "培训", "状态", "在岗", "账号"].map((head) => (
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
                    <Link href={`/talents/${row.id}`} className="font-medium text-primary hover:underline">
                      {row.name}
                    </Link>
                    <span className="block font-mono text-xs text-muted-foreground">{row.code}</span>
                  </td>
                  <td className="px-3 py-3">
                    {row.disabilityType}
                    {row.disabilityLevel ? ` · ${row.disabilityLevel}` : ""}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{row.disabilityCertNo}</td>
                  <td className="px-3 py-3">
                    <StatusBadge map={TRAINING_PROGRESS} value={row.trainingProgress} />
                    <span className="ml-2 text-xs text-muted-foreground">{row.trainingPercent}%</span>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge map={TALENT_STATUS} value={row.status} />
                  </td>
                  <td className="px-3 py-3">
                    {row.currentEnterprise?.name ?? "—"}
                    <span className="block text-xs text-muted-foreground">{row.currentPosition?.name ?? ""}</span>
                  </td>
                  <td className="px-3 py-3 text-xs">{row.account?.loginName ?? "未开通"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">列表对运营显示完整证号。对外展示示例：{rows[0] ? maskCert(rows[0].disabilityCertNo) : "····0000"}。</p>
      <Pager page={paging.page} pages={pageCount(total)} params={{ q, status }} />
    </div>
  );
}
