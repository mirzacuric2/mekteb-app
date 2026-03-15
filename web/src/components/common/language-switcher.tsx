import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

type Language = "en" | "sv" | "bs";

type LanguageSwitcherProps = {
  value: Language;
  onChange: (language: Language) => void;
  className?: string;
  compact?: boolean;
  fullWidth?: boolean;
};

const LANGUAGE_OPTIONS: Array<{ value: Language; label: string }> = [
  { value: "en", label: "EN" },
  { value: "sv", label: "SV" },
  { value: "bs", label: "BS" },
];

export function LanguageSwitcher({ value, onChange, className, compact = false, fullWidth = false }: LanguageSwitcherProps) {
  const [isCompactOpen, setIsCompactOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!compact || !isCompactOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setIsCompactOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [compact, isCompactOpen]);

  if (compact) {
    const activeLabel = LANGUAGE_OPTIONS.find((languageOption) => languageOption.value === value)?.label ?? value.toUpperCase();
    const otherOptions = LANGUAGE_OPTIONS.filter((languageOption) => languageOption.value !== value);
    return (
      <div ref={rootRef} className={cn("relative flex", className)}>
        <Button
          type="button"
          variant="default"
          className="min-w-[52px] px-3"
          aria-haspopup="menu"
          aria-expanded={isCompactOpen}
          onClick={() => setIsCompactOpen((prev) => !prev)}
        >
          {activeLabel}
        </Button>
        {isCompactOpen ? (
          <div className="absolute bottom-full left-1/2 z-20 mb-2 flex -translate-x-1/2 flex-col gap-1 rounded-md border border-border bg-white p-1 shadow-lg">
            {otherOptions.map((languageOption) => (
              <Button
                key={languageOption.value}
                type="button"
                variant="outline"
                className="min-w-[52px] px-3"
                onClick={() => {
                  onChange(languageOption.value);
                  setIsCompactOpen(false);
                }}
              >
                {languageOption.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2", fullWidth ? "w-full" : "", className)}>
      {LANGUAGE_OPTIONS.map((languageOption) => (
        <Button
          key={languageOption.value}
          type="button"
          variant={value === languageOption.value ? "default" : "outline"}
          aria-pressed={value === languageOption.value}
          className={cn(fullWidth ? "flex-1 justify-center" : "")}
          onClick={() => onChange(languageOption.value)}
        >
          {languageOption.label}
        </Button>
      ))}
    </div>
  );
}
