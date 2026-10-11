import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-2xl font-semibold">没有这条记录</h1>
      <p className="mt-2 text-sm text-muted-foreground">它可能已被删除，或链接不完整。</p>
      <Button className="mt-4" variant="outline" asChild>
        <Link href="/">回工作台</Link>
      </Button>
    </div>
  );
}
