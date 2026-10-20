import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { StatusBadge } from "@/components/status-badge";
import { fenToYuan, formatDateTime, one, pageCount, parsePage } from "@/lib/format";
import { LEAD_STATUS, listLeads } from "@/server/leads";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "线索" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requireActor();
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const status = one(sp.status);
  const paging = parsePage(one(sp.page));
  const { rows, total } = await expose(() => listLeads(actor, { q, status, ...paging }));
  const tabs = [["", "全部"], ...Object.entries(LEAD_STATUS)];
  return (
    <div>
      <PageHeader eyebrow="销售" title="线索" description="官网和残保金计算器提交的咨询。带测算数据的线索可一键生成方案书。" />
      <div className="mb-3 flex flex-wrap gap-1.5" data-testid="lead-tabs">
        {tabs.map(([k, v]) => (
          <Link
            key={k}
            href={k ? `/leads?status=${k}` : "/leads"}
            className={`inline-flex min-h-9 items-center rounded-full px-3 text-sm font-medium ring-1 ${status === k ? "bg-zy-blue text-white ring-zy-blue" : "bg-white text-zy-deep ring-zy-line hover:bg-zy-pale"}`}
          >
            {v}
          </Link>
        ))}
      </div>
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <Input name="q" defaultValue={q} placeholder="企业 / 联系人 / 手机" className="w-full sm:w-64" />
        <Button type="submit" variant="secondary">
          搜索
        </Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="暂无线索" hint="官网或计算器页面有人提交咨询后会出现在这里。" />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-zy-line shadow-zy">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/70 text-left text-muted-foreground">
              <tr>
                {["企业", "联系人", "手机", "当前年应缴", "年净节省", "来源", "状态", "提交时间"].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-3">
                    <Link href={`/leads/${r.id}`} className="font-medium text-primary hover:underline">
                      {r.company}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{r.contact}</td>
                  <td className="num px-3 py-3">
                    <a href={`tel:${r.phone}`}>{r.phone}</a>
                  </td>
                  <td className="num px-3 py-3">{r.levyFen === null ? "未测算" : fenToYuan(r.levyFen)}</td>
                  <td className="num px-3 py-3">{r.netFen === null ? "—" : fenToYuan(r.netFen)}</td>
                  <td className="px-3 py-3">{r.source === "/calculator" ? "计算器页" : "首页"}</td>
                  <td className="px-3 py-3">
                    <StatusBadge map={LEAD_STATUS} value={r.status} />
                  </td>
                  <td className="num px-3 py-3">{formatDateTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={paging.page} pages={pageCount(total)} params={{ q, status }} />
    </div>
  );
}
