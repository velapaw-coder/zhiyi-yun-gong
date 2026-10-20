import { Shell } from "@/components/shell";
import { formatDate } from "@/lib/format";
import { requireActor } from "@/server/session";
import { countNewLeads } from "@/server/leads";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  const newLeads = actor.role === "ops" ? await countNewLeads().catch(() => 0) : 0;
  return (
    <Shell actor={actor} today={formatDate(new Date())} newLeads={newLeads}>
      {children}
    </Shell>
  );
}
