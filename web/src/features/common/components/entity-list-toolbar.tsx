import { type ReactNode } from "react";
import { DebouncedSearchInput } from "./debounced-search-input";

type EntityListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  actions?: ReactNode;
  mobileInline?: boolean;
};

export function EntityListToolbar({
  search,
  onSearchChange,
  placeholder = "Search...",
  actions,
  mobileInline = false,
}: EntityListToolbarProps) {
  return (
    <div
      className={
        mobileInline
          ? "flex items-center gap-2 md:gap-3 md:justify-between"
          : "flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      }
    >
      <div className={mobileInline ? "min-w-0 flex-1 md:max-w-sm" : "w-full md:max-w-sm"}>
        <DebouncedSearchInput
          value={search}
          onDebouncedChange={onSearchChange}
          delayMs={700}
          placeholder={placeholder}
        />
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
