import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// 首页、登录页这类纯静态页在构建时预渲染，直接从静态资源读取，
// 不在每次请求时重新渲染，减少 Worker CPU（免费版每次请求只有 10ms CPU）。
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
