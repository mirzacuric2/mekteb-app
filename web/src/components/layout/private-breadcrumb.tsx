import { ReactNode } from "react";
import { ChevronRight, House } from "lucide-react";

type Props = {
  isDetailView: boolean;
  detailEntityId: string | null;
  /** When set (e.g. loaded entity name), shown instead of the raw id in the crumb chip. */
  detailEntityLabel?: string | null;
  dashboardLabel: string;
  sectionLabel: string;
  sectionIcon: ReactNode;
  onNavigateDashboard: () => void;
  onNavigateSection: () => void;
};

export function PrivateBreadcrumb({
  isDetailView,
  detailEntityId,
  detailEntityLabel,
  dashboardLabel,
  sectionLabel,
  sectionIcon,
  onNavigateDashboard,
  onNavigateSection,
}: Props) {
  return (
    <div className="flex min-h-8 min-w-0 flex-nowrap items-center gap-2 overflow-hidden text-sm text-slate-600">
      <button
        type="button"
        aria-label={dashboardLabel}
        className={`inline-flex shrink-0 items-center rounded-full border border-border bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 ${
          isDetailView ? "justify-center p-1.5 md:gap-2 md:px-3 md:py-1" : "justify-center gap-2 px-3 py-1"
        }`}
        onClick={onNavigateDashboard}
      >
        <House className="h-4 w-4" />
        <span className={isDetailView ? "hidden md:inline" : ""}>{dashboardLabel}</span>
      </button>
      <ChevronRight className="h-4 w-4 text-slate-400" />
      <button
        type="button"
        aria-label={sectionLabel}
        className={`inline-flex shrink-0 items-center rounded-full text-primary transition-colors hover:bg-primary/15 ${
          isDetailView
            ? "justify-center border border-primary/25 bg-primary/15 p-1.5 md:gap-2 md:px-3 md:py-1"
            : "justify-center gap-2 bg-primary/10 px-3 py-1"
        }`}
        onClick={onNavigateSection}
      >
        {sectionIcon}
        <span className={isDetailView ? "hidden md:inline" : ""}>{sectionLabel}</span>
        {isDetailView ? <span className="sr-only md:hidden">{sectionLabel}</span> : null}
      </button>
      {detailEntityId ? (
        <>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          <span
            className="inline-flex min-w-0 max-w-[min(62vw,28rem)] items-center rounded-full bg-slate-100 px-3 py-1 font-medium text-primary"
            title={detailEntityLabel?.trim() ? detailEntityLabel : detailEntityId}
          >
            <span className="truncate">{detailEntityLabel?.trim() || detailEntityId}</span>
          </span>
        </>
      ) : null}
    </div>
  );
}
