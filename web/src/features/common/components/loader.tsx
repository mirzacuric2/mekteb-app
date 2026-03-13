import { LoaderCircle } from "lucide-react";
import { cn } from "../../../lib/utils";

type LoaderSize = "xs" | "sm" | "md" | "lg";

type LoaderProps = {
  size?: LoaderSize;
  text?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

const iconSizeClass: Record<LoaderSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

const textSizeClass: Record<LoaderSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Loader({
  size = "md",
  text = "Loading...",
  className,
  iconClassName,
  textClassName,
}: LoaderProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-slate-500", className)}>
      <LoaderCircle aria-hidden="true" className={cn("animate-spin", iconSizeClass[size], iconClassName)} />
      {text === "" ? null : <span className={cn(textSizeClass[size], textClassName)}>{text}</span>}
    </span>
  );
}
