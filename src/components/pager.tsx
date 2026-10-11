import Link from "next/link";
import { Button } from "@/components/ui/button";
import { queryString } from "@/lib/format";

export function Pager({
  page,
  pages,
  params,
}: {
  page: number;
  pages: number;
  params: Record<string, string | undefined>;
}) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        第 {page} / {pages} 页
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={queryString(params, { page: String(page - 1) })}>上一页</Link>
          </Button>
        ) : null}
        {page < pages ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={queryString(params, { page: String(page + 1) })}>下一页</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
