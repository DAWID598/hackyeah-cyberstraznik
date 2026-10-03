import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary:
    "bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/20",
  secondary:
    "bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700",
  danger:
    "bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-900/20",
  ghost: "bg-transparent text-slate-300 hover:bg-slate-800/60",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
