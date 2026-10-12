import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const file = path.join(
  process.cwd(),
  "node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/load-manifest.js",
);
const needle = "**/{*-manifest,required-server-files,prefetch-hints}.json";
const patched = "**/{*-manifest,required-server-files,prefetch-hints,preview-props}.json";

if (!existsSync(file)) {
  const duringInstall = process.env.npm_lifecycle_event === "postinstall";
  console.error(`找不到 ${file}`);
  process.exit(duringInstall ? 0 : 1);
}

const text = readFileSync(file, "utf8");
if (text.includes("preview-props}.json")) {
  console.log("OpenNext loadManifest 已包含 preview-props.json");
  process.exit(0);
}
if (!text.includes(needle)) {
  console.error("OpenNext load-manifest.js 的 glob 与预期不符，补丁没有应用。");
  process.exit(1);
}

writeFileSync(file, text.replace(needle, patched));
console.log("已让 OpenNext 在构建时内联 .next/server/preview-props.json");
