"use client";

import { FilePicker } from "@/components/file-picker";
import { FormError, FormNote } from "@/components/field";
import { Button } from "@/components/ui/button";
import { useSubmit } from "@/components/use-submit";
import { attachLedgerFilesAction, removeLedgerFileAction } from "@/server/actions";
import { LEDGER_SLOT } from "@/lib/labels";

export function LedgerSlotForm({ ledgerId, slot }: { ledgerId: string; slot: string }) {
  const { error, pending, saved, submit } = useSubmit();
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        void submit(() => attachLedgerFilesAction(ledgerId, slot, new FormData(form)), () => form.reset());
      }}
    >
      <p className="text-sm font-medium">{LEDGER_SLOT[slot]}</p>
      <FormError message={error} />
      <FormNote message={saved ? "已归档" : null} />
      <FilePicker label="上传扫描件或 PDF" />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        保存到{LEDGER_SLOT[slot]}
      </Button>
    </form>
  );
}

export function RemoveFileButton({ ledgerId, fileId }: { ledgerId: string; fileId: string }) {
  const { error, pending, submit } = useSubmit();
  return (
    <span>
      <button
        type="button"
        className="text-xs text-destructive hover:underline disabled:opacity-50"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("附件会软删除，记录仍留在审计里。")) return;
          void submit(() => removeLedgerFileAction(ledgerId, fileId));
        }}
      >
        移除
      </button>
      {error ? <span className="ml-1 text-xs text-destructive">{error}</span> : null}
    </span>
  );
}
