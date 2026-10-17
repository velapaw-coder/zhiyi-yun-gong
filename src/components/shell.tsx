"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  ClipboardList,
  FileSpreadsheet,
  Home,
  Layers,
  ListChecks,
  LogOut,
  Menu,
  Receipt,
  ShieldCheck,
  UserRound,
  Users,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { ROLE_LABEL } from "@/lib/labels";
import type { Actor } from "@/server/types";

function itemsFor(actor: Actor): Array<{ href: string; label: string; icon: LucideIcon }> {
  if (actor.role === "ops") {
    return [
      { href: "/workbench", label: "工作台", icon: Home },
      { href: "/enterprises", label: "企业", icon: Building2 },
      { href: "/positions", label: "岗位", icon: Layers },
      { href: "/tasks", label: "任务", icon: ListChecks },
      { href: "/talents", label: "人才", icon: UsersRound },
      { href: "/ledgers", label: "台账", icon: FileSpreadsheet },
      { href: "/bills", label: "账单", icon: Receipt },
      { href: "/users", label: "账号", icon: Users },
      { href: "/audit", label: "审计", icon: ShieldCheck },
    ];
  }
  if (actor.role === "enterprise") {
    return [
      { href: "/workbench", label: "门户", icon: Home },
      { href: actor.enterpriseId ? `/enterprises/${actor.enterpriseId}` : "/workbench", label: "方案与岗位", icon: Building2 },
      { href: "/positions", label: "岗位", icon: Layers },
      { href: "/tasks", label: "任务", icon: ListChecks },
      { href: "/ledgers", label: "台账", icon: FileSpreadsheet },
      { href: "/bills", label: "账单", icon: Receipt },
    ];
  }
  return [
    { href: "/workbench", label: "待办", icon: Home },
    { href: "/tasks", label: "我的任务", icon: ListChecks },
    { href: "/me", label: "我的档案", icon: UserRound },
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

  const current = items.find((item) => active(pathname, item.href));

  return (
    <div className="min-h-screen bg-zy-paper">
      <aside
        className={cn(
          "zy-sidebar-bg fixed inset-y-0 left-0 z-40 flex w-64 flex-col text-sidebar-foreground transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link href="/" className="flex items-center gap-3 px-5 pt-6 pb-5" aria-label="智翼云工首页">
          <BrandMark tone="glass" />
          <div className="leading-tight">
            <p className="text-base font-bold tracking-wide text-white">智翼云工</p>
            <p className="mt-0.5 text-[10px] tracking-[0.08em] text-white/55">SMARTWING CLOUDWORK</p>
          </div>
        </Link>
        <p className="px-6 pb-2 text-[11px] font-semibold tracking-[0.14em] text-[#9fe0ef]/80">{ROLE_LABEL[actor.role]}控制台</p>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {items.map((item) => {
            const on = active(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  on
                    ? "bg-white/10 font-semibold text-white before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-zy-gold"
                    : "text-sidebar-foreground/75 hover:bg-white/[.06] hover:text-white",
                )}
              >
                <Icon className={cn("size-4", on ? "text-zy-gold" : "text-[#9fe0ef]/70")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="m-3 rounded-xl bg-white/[.06] p-4 ring-1 ring-white/10">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-zy-gold text-sm font-bold text-zy-deep">
              {actor.displayName.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{actor.displayName}</p>
              <p className="mt-0.5 truncate text-xs text-sidebar-foreground/65">
                {ROLE_LABEL[actor.role]} · {actor.loginName}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-zy-gold-soft hover:text-white"
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              router.push("/login");
              router.refresh();
            }}
          >
            <LogOut className="size-3.5" />
            退出登录
          </button>
        </div>
      </aside>
      {open ? (
        <button aria-label="关闭菜单" className="fixed inset-0 z-30 bg-zy-deep/50 lg:hidden" onClick={() => setOpen(false)} />
      ) : null}
      <div className="lg:pl-64">
        <div className="hidden bg-zy-deep py-1 text-[11px] text-[#deecf1]/85 sm:block">
          <div className="mx-auto flex max-w-6xl justify-between gap-4 px-4 md:px-8">
            <span>以科技赋翼，让合规生长</span>
            <span>合同 · 社保 · 发薪 · 个税/发票 · 四流留痕</span>
          </div>
        </div>
        <header className="sticky top-0 z-20 border-b border-zy-line bg-[rgba(248,250,251,0.92)] backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-8">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="打开菜单">
              {open ? <X /> : <Menu />}
            </Button>
            <p className="flex items-center gap-2 text-sm font-semibold text-zy-deep">
              <ClipboardList className="size-4 text-zy-cyan" />
              {current?.label ?? "控制台"}
            </p>
            <p className="ml-auto rounded-full bg-zy-pale px-3 py-1 text-xs font-medium text-zy-blue">上海时间 {today}</p>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-7 md:px-8">{children}</main>
      </div>
    </div>
  );
}
