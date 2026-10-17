export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-zy-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="zy-kicker mb-2">{eyebrow}</p> : null}
        <h1 className="text-[26px] leading-tight font-bold tracking-tight text-zy-deep">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#b9cbd4] bg-white px-6 py-14 text-center">
      <p className="font-semibold text-zy-deep">{title}</p>
      {hint ? <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
