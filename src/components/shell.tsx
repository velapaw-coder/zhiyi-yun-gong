"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Home,
  Inbox,
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
      { href: "/leads", label: "线索", icon: Inbox },
      { href: "/proposals", label: "方案书", icon: FileText },
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
      { href: "/proposals", label: "方案书", icon: FileText },
    ];
  }
  return [
    { href: "/workbench", label: "待办", icon: Home },
    { href: "/tasks", label: "我的任务", icon: ListChecks },
    { href: "/me", label: "我的档案", icon: UserRound },
  ];
}

/** 手机底部导航：每个角色最常用的几项，其余放进「更多」抽屉。 */
const MOBILE_PRIMARY: Record<string, string[]> = {
  ops: ["/workbench", "/leads", "/tasks", "/enterprises"],
  enterprise: ["/workbench", "/tasks", "/ledgers", "/bills"],
  worker: ["/workbench", "/tasks", "/me"],
};

/** 小屏下把表格变成卡片：把表头文字写到每个单元格的 data-label 上，由 globals.css 显示。 */
function useTableCardLabels(pathname: string) {
  useEffect(() => {
    const root = document.querySelector("main");
    if (!root) return;
    const label = () => {
      root.querySelectorAll("table").forEach((table) => {
        const heads = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent?.trim() ?? "");
        if (heads.length === 0 || table.hasAttribute("data-levy-table")) return;
        table.setAttribute("data-cards", "");
        table.querySelectorAll("tbody tr").forEach((row) => {
          Array.from(row.children).forEach((cell, index) => {
            const text = heads[index] ?? "";
            if (cell.getAttribute("data-label") !== text) cell.setAttribute("data-label", text);
          });
        });
      });
    };
    label();
    const observer = new MutationObserver(label);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);
}

function active(pathname: string, href: string) {
  if (href === "/workbench") return pathname === "/workbench";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Shell({
  actor,
  today,
  newLeads = 0,
  children,
}: {
  actor: Actor;
  today: string;
  newLeads?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = itemsFor(actor);

  const current = items.find((item) => active(pathname, item.href));
  const primaryHrefs = MOBILE_PRIMARY[actor.role] ?? [];
  const primary = items.filter((item) => primaryHrefs.includes(item.href)).slice(0, 4);
  const hasMore = items.length > primary.length;
  useTableCardLabels(pathname);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-zy-paper">
      <aside
        className={cn(
          "zy-sidebar-bg fixed inset-y-0 left-0 z-50 flex w-[min(18rem,84vw)] flex-col pb-[env(safe-area-inset-bottom)] text-sidebar-foreground shadow-2xl transition-transform lg:w-64 lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          type="button"
          aria-label="关闭菜单"
          className="absolute top-5 right-3 grid size-10 place-items-center rounded-lg text-white/70 hover:bg-white/10 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <X className="size-5" />
        </button>
        <Link href="/" className="flex items-center gap-3 px-5 pt-6 pb-5" aria-label="智翼云工首页">
          <BrandMark tone="glass" />
          <div className="leading-tight">
            <p className="text-base font-bold tracking-wide text-white">智翼云工</p>
            <p className="mt-0.5 text-[10px] tracking-[0.08em] text-white/55">SMARTWING CLOUDWORK</p>
          </div>
        </Link>
        <p className="px-6 pb-2 text-xs font-semibold tracking-[0.14em] text-[#9fe0ef]/80">{ROLE_LABEL[actor.role]}控制台</p>
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
                  "relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors lg:min-h-0",
                  on
                    ? "bg-white/10 font-semibold text-white before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-zy-gold"
                    : "text-sidebar-foreground/75 hover:bg-white/[.06] hover:text-white",
                )}
              >
                <Icon className={cn("size-4", on ? "text-zy-gold" : "text-[#9fe0ef]/70")} />
                {item.label}
                {item.href === "/leads" && newLeads > 0 ? <span data-testid="lead-badge" className="ml-auto min-w-5 rounded-full bg-zy-gold px-1.5 text-center text-[11px] leading-5 font-bold text-zy-deep">{newLeads > 99 ? "99+" : newLeads}</span> : null}
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
            className="-mx-2 mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-zy-gold-soft hover:bg-white/10 hover:text-white"
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
        <button aria-label="关闭菜单" className="fixed inset-0 z-40 bg-zy-deep/50 backdrop-blur-[2px] lg:hidden" onClick={() => setOpen(false)} />
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
            <Button variant="ghost" size="icon" className="-ml-2 size-10 lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="打开菜单">
              {open ? <X /> : <Menu />}
            </Button>
            <BrandMark className="size-7 rounded-lg lg:hidden" />
            <p className="flex items-center gap-2 text-sm font-semibold text-zy-deep">
              <ClipboardList className="hidden size-4 text-zy-cyan lg:block" />
              {current?.label ?? "控制台"}
            </p>
            <p className="ml-auto rounded-full bg-zy-pale px-3 py-1 text-xs font-medium text-zy-blue">
              <span className="hidden sm:inline">上海时间 </span>
              {today}
            </p>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-8 lg:py-7">{children}</main>
      </div>
      <nav
        aria-label="底部导航"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-zy-line bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_rgba(6,51,69,0.08)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {primary.map((item) => {
            const on = active(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[12px] font-medium",
                    on ? "text-zy-blue" : "text-zy-muted",
                  )}
                >
                  <span className={cn("relative grid h-7 w-12 place-items-center rounded-full", on && "bg-zy-pale")}>
                    <Icon className="size-5" />
                    {item.href === "/leads" && newLeads > 0 ? <span className="absolute -top-1 right-1 min-w-4 rounded-full bg-zy-rose px-1 text-[10px] leading-4 font-bold text-white">{newLeads > 99 ? "99+" : newLeads}</span> : null}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
          {hasMore ? (
            <li className="flex-1">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className={cn(
                  "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[12px] font-medium",
                  current && !primary.includes(current) ? "text-zy-blue" : "text-zy-muted",
                )}
              >
                <span className="grid h-7 w-12 place-items-center rounded-full">
                  <Menu className="size-5" />
                </span>
                更多
              </button>
            </li>
          ) : null}
        </ul>
      </nav>
    </div>
  );
}
