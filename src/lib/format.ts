import { AppError } from "@/server/errors";

export const PAGE_SIZE = 20;
export const SUMMARY_MIN = 20;
export const SUMMARY_MAX = 5000;
export const MAX_LINKS = 20;
export const MAX_FILES = 20;
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export function one(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function parsePage(value: string | undefined) {
  const page = Math.max(1, Number.parseInt(value || "1", 10) || 1);
  return { page, pageSize: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE };
}

export function pageCount(total: number) {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export function fenToYuan(fen: number) {
  const sign = fen < 0 ? "-" : "";
  const abs = Math.abs(fen);
  const yuan = Math.floor(abs / 100);
  const cents = abs % 100;
  return `${sign}${yuan.toLocaleString("zh-CN")}.${String(cents).padStart(2, "0")}`;
}

export function parseYuanToFen(input: string, label = "金额") {
  const raw = input.trim().replace(/,/g, "").replace(/¥/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(raw)) {
    throw new AppError(`${label}格式不正确，请填写数字，最多两位小数`);
  }
  const negative = raw.startsWith("-");
  const [yuan, cents = ""] = raw.replace("-", "").split(".");
  const fen = Number(yuan) * 100 + Number(cents.padEnd(2, "0"));
  if (!Number.isSafeInteger(fen)) throw new AppError(`${label}超出范围`);
  return negative ? -fen : fen;
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(value);
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export function toDatetimeLocalValue(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function fromDatetimeLocalValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw new AppError("时间格式不正确");
  }
  const date = new Date(`${value}:00+08:00`);
  if (Number.isNaN(date.getTime())) throw new AppError("时间格式不正确");
  return date;
}

export function fromDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new AppError("日期格式不正确");
  const date = new Date(`${value}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) throw new AppError("日期格式不正确");
  return date;
}

export function toDateInput(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function currentYearMonth(date = new Date()) {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
  }).format(date);
  return formatted.slice(0, 7);
}

export function monthRange(yearMonth: string) {
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) throw new AppError("月份格式应为 YYYY-MM");
  const [year, month] = yearMonth.split("-").map(Number);
  const start = new Date(`${yearMonth}-01T00:00:00+08:00`);
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const end = new Date(`${nextMonth}T00:00:00+08:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError("月份格式不正确");
  }
  return { start, end };
}

function isoWeekKey(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const isoYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/** 账单月内每个自然日所属 ISO 周去重。上海无夏令时，按公历日期计算。 */
export function weeksOverlappingMonth(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const weeks = new Set<string>();
  for (let day = 1; day <= days; day += 1) weeks.add(isoWeekKey(year, month, day));
  return weeks.size;
}

export function maskCert(cert: string) {
  const tail = cert.slice(-4);
  return `····${tail}`;
}

export function maskPhone(phone: string) {
  if (phone.length < 7) return "····";
  return `${phone.slice(0, 3)}····${phone.slice(-4)}`;
}

export function parseStringArray(raw: string | null | undefined) {
  if (!raw) return [] as string[];
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function qaItems(rules: string) {
  return rules
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*・\d.、\s]+/, "").trim())
    .filter(Boolean);
}

export function makeCode(prefix: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let body = "";
  for (let i = 0; i < 4; i += 1) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${body}`;
}

export function queryString(params: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value) next.set(key, value);
  }
  const text = next.toString();
  return text ? `?${text}` : "";
}
