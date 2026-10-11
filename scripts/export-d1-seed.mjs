import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

function sqlitePath() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const file = url.replace(/^file:/, "");
  if (path.isAbsolute(file)) return file;
  return path.join("prisma", file.replace(/^\.\//, ""));
}

const TABLE_ORDER = [
  "Enterprise",
  "Plan",
  "Position",
  "Talent",
  "User",
  "Task",
  "DeliveryVersion",
  "TaskAuditLog",
  "ComplianceLedger",
  "Bill",
  "BillLineItem",
  "FileAsset",
  "AuditLog",
  "LoginLog",
  "SecurityLog",
];

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (value instanceof Uint8Array) return `X'${Buffer.from(value).toString("hex")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

const resolved = sqlitePath();
const db = new DatabaseSync(resolved, { readOnly: true });
const present = new Set(
  db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all()
    .map((row) => String(row.name)),
);

const ordered = [
  ...TABLE_ORDER.filter((name) => present.has(name)),
  ...[...present].filter((name) => !name.startsWith("sqlite_") && !name.startsWith("_prisma") && !TABLE_ORDER.includes(name)),
];

const lines = [
  "-- 由 scripts/export-d1-seed.mjs 从本地 SQLite 导出。",
  "-- 不要放进 wrangler migrations 目录，避免每次迁移重复插入。",
  "-- 附件二进制不在此文件里，需另把 data/uploads 上传到 R2。",
  "-- D1 不支持 PRAGMA，插入顺序已按外键依赖排列。",
];

for (const table of ordered) {
  const columns = db
    .prepare(`PRAGMA table_info(${JSON.stringify(table)})`)
    .all()
    .map((row) => String(row.name));
  const rows = db.prepare(`SELECT * FROM ${JSON.stringify(table)}`).all();
  if (rows.length === 0) continue;
  const quotedCols = columns.map((column) => JSON.stringify(column)).join(", ");
  for (const row of rows) {
    const values = columns.map((column) => sqlValue(row[column])).join(", ");
    lines.push(`INSERT INTO ${JSON.stringify(table)} (${quotedCols}) VALUES (${values});`);
  }
}

mkdirSync("prisma/d1", { recursive: true });
writeFileSync("prisma/d1/seed.sql", `${lines.join("\n")}\n`);
console.log(`已写入 prisma/d1/seed.sql（${ordered.length} 张表，源库 ${resolved}）`);
db.close();
