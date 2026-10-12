import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const files = [
  "node_modules/@prisma/adapter-d1/dist/index.mjs",
  "node_modules/@prisma/adapter-d1/dist/index.js",
];
const marker = "function isStoredTimestamp(";

const helpers = `function timestampToIso(value) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "bigint" || typeof value === "number" && Number.isFinite(value)) {
    const asNumber = typeof value === "bigint" ? Number(value) : value;
    if (!Number.isSafeInteger(asNumber) || asNumber < 1e11 || asNumber > 1e14) return undefined;
    return new Date(asNumber).toISOString();
  }
  if (typeof value === "string" && /^\\d{12,14}$/.test(value)) return new Date(Number(value)).toISOString();
  if (typeof value === "string" && isISODate(value)) {
    const parsed = Date.parse(value.includes(" ") ? value.replace(" ", "T") + "Z" : value);
    if (Number.isNaN(parsed)) return undefined;
    return new Date(parsed).toISOString();
  }
  return undefined;
}
function isStoredTimestamp(value) {
  return timestampToIso(value) !== undefined;
}
`;

function patch(file, enumName) {
  let text = readFileSync(file, "utf8");
  if (text.includes(marker)) return false;
  const helperAt = text.indexOf("function getColumnTypes(");
  if (helperAt < 0) throw new Error(`找不到 getColumnTypes: ${file}`);
  text = text.slice(0, helperAt) + helpers + text.slice(helperAt);
  const columnStart = `function getColumnTypes(columnNames, rows) {
  const columnTypes = [];
  columnLoop: for (let columnIndex = 0; columnIndex < columnNames.length; columnIndex++) {
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {`;
  const columnNext = `function getColumnTypes(columnNames, rows) {
  const columnTypes = [];
  for (let columnIndex = 0; columnIndex < columnNames.length; columnIndex++) {
    let sawTimestamp = false;
    let sawOther = false;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const candidateValue = rows[rowIndex][columnIndex];
      if (candidateValue === null || candidateValue === undefined) continue;
      if (isStoredTimestamp(candidateValue)) sawTimestamp = true;
      else sawOther = true;
    }
    if (sawTimestamp && !sawOther) columnTypes[columnIndex] = ${enumName}.DateTime;
  }
  columnLoop: for (let columnIndex = 0; columnIndex < columnNames.length; columnIndex++) {
    if (columnTypes[columnIndex] === ${enumName}.DateTime) continue;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {`;
  if (!text.includes(columnStart)) throw new Error(`getColumnTypes 结构已变化: ${file}`);
  text = text.replace(columnStart, columnNext);
  const rowStart = `function mapRow(result, columnTypes) {
  for (let i = 0; i < result.length; i++) {
    const value = result[i];`;
  const rowNext = `function mapRow(result, columnTypes) {
  for (let i = 0; i < result.length; i++) {
    if (columnTypes[i] === ${enumName}.DateTime) {
      const iso = timestampToIso(result[i]);
      if (iso !== undefined) {
        result[i] = iso;
        continue;
      }
    }
    const value = result[i];`;
  if (!text.includes(rowStart)) throw new Error(`mapRow 结构已变化: ${file}`);
  text = text.replace(rowStart, rowNext);
  writeFileSync(file, text);
  return true;
}

let changed = 0;
for (const relative of files) {
  const file = path.join(process.cwd(), relative);
  if (!existsSync(file)) {
    const duringInstall = process.env.npm_lifecycle_event === "postinstall";
    console.error(`找不到 ${file}`);
    process.exit(duringInstall ? 0 : 1);
  }
  const enumName = readFileSync(file, "utf8").includes("import_driver_adapter_utils.ColumnTypeEnum")
    ? "import_driver_adapter_utils.ColumnTypeEnum"
    : "ColumnTypeEnum";
  if (patch(file, enumName)) changed += 1;
}
console.log(changed === 0 ? "Prisma D1 时间戳补丁已在" : `已修补 Prisma D1 时间戳读取（${changed} 个文件）`);
