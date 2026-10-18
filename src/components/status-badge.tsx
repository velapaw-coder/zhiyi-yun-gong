import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import { labelOf } from "@/lib/labels";

const TONE = {
  neutral: "bg-[#eef3f6] text-[#38505a] ring-[#d5dee4]",
  muted: "bg-[#f1f3f4] text-[#7a8a93] ring-[#e1e6e9]",
  info: "bg-[#e1f4f9] text-[#0b6a82] ring-[#b4e2ee]",
  teal: "bg-[#e0f2f1] text-[#0d6b62] ring-[#b6ddd9]",
  warn: "bg-[#fcf2dc] text-[#8a5d0c] ring-[#f1d9a1]",
  orange: "bg-[#fdeadf] text-[#a24a12] ring-[#f5c9ad]",
  ok: "bg-[#e3f4ec] text-[#1d7a50] ring-[#b9e1cd]",
  bad: "bg-[#fbe6e4] text-[#a3302a] ring-[#f2c1bd]",
} as const;

const tones: Record<string, string> = {
  potential: TONE.neutral,
  draft: TONE.neutral,
  sent: TONE.info,
  converted: TONE.ok,
  candidate: TONE.neutral,
  not_started: TONE.neutral,
  incomplete: TONE.neutral,
  none: TONE.neutral,
  unpaid: TONE.neutral,
  assigned: TONE.neutral,
  terminated: TONE.muted,
  ended: TONE.muted,
  voided: TONE.muted,
  inactive: TONE.muted,
  cancelled: TONE.muted,
  disabled: TONE.muted,
  pending: TONE.info,
  in_progress: TONE.info,
  training: TONE.info,
  issued: TONE.info,
  eligible: TONE.teal,
  worker: TONE.teal,
  paused: TONE.warn,
  submitted: TONE.warn,
  pending_review: TONE.warn,
  partial: TONE.warn,
  rework: TONE.orange,
  signed: TONE.ok,
  executing: TONE.ok,
  active: TONE.ok,
  accepted: TONE.ok,
  on_duty: TONE.ok,
  graduated: TONE.ok,
  checked: TONE.ok,
  confirmed: TONE.ok,
  paid: TONE.ok,
  passed: TONE.ok,
  anomaly: TONE.bad,
  failed: TONE.bad,
  ops: "bg-zy-gold text-[#172a34] ring-[#d1952a]",
  enterprise: TONE.info,
};

export function StatusBadge({ map, value }: { map: Record<string, string>; value: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 border-transparent font-semibold ring-1 ring-inset before:size-1.5 before:rounded-full before:bg-current before:opacity-70", tones[value] ?? TONE.neutral)}>
      {labelOf(map, value)}
    </Badge>
  );
}
