"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError, Field } from "@/components/field";

const DEMOS = [
  ["yunying", "运营 · 全平台"],
  ["qiye.zhizao", "企业 · 样例制造 A"],
  ["qiye.kuajing", "企业 · 瀚海跨境"],
  ["lin.xiao", "执行端 · 林晓"],
  ["zhao.min", "执行端 · 赵敏"],
  ["chen.yuan", "执行端 · 陈远"],
] as const;

export function LoginForm() {
  const params = useSearchParams();
  const [loginName, setLoginName] = useState("yunying");
  const [password, setPassword] = useState("Zhiyi#2026");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ loginName, password }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    setPending(false);
    if (!response.ok) {
      setError(data?.error ?? "登录失败");
      return;
    }
    const next = params.get("next");
    location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <FormError message={error} />
      <Field label="登录名" required>
        <Input autoComplete="username" value={loginName} onChange={(event) => setLoginName(event.target.value)} />
      </Field>
      <Field label="密码" required>
        <Input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </Field>
      <Button type="submit" disabled={pending} className="h-9">
        {pending ? "正在进入…" : "进入平台"}
      </Button>
      <div className="rounded-xl border border-border bg-muted/50 p-3">
        <p className="text-xs font-medium text-muted-foreground">演示账号，密码都是 Zhiyi#2026。点一行即可填入。</p>
        <ul className="mt-2 grid gap-1">
          {DEMOS.map(([name, label]) => (
            <li key={name}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-card"
                onClick={() => {
                  setLoginName(name);
                  setPassword("Zhiyi#2026");
                }}
              >
                <span>{label}</span>
                <span className="font-mono text-xs text-muted-foreground">{name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
