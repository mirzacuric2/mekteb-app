import { CalendarCheck2, CalendarDays, Clock3, Repeat } from "lucide-react";
import { Card } from "../../components/ui/card";
import { EVENT_RECURRENCE, EventOccurrenceRecord } from "./types";

export const EVENT_SUMMARY_FILTER = {
  ALL: "ALL",
  ACTIVE_DAYS: "ACTIVE_DAYS",
  WEEKLY: "WEEKLY",
  UPCOMING: "UPCOMING",
} as const;

export type EventSummaryFilter = (typeof EVENT_SUMMARY_FILTER)[keyof typeof EVENT_SUMMARY_FILTER];

type CommunityEventsSummaryCardsProps = {
  monthCursor: Date;
  occurrences: EventOccurrenceRecord[];
  title: string;
  totalLabel: string;
  activeDaysLabel: string;
  recurringWeeklyLabel: string;
  upcomingLabel: string;
  activeFilter: EventSummaryFilter;
  onFilterChange: (nextFilter: EventSummaryFilter) => void;
};

function isSameMonth(date: Date, monthCursor: Date) {
  return date.getFullYear() === monthCursor.getFullYear() && date.getMonth() === monthCursor.getMonth();
}

export function CommunityEventsSummaryCards({
  monthCursor,
  occurrences,
  title,
  totalLabel,
  activeDaysLabel,
  recurringWeeklyLabel,
  upcomingLabel,
  activeFilter,
  onFilterChange,
}: CommunityEventsSummaryCardsProps) {
  const monthItems = occurrences.filter((item) => isSameMonth(new Date(item.occurrenceStartAt), monthCursor));
  const uniqueDayKeys = new Set(monthItems.map((item) => item.occurrenceStartAt.slice(0, 10)));
  const recurringWeeklyEventIds = new Set(
    monthItems
      .filter((item) => item.event.recurrence === EVENT_RECURRENCE.WEEKLY)
      .map((item) => item.event.id)
  );
  const nowMs = Date.now();
  const upcomingCount = monthItems.filter((item) => new Date(item.occurrenceStartAt).getTime() >= nowMs).length;

  const stats: Array<{
    key: EventSummaryFilter;
    label: string;
    value: number;
    icon: typeof CalendarDays;
    tone: string;
  }> = [
    {
      key: EVENT_SUMMARY_FILTER.ALL,
      label: totalLabel,
      value: monthItems.length,
      icon: CalendarDays,
      tone: "bg-slate-100 text-slate-700",
    },
    {
      key: EVENT_SUMMARY_FILTER.ACTIVE_DAYS,
      label: activeDaysLabel,
      value: uniqueDayKeys.size,
      icon: CalendarCheck2,
      tone: "bg-emerald-100 text-emerald-700",
    },
    {
      key: EVENT_SUMMARY_FILTER.WEEKLY,
      label: recurringWeeklyLabel,
      value: recurringWeeklyEventIds.size,
      icon: Repeat,
      tone: "bg-violet-100 text-violet-700",
    },
    {
      key: EVENT_SUMMARY_FILTER.UPCOMING,
      label: upcomingLabel,
      value: upcomingCount,
      icon: Clock3,
      tone: "bg-sky-100 text-sky-700",
    },
  ];

  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-slate-50/60 p-3">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
          <Card
            key={stat.label}
            role="button"
            tabIndex={0}
            className={`p-3 transition-all ${
              activeFilter === stat.key
                ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                : "cursor-pointer bg-white/90 hover:border-primary/40 hover:shadow-sm"
            }`}
            onClick={() => onFilterChange(stat.key)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onFilterChange(stat.key);
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-600">{stat.label}</p>
                <p className="text-2xl font-semibold leading-tight text-slate-900">{stat.value}</p>
              </div>
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${stat.tone}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
