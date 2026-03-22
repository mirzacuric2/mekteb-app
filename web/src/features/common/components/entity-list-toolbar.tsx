import { type ReactNode } from "react";
import { DebouncedSearchInput } from "./debounced-search-input";

export const ENTITY_LIST_TOOLBAR_CREATE_BUTTON_CLASSNAME =
  "h-8 w-8 shrink-0 border-primary/35 px-0 py-0 text-xs text-primary hover:bg-primary/[0.08] hover:text-primary md:h-8 md:w-auto md:gap-1.5 md:px-2.5 md:text-sm";

export const ENTITY_LIST_TOOLBAR_CREATE_ICON_CLASSNAME = "h-3.5 w-3.5 shrink-0 md:h-4 md:w-4";

export const ENTITY_LIST_TOOLBAR_FILTER_SELECT_CLASSNAME = "h-8 py-1 text-xs";

export const ENTITY_LIST_TOOLBAR_ACTION_LABEL_CLASSNAME = "hidden md:inline";

export const ENTITY_LIST_TO_TABLE_STACK_CLASSNAME = "space-y-5";

export const MANAGEMENT_PAGE_CARD_CLASSNAME = "min-w-0 p-5";

export const MANAGEMENT_PAGE_CARD_STACK_CLASSNAME = "space-y-5";

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
    <div className="flex items-center gap-2 md:gap-3 md:justify-between">
      <div className="min-w-0 flex-1 md:max-w-sm">
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
