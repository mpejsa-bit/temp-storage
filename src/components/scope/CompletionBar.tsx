"use client";

function getColor(percent: number): string {
  if (percent >= 100) return "var(--accent-emerald, #10b981)";
  if (percent >= 67) return "var(--accent-cyan, #06b6d4)";
  if (percent >= 34) return "var(--accent-amber, #f59e0b)";
  return "var(--accent-rose, #f43f5e)";
}

function getColorClass(percent: number): string {
  if (percent >= 100) return "text-emerald-400";
  if (percent >= 67) return "text-cyan-400";
  if (percent >= 34) return "text-amber-400";
  return "text-rose-400";
}

function getBgClass(percent: number): string {
  if (percent >= 100) return "bg-emerald-500";
  if (percent >= 67) return "bg-cyan-500";
  if (percent >= 34) return "bg-amber-500";
  return "bg-rose-500";
}

interface CompletionBarProps {
  percent: number;
  size?: "sm" | "md";
  showLabel?: boolean;
  label?: string;
}

export default function CompletionBar({ percent, size = "sm", showLabel = true, label }: CompletionBarProps) {
  const p = Math.round(Math.max(0, Math.min(100, percent)));
  const barHeight = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className="flex items-center gap-2 w-full">
      {label && (
        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{label}</span>
      )}
      <div className={`flex-1 ${barHeight} bg-[var(--border)]/40 rounded-full overflow-hidden`}>
        <div
          className={`${barHeight} rounded-full transition-all duration-500 ${getBgClass(p)}`}
          style={{ width: `${p}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-semibold tabular-nums whitespace-nowrap ${getColorClass(p)}`}>
          {p}%
        </span>
      )}
    </div>
  );
}

export function CompletionDot({ percent }: { percent: number }) {
  const p = Math.round(Math.max(0, Math.min(100, percent)));
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${getBgClass(p)}`}
      title={`${p}% complete`}
    />
  );
}
