import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { formatDate, getIsoWeekYearAndNumber } from "../../lib/date-time";
import { CommunityEventsWeekDayCard } from "./community-events-week-day-card";
import { WEEK_SUMMARY_VARIANT, type WeekSummaryVariant } from "./constants";
import { CommunityEventsWeekParentSummary } from "./community-events-week-parent-summary";
import { EventOccurrenceRecord } from "./types";

type CommunityEventsCalendarProps = {
  occurrences: EventOccurrenceRecord[];
  weekStart: Date;
  onWeekChange: (nextWeekStart: Date) => void;
  canManageEvents: boolean;
  hoverActionsForDesktop: boolean;
  stackWeeklyDays?: boolean;
  dashboardPreview?: boolean;
  weekPreviewHint?: string;
  showParentWeekSummary?: boolean;
  weekSummaryVariant?: WeekSummaryVariant;
  onEditEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAY_IN_MS = 1000 * 60 * 60 * 24;

function toStartOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getWeekDateRangeEyebrow(weekStart: Date, weekEnd: Date, locale?: string) {
  const sameMonth =
    weekStart.getMonth() === weekEnd.getMonth() && weekStart.getFullYear() === weekEnd.getFullYear();
  const loc = locale && locale.length > 0 ? locale : undefined;
  if (sameMonth) {
    const monthYear = weekStart.toLocaleDateString(loc, { month: "long", year: "numeric" });
    return `${weekStart.getDate()}–${weekEnd.getDate()} ${monthYear}`;
  }
  return `${formatDate(weekStart)} – ${formatDate(weekEnd)}`;
}

export function CommunityEventsCalendar({
  occurrences,
  weekStart,
  onWeekChange,
  canManageEvents,
  hoverActionsForDesktop,
  stackWeeklyDays = false,
  dashboardPreview = false,
  weekPreviewHint,
  showParentWeekSummary = false,
  weekSummaryVariant = WEEK_SUMMARY_VARIANT.FAMILY,
  onEditEvent,
  onDeleteEvent,
}: CommunityEventsCalendarProps) {
  const { t, i18n } = useTranslation();
  const safeWeekStart = toStartOfWeek(weekStart);
  const weekEnd = addDays(safeWeekStart, 6);
  const weekThursday = addDays(safeWeekStart, 3);
  const { week: isoWeek, isoYear } = getIsoWeekYearAndNumber(weekThursday);
  const weekRangeEyebrow = getWeekDateRangeEyebrow(safeWeekStart, weekEnd, i18n.language);
  const weekDaysWithItems = DAY_NAMES.map((label, index) => {
    const date = addDays(safeWeekStart, index);
    const dayStartMs = date.getTime();
    const dayEndMs = dayStartMs + DAY_IN_MS;
    const dayItems = occurrences
      .filter((item) => {
        const itemStart = new Date(item.occurrenceStartAt).getTime();
        return itemStart >= dayStartMs && itemStart < dayEndMs;
      })
      .sort((left, right) => left.occurrenceStartAt.localeCompare(right.occurrenceStartAt));
    return { label, date, dayItems };
  });

  const dashboardStripDesktop = dashboardPreview && !stackWeeklyDays;

  return (
    <div className={dashboardPreview ? "min-w-0 space-y-3" : "space-y-3"}>
      <div>
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 w-9 shrink-0 px-0"
            onClick={() => onWeekChange(addDays(safeWeekStart, -7))}
            aria-label={t("eventsPreviousWeek")}
            title={t("eventsPreviousWeek")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1 px-1 text-center">
            <p className="text-[11px] font-medium text-slate-500">{weekRangeEyebrow}</p>
            <p className="text-base font-semibold leading-tight text-slate-900 sm:text-lg">
              {t("eventsCalendarIsoWeekHeading", { week: isoWeek, year: isoYear })}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-9 w-9 shrink-0 px-0"
            onClick={() => onWeekChange(addDays(safeWeekStart, 7))}
            aria-label={t("eventsNextWeek")}
            title={t("eventsNextWeek")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {weekPreviewHint ? <p className="mt-2 text-center text-xs leading-snug text-slate-500">{weekPreviewHint}</p> : null}
        {showParentWeekSummary ? (
          <div className="mt-2">
            <CommunityEventsWeekParentSummary
              occurrences={occurrences}
              weekStart={safeWeekStart}
              variant={weekSummaryVariant}
            />
          </div>
        ) : null}
      </div>

      <div
        className={
          stackWeeklyDays
            ? "grid grid-cols-1 gap-2"
            : dashboardStripDesktop
              ? "grid grid-cols-1 gap-2 lg:flex lg:min-w-0 lg:flex-nowrap lg:items-stretch lg:gap-2 lg:overflow-x-auto lg:pb-1 lg:[overscroll-behavior-x:contain] [-webkit-overflow-scrolling:touch]"
              : "flex min-w-0 flex-nowrap items-stretch gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] lg:overflow-x-auto lg:pb-1 lg:[overscroll-behavior-x:contain]"
        }
      >
        {weekDaysWithItems.map((day) => {
          const hasItems = day.dayItems.length > 0;
          const communityWeekWrapper =
            !stackWeeklyDays && !dashboardStripDesktop
              ? `h-full min-w-0 shrink-0 flex-[1_0_5.5rem] sm:flex-[1_0_6.5rem] ${hasItems ? "lg:min-w-[10rem] lg:flex-[1.45_1_0px]" : "lg:min-w-[7.5rem] lg:flex-[0.9_1_0px]"}`
              : undefined;
          const dashboardWrapper = dashboardStripDesktop
            ? `h-full min-w-0 w-full shrink-0 lg:w-auto ${hasItems ? "lg:min-w-[11rem] lg:flex-[3.75_1_0px]" : "lg:min-w-[7.5rem] lg:flex-[0.42_1_0px]"}`
            : undefined;
          return (
            <div
              key={day.label}
              className={stackWeeklyDays ? undefined : dashboardStripDesktop ? dashboardWrapper : communityWeekWrapper}
            >
              <CommunityEventsWeekDayCard
                label={day.label}
                date={day.date}
                dayItems={day.dayItems}
                isToday={sameDay(day.date, new Date())}
                canManageEvents={canManageEvents}
                hoverActionsForDesktop={hoverActionsForDesktop}
                onEditEvent={onEditEvent}
                onDeleteEvent={onDeleteEvent}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
