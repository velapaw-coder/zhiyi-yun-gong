import { PrismaD1 } from "@prisma/adapter-d1";
import { Prisma, PrismaClient } from "@prisma/client";
import type { D1Database } from "@cloudflare/workers-types";
import { cloudflareBindings } from "@/server/cloudflare";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const d1Clients = new WeakMap<D1Database, PrismaClient>();

function localClient() {
  globalForPrisma.prisma ??= new PrismaClient();
  return globalForPrisma.prisma;
}

function client() {
  const env = cloudflareBindings();
  if (env?.DB) {
    const cached = d1Clients.get(env.DB);
    if (cached) return cached;
    const created = new PrismaClient({ adapter: new PrismaD1(env.DB) });
    d1Clients.set(env.DB, created);
    return created;
  }
  if (env) {
    throw new Error("Cloudflare 环境缺少 D1 绑定 DB。请在 wrangler.toml 配置 d1_databases 后重新部署。");
  }
  return localClient();
}

/**
 * 本地 Node（next dev、seed、verify）使用 DATABASE_URL 指向的 SQLite 文件。
 * Workers 请求里改用 D1 绑定 DB。调用方式保持 `prisma.user.findMany()`。
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const real = client();
    const value = Reflect.get(real, prop, real) as unknown;
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(real) : value;
  },
});

/**
 * D1 不支持交互式事务。Prisma 仍会在提交时发送一条只有注释的 SQL，
 * D1 返回 “SQL code did not contain a statement”，整次写入变成系统异常。
 * Workers 上按顺序执行；本地 SQLite 仍用真正的事务。
 */
export async function runWrite<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  if (cloudflareBindings()?.DB) {
    return fn(prisma as unknown as Prisma.TransactionClient);
  }
  return prisma.$transaction((tx) => fn(tx));
}
