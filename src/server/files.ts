import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { canReadEnterprise, canReadTask, deny } from "@/server/access";
import type { Actor } from "@/server/types";
import { MAX_FILE_BYTES } from "@/lib/format";

const ALLOWED: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  zip: "application/zip",
};

export function uploadRoot() {
  return path.join(process.cwd(), "data", "uploads");
}

export function minimalPdf(text: string) {
  const safe = text.replace(/[()\\]/g, " ").replace(/[^\x20-\x7e]/g, " ");
  const stream = `BT /F1 12 Tf 36 120 Td (${safe}) Tj ET`;
  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
    "2 0 obj<< /Type /Pages /Count 1 /Kids [3 0 R] >>endobj",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 420 240] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj",
    `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream endobj`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(body.length);
    body += `${object}\n`;
  }
  const xref = body.length;
  let table = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    table += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  body += table;
  body += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(body, "utf8");
}

function extensionOf(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

export async function saveUpload(actor: Actor, file: File) {
  const ext = extensionOf(file.name);
  const mime = ALLOWED[ext];
  if (!mime) {
    throw new AppError("附件类型仅支持 pdf、doc、docx、xls、xlsx、png、jpg、zip");
  }
  if (file.size <= 0) throw new AppError("不能上传空文件");
  if (file.size > MAX_FILE_BYTES) throw new AppError("单个附件不能超过 50MB");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_FILE_BYTES) throw new AppError("单个附件不能超过 50MB");
  // TODO: 病毒扫描放到第二期。本期只限制类型与大小。
  const storageKey = `${randomUUID()}.${ext}`;
  const dir = uploadRoot();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, storageKey), buffer);
  const originalName = path.basename(file.name).slice(0, 180) || `file.${ext}`;
  return prisma.fileAsset.create({
    data: {
      originalName,
      mime,
      size: buffer.length,
      storageKey,
      uploaderId: actor.id,
    },
  });
}

export async function assertFilesAttachable(actor: Actor, fileIds: string[]) {
  if (fileIds.length > 20) throw new AppError("附件最多 20 个");
  const unique = [...new Set(fileIds)];
  if (unique.length !== fileIds.length) throw new AppError("附件重复");
  const files = await prisma.fileAsset.findMany({ where: { id: { in: unique } } });
  if (files.length !== unique.length) throw new AppError("有附件不存在或已失效");
  for (const file of files) {
    if (file.deletedAt) throw new AppError(`附件 ${file.originalName} 已删除`);
    if (file.deliveryId || file.ledgerId || file.planId) {
      throw new AppError(`附件 ${file.originalName} 已归属其他记录`);
    }
    if (actor.role !== "ops" && file.uploaderId !== actor.id) {
      await deny(actor, `绑定他人附件 ${file.id}`);
    }
  }
  return files;
}

export async function readAuthorizedFile(actor: Actor, id: string) {
  const file = await prisma.fileAsset.findUnique({
    where: { id },
    include: {
      task: { select: { id: true, enterpriseId: true, assigneeTalentId: true, status: true } },
      delivery: {
        select: {
          task: { select: { id: true, enterpriseId: true, assigneeTalentId: true, status: true } },
        },
      },
      ledger: { select: { enterpriseId: true } },
      plan: { select: { enterpriseId: true } },
    },
  });
  if (!file || file.deletedAt) throw new AppError("附件不存在", "NOT_FOUND");

  const task = file.task ?? file.delivery?.task ?? null;
  let allowed = false;
  if (actor.role === "ops") allowed = true;
  else if (task) allowed = canReadTask(actor, task);
  else if (file.ledger) allowed = canReadEnterprise(actor, file.ledger.enterpriseId);
  else if (file.plan) allowed = canReadEnterprise(actor, file.plan.enterpriseId);
  else if (file.enterpriseId) allowed = canReadEnterprise(actor, file.enterpriseId);
  else allowed = file.uploaderId === actor.id;

  if (!allowed) await deny(actor, `下载附件 ${id}`);
  return {
    file,
    stream: createReadStream(path.join(uploadRoot(), file.storageKey)),
    inline: file.mime.startsWith("image/"),
  };
}

export function contentDisposition(name: string, inline: boolean) {
  const ascii = name.replace(/[^\w.\-]+/g, "_") || "file";
  const encoded = encodeURIComponent(name);
  const kind = inline ? "inline" : "attachment";
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
