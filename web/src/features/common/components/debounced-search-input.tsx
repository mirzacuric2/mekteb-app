import { useEffect, useState } from "react";
import { Input } from "../../../components/ui/input";

type DebouncedSearchInputProps = {
  value?: string;
  onDebouncedChange: (value: string) => void;
  placeholder?: string;
  delayMs?: number;
};

export function DebouncedSearchInput({
  value = "",
  onDebouncedChange,
  placeholder = "Search...",
  delayMs = 700,
}: DebouncedSearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onDebouncedChange(localValue);
    }, delayMs);

    return () => window.clearTimeout(timeout);
  }, [delayMs, localValue, onDebouncedChange]);

  return (
    <Input
      value={localValue}
      onChange={(event) => setLocalValue(event.target.value)}
      placeholder={placeholder}
      className="h-8 py-1"
    />
  );
}
