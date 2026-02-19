import { cn } from "@/lib/utils";

const variantStyles = {
  default: "bg-muted text-muted-foreground border-border",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
};

export function BadgeStatus({
  icon: Icon,
  label,
  variant = "default",
}: {
  icon: any;
  label: string;
  variant?: "default" | "success" | "warning" | "destructive";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        variantStyles[variant],
      )}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      <span className="leading-none pb-px">{label}</span>
    </div>
  );
}
