import { cn } from "cn";

/** 上升翼品牌图形：三道由同一起点向右上展开的翼线。 */
export function WingGlyph({ className, gradient = false }: { className?: string; gradient?: boolean }) {
  const stroke = gradient ? "url(#zy-wing-gradient)" : "currentColor";
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {gradient ? (
        <defs>
          <linearGradient id="zy-wing-gradient" x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#0FA3C4" />
            <stop offset="1" stopColor="#E3A733" />
          </linearGradient>
        </defs>
      ) : null}
      <path d="M15 76 L56 65" fill="none" stroke={stroke} strokeWidth="13" strokeLinecap="round" />
      <path d="M15 76 L71 40" fill="none" stroke={stroke} strokeWidth="13" strokeLinecap="round" />
      <path d="M15 76 L82 15" fill="none" stroke={stroke} strokeWidth="13" strokeLinecap="round" />
    </svg>
  );
}

/** 圆角方块品牌标：后台侧栏、登录页、首页导航共用。 */
export function BrandMark({ className, tone = "blue" }: { className?: string; tone?: "blue" | "gold" | "glass" }) {
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl",
        tone === "blue" && "bg-zy-blue text-white",
        tone === "gold" && "bg-zy-gold text-zy-deep",
        tone === "glass" && "bg-white/10 text-white ring-1 ring-white/15",
        className,
      )}
    >
      <WingGlyph className="size-[70%]" />
    </span>
  );
}

export function BrandLockup({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 whitespace-nowrap">
      <BrandMark tone={dark ? "glass" : "blue"} className={compact ? "size-9" : undefined} />
      <span className="leading-tight">
        <strong className={cn("block font-bold tracking-wide", compact ? "text-base" : "text-xl", dark ? "text-white" : "text-zy-deep")}>
          智翼云工
        </strong>
        <small className={cn("block text-[10px] tracking-[0.08em]", dark ? "text-white/60" : "text-[#617783]")}>SMARTWING CLOUDWORK</small>
      </span>
    </span>
  );
}
