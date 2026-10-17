"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";

type Item = { id: string; name: string; error?: string };

export function FilePicker({ label = "附件" }: { label?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [uploading, setUploading] = useState(false);

  async function onChange(list: FileList | null) {
    if (!list || list.length === 0) return;
    setUploading(true);
    const next = [...items];
    for (const file of Array.from(list)) {
      if (next.filter((item) => item.id).length >= 20) {
        next.push({ id: "", name: file.name, error: "最多 20 个附件" });
        break;
      }
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/files", { method: "POST", body });
      const data = (await response.json().catch(() => null)) as { id?: string; name?: string; error?: string } | null;
      if (!response.ok || !data?.id) next.push({ id: "", name: file.name, error: data?.error ?? "上传失败" });
      else next.push({ id: data.id, name: data.name ?? file.name });
    }
    setItems(next);
    setUploading(false);
  }

  return (
    <div className="grid gap-2 text-sm">
      <span className="font-semibold text-zy-deep">{label}</span>
      <label
        className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#9fc3d1] bg-zy-pale/40 px-3 text-sm font-semibold text-zy-blue transition hover:border-zy-cyan hover:bg-zy-pale ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <Paperclip className="size-4" />
        {uploading ? "正在上传…" : items.some((item) => item.id) ? "继续添加文件" : "选择文件 / 拍照上传"}
        <input
          type="file"
          multiple
          className="sr-only"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
          disabled={uploading}
          onChange={(event) => {
            void onChange(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      <p className="text-xs text-muted-foreground">支持 pdf / doc / docx / xls / xlsx / png / jpg / zip，单文件 ≤ 50MB，最多 20 个。</p>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="text-xs">
            {item.error ? (
              <span className="text-destructive">
                {item.name}：{item.error}
              </span>
            ) : (
              <span className="text-zy-green">✓ {item.name}</span>
            )}
          </li>
        ))}
      </ul>
      {items
        .filter((item) => item.id)
        .map((item) => (
          <input key={item.id} type="hidden" name="fileIds" value={item.id} />
        ))}
    </div>
  );
}
