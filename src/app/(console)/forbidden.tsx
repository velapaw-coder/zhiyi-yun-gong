import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-sm text-muted-foreground">403</p>
      <h1 className="mt-2 text-2xl font-semibold">无权访问</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        这条记录不属于当前账号。越权尝试已经写入安全日志。
      </p>
      <Button className="mt-4" asChild>
        <Link href="/">回工作台</Link>
      </Button>
    </div>
  );
}
