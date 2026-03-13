import { type ReactNode } from "react";
import { DebouncedSearchInput } from "./debounced-search-input";

type EntityListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  actions?: ReactNode;
};

export function EntityListToolbar({
  search,
  onSearchChange,
  placeholder = "Search...",
  actions,
}: EntityListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="w-full md:max-w-sm">
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
