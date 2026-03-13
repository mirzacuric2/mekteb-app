import { LoaderCircle } from "lucide-react";
import { cn } from "../../../lib/utils";

type LoaderProps = {
  className?: string;
};

export function Loader({ className }: LoaderProps) {
  return <LoaderCircle aria-hidden="true" className={cn("h-4 w-4 animate-spin", className)} />;
}
