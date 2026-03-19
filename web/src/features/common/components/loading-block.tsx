import { cn } from "../../../lib/utils";
import { Loader } from "./loader";

type LoadingBlockProps = {
  text?: string;
  className?: string;
  containerClassName?: string;
};

export function LoadingBlock({
  text = "Loading...",
  className,
  containerClassName,
}: LoadingBlockProps) {
  return (
    <div
      className={cn(
        "flex min-h-[160px] items-center justify-center rounded-md border border-dashed border-border",
        containerClassName
      )}
    >
      <Loader size="sm" text={text} className={cn("justify-center", className)} />
    </div>
  );
}
