import { Shell } from "@/components/shell";
import { formatDate } from "@/lib/format";
import { requireActor } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  return (
    <Shell actor={actor} today={formatDate(new Date())}>
      {children}
    </Shell>
  );
}
