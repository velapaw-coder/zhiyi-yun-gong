import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

export type AppBindings = {
  DB?: D1Database;
  UPLOADS?: R2Bucket;
  SESSION_SECRET?: string;
};

/** 只在 Workers 请求里成功。本地 next dev / 脚本里会抛错，调用方回退到 SQLite 与磁盘。 */
export function cloudflareBindings(): AppBindings | null {
  try {
    const { env } = getCloudflareContext();
    return env as AppBindings;
  } catch {
    return null;
  }
}
