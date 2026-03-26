import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";

type Segment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type Props = {
  title: string;
  subtitle: string;
  titleIcon?: LucideIcon;
  titleIconClassName?: string;
  segments: Segment[];
  emptyText: string;
  noDataLabel: string;
  totalLabel?: string;
};

const CHART_SIZE = 140;
const STROKE_WIDTH = 18;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CommunityDonutChart({
  title,
  subtitle,
  titleIcon: TitleIcon,
  titleIconClassName,
  segments,
  emptyText,
  noDataLabel,
  totalLabel,
}: Props) {
  const { t } = useTranslation();
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const segmentsWithData = segments.filter((segment) => segment.value > 0);
  const emptySegments = segments.filter((segment) => segment.value === 0);

  return (
    <div className="rounded-xl border border-border p-3 sm:p-4">
      <div className="mb-3 flex gap-2.5 sm:gap-3">
        {TitleIcon ? (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 sm:h-10 sm:w-10",
              titleIconClassName
            )}
          >
            <TitleIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight text-slate-800">{title}</p>
          <p className="text-xs leading-tight text-slate-500">{subtitle}</p>
        </div>
      </div>

      {total > 0 ? (
        <div className="flex min-w-0 flex-col items-center gap-2.5 sm:gap-3 md:flex-row md:items-start md:gap-5">
          <div className="relative h-[112px] w-[112px] shrink-0 sm:h-[132px] sm:w-[132px] md:h-[140px] md:w-[140px]">
            <svg viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`} className="h-full w-full -rotate-90">
              <circle
                cx={CHART_SIZE / 2}
                cy={CHART_SIZE / 2}
                r={RADIUS}
                fill="transparent"
                stroke="currentColor"
                className="text-slate-200"
                strokeWidth={STROKE_WIDTH}
              />
              {segmentsWithData.reduce(
                (state, segment) => {
                  const fraction = segment.value / total;
                  const length = fraction * CIRCUMFERENCE;
                  const gap = CIRCUMFERENCE - length;
                  const segmentCircle = (
                    <circle
                      key={segment.key}
                      cx={CHART_SIZE / 2}
                      cy={CHART_SIZE / 2}
                      r={RADIUS}
                      fill="transparent"
                      stroke="currentColor"
                      style={{ color: segment.color }}
                      strokeWidth={STROKE_WIDTH}
                      strokeDasharray={`${length} ${gap}`}
                      strokeDashoffset={state.offset}
                      strokeLinecap="butt"
                    />
                  );
                  return {
                    offset: state.offset - length,
                    nodes: [...state.nodes, segmentCircle],
                  };
                },
                { offset: 0, nodes: [] as React.ReactNode[] }
              ).nodes}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xl font-semibold text-slate-900 sm:text-2xl">{total}</p>
              <p className="text-xs text-slate-500">{totalLabel || t("communityOverviewChartTotalLabel")}</p>
            </div>
          </div>
          <div className="min-w-0 w-full space-y-1 sm:space-y-1.5 md:w-auto md:min-w-[240px] md:max-w-[320px]">
            {segmentsWithData.map((segment) => {
              const percentage = total ? Math.round((segment.value / total) * 100) : 0;
              return (
                <div
                  key={segment.key}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm"
                >
                  <span className="inline-flex min-w-0 items-center gap-2 text-slate-700">
                    <span className="h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5" style={{ backgroundColor: segment.color }} />
                    <span className="truncate">{segment.label}</span>
                  </span>
                  <span className="text-right text-slate-900">
                    {segment.value} ({percentage}%)
                  </span>
                </div>
              );
            })}
            {emptySegments.length ? (
              <div className="mt-2 border-t border-border pt-2">
                <p className="text-xs font-medium text-slate-500">{noDataLabel}</p>
                <p className="text-xs text-slate-400">{emptySegments.map((segment) => segment.label).join(", ")}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-slate-400">0</div>
          <p className="text-sm text-slate-500">{emptyText}</p>
        </div>
      )}
    </div>
  );
}
