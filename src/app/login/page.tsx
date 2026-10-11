import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "登录" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden flex-col justify-between bg-sidebar px-12 py-12 text-sidebar-foreground lg:flex">
        <div>
          <p className="text-sm tracking-[0.2em] text-sidebar-primary">智翼云工</p>
          <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight">把残保金支出，变成可以追查的真实交付。</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-sidebar-foreground/75">
            合规交付加上一种可量化的 AI 内容编排岗位。从签约、派活、交活到对账，合同、社保、发薪、个税/发票四流留在同一条台账上。
          </p>
        </div>
        <ol className="grid max-w-md grid-cols-4 gap-3 text-sm">
          {["签单", "派活", "交活", "对账"].map((item, index) => (
            <li key={item} className="rounded-xl border border-sidebar-border px-3 py-3">
              <span className="text-xs text-sidebar-primary">0{index + 1}</span>
              <p className="mt-1 font-medium">{item}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <p className="text-sm text-primary lg:hidden">智翼云工</p>
          <h2 className="mt-2 text-2xl font-semibold">登录运营后台</h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">运营、企业客户、执行端使用同一个入口，进去后只看见自己该看的数据。</p>
          <Suspense fallback={<p className="text-sm text-muted-foreground">正在打开登录…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
