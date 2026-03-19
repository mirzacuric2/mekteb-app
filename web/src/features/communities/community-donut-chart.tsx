import { useTranslation } from "react-i18next";

type Segment = {
  key: string;
  label: string;
  value: number;
  colorClass: string;
  dotClass: string;
};

type Props = {
  title: string;
  subtitle: string;
  segments: Segment[];
  emptyText: string;
  noDataLabel: string;
};

const CHART_SIZE = 140;
const STROKE_WIDTH = 18;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CommunityDonutChart({ title, subtitle, segments, emptyText, noDataLabel }: Props) {
  const { t } = useTranslation();
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const segmentsWithData = segments.filter((segment) => segment.value > 0);
  const emptySegments = segments.filter((segment) => segment.value === 0);

  return (
    <div className="rounded-md border border-border p-4">
      <p className="text-sm font-medium text-slate-800">{title}</p>
      <p className="mb-3 text-xs text-slate-500">{subtitle}</p>

      {total > 0 ? (
        <div className="flex min-w-0 flex-col items-center gap-3 md:flex-row md:items-start md:gap-5">
          <div className="relative h-[140px] w-[140px] shrink-0">
            <svg width={CHART_SIZE} height={CHART_SIZE} className="-rotate-90">
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
                      className={segment.colorClass}
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
              <p className="text-2xl font-semibold text-slate-900">{total}</p>
              <p className="text-xs text-slate-500">{t("communityOverviewChartTotalLabel")}</p>
            </div>
          </div>
          <div className="min-w-0 w-full space-y-1 md:w-auto md:min-w-[240px] md:max-w-[320px]">
            {segmentsWithData.map((segment) => {
              const percentage = total ? Math.round((segment.value / total) * 100) : 0;
              return (
                <div
                  key={segment.key}
                  className="grid grid-cols-1 gap-y-0.5 text-sm md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-x-3 md:gap-y-0"
                >
                  <span className="inline-flex min-w-0 items-center gap-2 text-slate-700">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${segment.dotClass}`} />
                    <span className="truncate">{segment.label}</span>
                  </span>
                  <span className="pl-5 text-slate-900 md:pl-0 md:text-right">
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
