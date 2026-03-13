import { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type Variant = "default" | "outline";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ className, variant = "default", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
        variant === "default"
          ? "bg-primary text-primary-foreground hover:opacity-90"
          : "border border-border bg-white text-slate-700 hover:bg-slate-50",
        className
      )}
      {...props}
    />
  );
}
