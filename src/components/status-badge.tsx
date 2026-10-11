import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import { labelOf } from "@/lib/labels";

const tones: Record<string, string> = {
  potential: "bg-stone-100 text-stone-700",
  signed: "bg-emerald-100 text-emerald-900",
  paused: "bg-amber-100 text-amber-950",
  terminated: "bg-stone-200 text-stone-600",
  draft: "bg-stone-100 text-stone-700",
  pending: "bg-sky-100 text-sky-950",
  executing: "bg-emerald-100 text-emerald-950",
  ended: "bg-stone-200 text-stone-600",
  voided: "bg-stone-200 text-stone-500",
  active: "bg-emerald-100 text-emerald-950",
  inactive: "bg-stone-200 text-stone-600",
  assigned: "bg-slate-100 text-slate-800",
  in_progress: "bg-sky-100 text-sky-950",
  submitted: "bg-amber-100 text-amber-950",
  rework: "bg-orange-100 text-orange-950",
  accepted: "bg-emerald-100 text-emerald-950",
  cancelled: "bg-stone-200 text-stone-600",
  candidate: "bg-stone-100 text-stone-700",
  training: "bg-sky-100 text-sky-950",
  eligible: "bg-teal-100 text-teal-950",
  on_duty: "bg-emerald-100 text-emerald-950",
  not_started: "bg-stone-100 text-stone-700",
  graduated: "bg-emerald-100 text-emerald-950",
  incomplete: "bg-stone-100 text-stone-700",
  pending_review: "bg-amber-100 text-amber-950",
  checked: "bg-emerald-100 text-emerald-950",
  anomaly: "bg-rose-100 text-rose-950",
  issued: "bg-sky-100 text-sky-950",
  confirmed: "bg-emerald-100 text-emerald-950",
  none: "bg-stone-100 text-stone-700",
  partial: "bg-amber-100 text-amber-950",
  unpaid: "bg-stone-100 text-stone-700",
  paid: "bg-emerald-100 text-emerald-950",
  disabled: "bg-stone-200 text-stone-600",
  passed: "bg-emerald-100 text-emerald-950",
  failed: "bg-rose-100 text-rose-950",
  ops: "bg-sidebar-primary text-sidebar-primary-foreground",
  enterprise: "bg-sky-100 text-sky-950",
  worker: "bg-teal-100 text-teal-950",
};

export function StatusBadge({ map, value }: { map: Record<string, string>; value: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", tones[value] ?? "bg-muted text-foreground")}>
      {labelOf(map, value)}
    </Badge>
  );
}
