import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { CommunityEventsMonthDayCard } from "./community-events-month-day-card";
import { EventOccurrenceRecord } from "./types";

type CommunityEventsMonthCalendarProps = {
  occurrences: EventOccurrenceRecord[];
  monthCursor: Date;
  highlightDaysWithEvents?: boolean;
  canManageEvents: boolean;
  hoverActionsForDesktop: boolean;
  onMonthChange: (nextMonth: Date) => void;
  onEditEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onCreateFromDay: (date: Date) => void;
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAY_IN_MS = 1000 * 60 * 60 * 24;

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  const next = new Date(start);
  next.setDate(next.getDate() + 6);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatMonthTitle(date: Date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function CommunityEventsMonthCalendar({
  occurrences,
  monthCursor,
  highlightDaysWithEvents = false,
  canManageEvents,
  hoverActionsForDesktop,
  onMonthChange,
  onEditEvent,
  onDeleteEvent,
  onCreateFromDay,
}: CommunityEventsMonthCalendarProps) {
  const { t } = useTranslation();
  const monthStart = startOfMonth(monthCursor);
  const monthEnd = endOfMonth(monthCursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days: Date[] = [];
  let cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    days.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-8 w-8 px-0"
          onClick={() => onMonthChange(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
          aria-label={t("eventsPreviousMonth")}
          title={t("eventsPreviousMonth")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-medium text-slate-700">{formatMonthTitle(monthCursor)}</p>
        <Button
          type="button"
          variant="outline"
          className="h-8 w-8 px-0"
          onClick={() => onMonthChange(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
          aria-label={t("eventsNextMonth")}
          title={t("eventsNextMonth")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {DAY_NAMES.map((dayName) => (
          <p key={dayName} className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {dayName}
          </p>
        ))}
        {days.map((day) => {
          const isInDisplayedMonth =
            day.getFullYear() === monthCursor.getFullYear() && day.getMonth() === monthCursor.getMonth();

          if (!isInDisplayedMonth) {
            return (
              <div
                key={day.toISOString()}
                className="min-h-[128px] rounded-lg border border-transparent bg-transparent"
                aria-hidden
              />
            );
          }

          const dayStartMs = day.getTime();
          const dayEndMs = dayStartMs + DAY_IN_MS;
          const dayItems = occurrences
            .filter((item) => {
              const itemStart = new Date(item.occurrenceStartAt).getTime();
              return itemStart >= dayStartMs && itemStart < dayEndMs;
            })
            .sort((left, right) => left.occurrenceStartAt.localeCompare(right.occurrenceStartAt));

          return (
            <CommunityEventsMonthDayCard
              key={day.toISOString()}
              day={day}
              monthCursor={monthCursor}
              dayItems={dayItems}
              highlightHasEvents={highlightDaysWithEvents}
              canManageEvents={canManageEvents}
              hoverActionsForDesktop={hoverActionsForDesktop}
              onEditEvent={onEditEvent}
              onDeleteEvent={onDeleteEvent}
              onCreateFromDay={onCreateFromDay}
            />
          );
        })}
      </div>
    </div>
  );
}
