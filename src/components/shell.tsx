"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { ROLE_LABEL } from "@/lib/labels";
import type { Actor } from "@/server/types";

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#e4c27a" />
      <path d="M7 21c5-.6 7.2-7 9-11 1.8 5.2 5.4 8.2 9.2 9.2-4.4.8-7.2 3.6-9.2 7.3C14.8 24.2 11.4 22.4 7 21Z" fill="#1d3b30" />
    </svg>
  );
}

function itemsFor(actor: Actor) {
  if (actor.role === "ops") {
    return [
      { href: "/workbench", label: "工作台" },
      { href: "/enterprises", label: "企业" },
      { href: "/positions", label: "岗位" },
      { href: "/tasks", label: "任务" },
      { href: "/talents", label: "人才" },
      { href: "/ledgers", label: "台账" },
      { href: "/bills", label: "账单" },
      { href: "/users", label: "账号" },
      { href: "/audit", label: "审计" },
    ];
  }
  if (actor.role === "enterprise") {
    return [
      { href: "/workbench", label: "门户" },
      { href: actor.enterpriseId ? `/enterprises/${actor.enterpriseId}` : "/workbench", label: "方案与岗位" },
      { href: "/positions", label: "岗位" },
      { href: "/tasks", label: "任务" },
      { href: "/ledgers", label: "台账" },
      { href: "/bills", label: "账单" },
    ];
  }
  return [
    { href: "/workbench", label: "待办" },
    { href: "/tasks", label: "我的任务" },
    { href: "/me", label: "我的档案" },
  ];
}

function active(pathname: string, href: string) {
  if (href === "/workbench") return pathname === "/workbench";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Shell({
  actor,
  today,
  children,
}: {
  actor: Actor;
  today: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = itemsFor(actor);

  return (
    <div className="min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2.5 px-4 py-5">
          <Mark />
          <div>
            <p className="text-sm font-semibold tracking-wide">智翼云工</p>
            <p className="text-[11px] text-sidebar-foreground/70">AI 助残增长服务</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {items.map((item) => {
            const on = active(pathname, item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm",
                  on ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <p className="truncate text-sm font-medium">{actor.displayName}</p>
          <p className="mt-0.5 text-xs text-sidebar-foreground/70">
            {ROLE_LABEL[actor.role]} · {actor.loginName}
          </p>
          <button
            type="button"
            className="mt-3 text-xs text-sidebar-primary hover:underline"
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              router.push("/login");
              router.refresh();
            }}
          >
            退出登录
          </button>
        </div>
      </aside>
      {open ? (
        <button aria-label="关闭菜单" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      ) : null}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="打开菜单">
            {open ? <X /> : <Menu />}
          </Button>
          <p className="text-sm text-muted-foreground">上海时间 {today}</p>
          <p className="ml-auto hidden text-xs text-muted-foreground sm:block">合同 · 社保 · 发薪 · 个税/发票</p>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
