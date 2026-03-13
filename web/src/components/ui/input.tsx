import { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-ring",
        props.className
      )}
    />
  );
}
