"use client";

import { Button } from "@/components/ui/button";

export default function ConsoleError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-2xl font-semibold">页面没有加载完</h1>
      <p className="mt-2 text-sm text-muted-foreground">可以重试。如果同一操作反复失败，把时间和页面告诉运营。</p>
      <Button className="mt-4" onClick={() => reset()}>
        重试
      </Button>
    </div>
  );
}
