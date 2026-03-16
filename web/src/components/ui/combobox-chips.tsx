import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "../../lib/utils";

type ComboboxOption = {
  value: string;
  label: string;
};

type ComboboxChipsProps<TOption extends ComboboxOption> = {
  options: TOption[];
  values: string[];
  onChange: (nextValues: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  multiple?: boolean;
  disabled?: boolean;
  renderOption?: (option: TOption) => ReactNode;
  renderSelectedOption?: (option: TOption) => ReactNode;
};

export function ComboboxChips<TOption extends ComboboxOption>({
  options,
  values,
  onChange,
  placeholder = "Select options",
  emptyText = "No options found.",
  multiple = true,
  disabled = false,
  renderOption,
  renderSelectedOption,
}: ComboboxChipsProps<TOption>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  const selectedOptions = useMemo(
    () => options.filter((option) => values.includes(option.value)),
    [options, values]
  );

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, query]);

  const toggleValue = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }
    if (!multiple) {
      onChange([value]);
      setOpen(false);
      return;
    }
    onChange([...values, value]);
  };

  return (
    <div ref={rootRef} className="relative space-y-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-left text-sm transition-colors",
          "focus:border-ring disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        <span className="truncate text-slate-700">{values.length ? `${values.length} selected` : placeholder}</span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      {selectedOptions.length ? (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
            >
              {renderSelectedOption ? renderSelectedOption(option) : option.label}
              <button
                type="button"
                className="text-slate-500 hover:text-slate-700"
                onClick={() => toggleValue(option.value)}
                aria-label={`Remove ${option.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {open ? (
        <div className="absolute z-30 w-full rounded-md border border-border bg-white p-2 shadow-lg">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search..."
            className="mb-2 w-full rounded-md border border-input px-2 py-1.5 text-sm outline-none focus:border-ring"
          />
          <div className="max-h-44 space-y-1 overflow-y-auto">
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const selected = values.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleValue(option.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm",
                      selected ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span className="truncate">{renderOption ? renderOption(option) : option.label}</span>
                    {selected ? <Check className="h-4 w-4 text-primary" /> : null}
                  </button>
                );
              })
            ) : (
              <p className="px-2 py-1 text-xs text-slate-500">{emptyText}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
