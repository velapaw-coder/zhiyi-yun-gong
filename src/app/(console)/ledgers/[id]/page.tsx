import Link from "next/link";
import { LedgerCheckForm } from "@/components/record-forms";
import { LedgerSlotForm, RemoveFileButton } from "@/components/ledger-files";
import { PageHeader } from "@/components/page-header";
import { ReadOnlyBanner } from "@/components/field";
import { StatusBadge } from "@/components/status-badge";
import { fileSize, formatDateTime, maskCert } from "@/lib/format";
import { LEDGER_SLOTS, LEDGER_SLOT, LEDGER_STATUS } from "@/lib/labels";
import { getLedger } from "@/server/repo";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "台账详情" };

export default async function LedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const ledger = await expose(() => getLedger(actor, id));
  const ops = actor.role === "ops";
  return (
    <div>
      <PageHeader
        eyebrow={`${ledger.enterprise.name} · ${ledger.yearMonth}`}
        title={ledger.talent.name}
        description={ops ? `证号 ${ledger.talent.disabilityCertNo}` : `证号 ${maskCert(ledger.talent.disabilityCertNo)}`}
        actions={<StatusBadge map={LEDGER_STATUS} value={ledger.checkStatus} />}
      />
      {ops ? null : <ReadOnlyBanner />}
      {ledger.checkedAt ? (
        <p className="mb-4 text-xs text-muted-foreground">
          {ledger.checkedBy?.displayName ?? "运营"} 于 {formatDateTime(ledger.checkedAt)} 标记已核
        </p>
      ) : null}
      {ledger.anomalyNote ? <p className="mb-4 rounded-lg bg-accent px-3 py-2 text-sm">异常备注：{ledger.anomalyNote}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {LEDGER_SLOTS.map((slot) => {
          const files = ledger.files.filter((file) => file.ledgerSlot === slot);
          return (
            <section key={slot} className="rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy">
              <h2 className="font-bold text-zy-deep">{LEDGER_SLOT[slot]}</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {files.map((file) => (
                  <li key={file.id} className="flex items-center justify-between gap-3">
                    <a href={`/api/files/${file.id}`} className="text-primary hover:underline">
                      {file.originalName}
                      <span className="ml-2 text-xs text-muted-foreground">{fileSize(file.size)}</span>
                    </a>
                    {ops ? <RemoveFileButton ledgerId={ledger.id} fileId={file.id} /> : null}
                  </li>
                ))}
                {files.length === 0 ? <li className="text-sm text-muted-foreground">还没有这一类材料。</li> : null}
              </ul>
              {ops ? (
                <div className="mt-4 border-t border-border pt-4">
                  <LedgerSlotForm ledgerId={ledger.id} slot={slot} />
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
      {ops ? (
        <div className="mt-4">
          <LedgerCheckForm id={ledger.id} checkStatus={ledger.checkStatus} anomalyNote={ledger.anomalyNote ?? ""} />
        </div>
      ) : null}
      <p className="mt-4 text-sm">
        <Link href="/ledgers" className="text-primary hover:underline">
          返回台账列表
        </Link>
      </p>
    </div>
  );
}
