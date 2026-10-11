export default function Loading() {
  return (
    <div className="grid gap-3">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-40 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
