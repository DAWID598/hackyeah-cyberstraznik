import { cn } from "@/lib/utils";

const variants = {
  safe: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  threat: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  pending: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  neutral: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
