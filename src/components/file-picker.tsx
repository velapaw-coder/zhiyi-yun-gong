"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

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
      <span className="font-medium">{label}</span>
      <Input
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
        disabled={uploading}
        onChange={(event) => {
          void onChange(event.target.files);
          event.target.value = "";
        }}
      />
      <p className="text-xs text-muted-foreground">支持 pdf / doc / docx / xls / xlsx / png / jpg / zip，单文件 ≤ 50MB，最多 20 个。</p>
      {uploading ? <p className="text-xs text-muted-foreground">正在上传…</p> : null}
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="text-xs">
            {item.error ? (
              <span className="text-destructive">
                {item.name}：{item.error}
              </span>
            ) : (
              <span>{item.name}</span>
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
