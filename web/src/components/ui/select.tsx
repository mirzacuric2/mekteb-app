import { forwardRef, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        {...props}
        className={cn(
          "w-full appearance-none rounded-md border border-input bg-white px-3 py-2 pr-9 text-sm outline-none ring-0 focus:border-ring disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
});
