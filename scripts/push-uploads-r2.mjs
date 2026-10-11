import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const bucket = process.env.R2_BUCKET || "zhiyi-yun-gong-uploads";
const dir = path.join(process.cwd(), "data", "uploads");
const local = process.argv.includes("--local");
const remote = process.argv.includes("--remote") || !local;

let names = [];
try {
  names = (await readdir(dir)).filter((name) => !name.startsWith("."));
} catch {
  console.error(`没有找到 ${dir}。请先在本地执行 npm run db:setup。`);
  process.exit(1);
}

if (names.length === 0) {
  console.error("data/uploads 是空的，没有可上传的附件。");
  process.exit(1);
}

const mimeOf = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
};

for (const name of names) {
  const ext = name.toLowerCase().split(".").pop() || "";
  const args = [
    "wrangler",
    "r2",
    "object",
    "put",
    `${bucket}/${name}`,
    "--file",
    path.join(dir, name),
    "--content-type",
    mimeOf[ext] || "application/octet-stream",
    "--force",
  ];
  if (local) args.push("--local");
  if (remote) args.push("--remote");
  const result = spawnSync("npx", args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const sample = await readFile(path.join(dir, names[0]));
console.log(`已提交 ${names.length} 个对象到 ${local ? "本地" : "远程"} R2 桶 ${bucket}。示例大小 ${sample.byteLength} 字节。`);
