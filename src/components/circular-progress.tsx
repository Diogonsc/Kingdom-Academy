import { cn } from "@/lib/utils";
import { useId } from "react";

type CircularProgressProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function CircularProgress({
  value,
  size = 64,
  strokeWidth = 6,
  className,
}: CircularProgressProps) {
  const gradientId = useId();
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${clamped}% concluído`}
    >
      <div className="absolute inset-1 rounded-full bg-linear-to-br from-primary/8 to-primary/3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] ring-1 ring-primary/10 dark:from-primary/15 dark:to-primary/5" />
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 drop-shadow-[0_0_6px_color-mix(in_oklch,var(--primary)_30%,transparent)]"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/35"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold tabular-nums leading-none tracking-tight text-foreground">
          {clamped}
          <span className="ml-px text-[10px] font-semibold text-muted-foreground">
            %
          </span>
        </span>
      </div>
    </div>
  );
}
