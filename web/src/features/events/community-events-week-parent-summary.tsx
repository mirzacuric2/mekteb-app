import { useMemo, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarClock, CalendarDays, Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/card";
import { formatTime } from "../../lib/date-time";
import { WEEK_SUMMARY_VARIANT, type WeekSummaryVariant } from "./constants";
import { EventOccurrenceRecord } from "./types";
import { buildParentWeekEventsSummary, filterOccurrencesInLocalWeek } from "./parent-week-events-summary";

type CommunityEventsWeekParentSummaryProps = {
  occurrences: EventOccurrenceRecord[];
  weekStart: Date;
  variant?: WeekSummaryVariant;
};

function MiniStatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <Card className="h-full border-slate-200/90 bg-white p-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <div className="mt-0.5 text-base font-semibold leading-tight tabular-nums text-slate-900">{value}</div>
          {detail ? (
            <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-600" title={detail}>
              {detail}
            </p>
          ) : null}
        </div>
        <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </Card>
  );
}

export function CommunityEventsWeekParentSummary({
  occurrences,
  weekStart,
  variant = WEEK_SUMMARY_VARIANT.FAMILY,
}: CommunityEventsWeekParentSummaryProps) {
  const { t, i18n } = useTranslation();
  const isCommunity = variant === WEEK_SUMMARY_VARIANT.COMMUNITY;
  const titleKey = isCommunity ? "eventsCommunityWeekSummaryTitle" : "eventsParentWeekSummaryTitle";
  const emptyKey = isCommunity ? "eventsCommunityWeekSummaryEmpty" : "eventsParentWeekSummaryEmpty";
  const byChildKey = isCommunity ? "eventsCommunityWeekSummaryByChild" : "eventsParentWeekSummaryByChild";
  const noUpcomingKey = isCommunity
    ? "eventsCommunityWeekSummaryNoUpcomingShort"
    : "eventsParentWeekSummaryNoUpcomingShort";
  const model = useMemo(() => {
    const weekItems = filterOccurrencesInLocalWeek(occurrences, weekStart);
    return buildParentWeekEventsSummary(weekItems);
  }, [occurrences, weekStart]);

  if (model.total === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">{t(titleKey)}</p>
        <Card className="border-dashed border-slate-200 bg-slate-50/60 p-3 text-center shadow-none">
          <p className="text-xs text-slate-600">{t(emptyKey)}</p>
        </Card>
      </div>
    );
  }

  const nextAt = model.next ? new Date(model.next.occurrenceStartAt) : null;
  const nextWeekday =
    nextAt &&
    nextAt.toLocaleDateString(i18n.language?.length ? i18n.language : undefined, { weekday: "short" });

  const nextDetail =
    model.next && nextWeekday
      ? t("eventsParentWeekSummaryNextWhen", {
          weekday: nextWeekday,
          time: formatTime(model.next.occurrenceStartAt),
        })
      : undefined;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-600">{t(titleKey)}</p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <MiniStatCard
          label={t("eventsParentWeekSummaryCardEvents")}
          value={model.total}
          icon={CalendarDays}
          tone="bg-slate-100 text-slate-700"
        />
        <MiniStatCard
          label={t("eventsParentWeekSummaryCardUpcoming")}
          value={model.upcomingCount}
          icon={Clock3}
          tone="bg-sky-100 text-sky-700"
        />
        <MiniStatCard
          label={t("eventsParentWeekSummaryCardNext")}
          value={
            model.next ? (
              <span className="line-clamp-2 break-words text-sm font-semibold">{model.next.event.title}</span>
            ) : (
              "—"
            )
          }
          detail={model.next ? nextDetail : t(noUpcomingKey)}
          icon={CalendarClock}
          tone="bg-violet-100 text-violet-700"
        />
      </div>

      {model.perChildOccurrences.length > 0 ? (
        <Card className="border-slate-200/80 bg-slate-50/50 p-2.5 shadow-none">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {t(byChildKey)}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-700">
            {model.perChildOccurrences.map(({ name, count }, index) => (
              <span key={name}>
                {index > 0 ? <span className="text-slate-400"> · </span> : null}
                {t("eventsParentWeekSummaryChildOccurrences", { name, count })}
              </span>
            ))}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
