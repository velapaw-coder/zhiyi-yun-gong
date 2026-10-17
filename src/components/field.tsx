import { cn } from "cn";

export function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-1.5 text-sm", className)}>
      <span className="font-semibold text-zy-deep">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs leading-5 text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  );
}

export function FormNote({ message }: { message?: string | null }) {
  if (!message) return null;
  return <div className="rounded-lg border border-[#f1d9a1] bg-accent px-3 py-2 text-sm text-accent-foreground">{message}</div>;
}

export const selectClass =
  "h-9 w-full rounded-lg border border-input bg-white px-3 text-base sm:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ReadOnlyBanner() {
  return (
    <p className="mb-4 rounded-lg border border-[#b4e2ee] bg-[#e1f4f9] px-3 py-2 text-sm text-[#0b6a82]">
      当前为企业只读账号，可以查看本企业数据，不能修改。
    </p>
  );
}
